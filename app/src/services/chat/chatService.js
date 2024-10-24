import Chat from '../../models/Chat/Chat.js';
import Message from '../../models/Message/Message.js';
import Workspace from '../../models/Workspace/Workspace.js';
import Model from '../../models/Model/Model.js';
import path from 'path';
import fs from 'fs/promises';
import { sendMessageToAzureOpenAI } from '../llms/azureOpenAIService/azureOpenAIService.js';
import { messageGenerationService } from '../generationService/messageService/messageService.js';
import { searchService } from '../search/searchService.js';
import Document from '../../models/Document/Document.js';
import mongoose from 'mongoose';
import Chunk from '../../models/Chunk/Chunk.js';
import { loadPrompt } from '../prompts/promptsService.js';
import { handleChatHistory, handleSearchChunks, handleSearchDocuments } from '../search/strategyService/strategyService.js';
import { saveMessage } from '../message/messageService.js';


async function deleteChat(chatId) {
    try {
        // 1. Verify that the chat exists
        const objectId = new mongoose.Types.ObjectId(chatId);
        const chat = await Chat.findById(objectId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        // 2. Delete the chat
        await Chat.findByIdAndDelete(objectId);

        // 4. Delete all messages associated with the chat
        const deletedMessages = await Message.deleteMany({ chatId: objectId });

        // 5. Return the result
        return {
            message: "Chat and associated messages deleted successfully",
            deletedMessagesCount: deletedMessages.deletedCount,
        };

    } catch (error) {
        // Propagate the error to be handled in the endpoint
        throw error;
    }
}

function formatChatHistory(chatHistory) {
    // Formater l'historique des messages pour le prompt
    return chatHistory.map(msg => `[${msg.sender}]: ${msg.text}`).join('\n');
}

async function executeMessage(message, chatId, userId, socket) {
    try {
        // Récupérer le chat par son ID
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error('Chat introuvable');
        }

        await saveMessage(chatId, message, 'user');

        // Vérifier l'accès de l'utilisateur au workspace
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== userId) {
            throw new Error('Accès non autorisé');
        }

        const chatHistory = await Message.find({ chatId: chat._id }).sort({ creationDate: 1 });
        const formattedChatHistory = formatChatHistory(chatHistory);

        const documents = await Document.find({ workspaceId: workspace._id }).select('name');
        const documentTitles = documents.map(doc => doc.name);

        const modelId = chat.modelId;
        let context = {
            query: message,
            chatHistory: formattedChatHistory,
            documents: documentTitles,
        };

        const model = await Model.findById(modelId).orFail(new Error("Unkonwn Model"));

        const followUpPromptPath = '/followUpQuestion/followUpQuestion';
        const followUpPrompt = await loadPrompt(followUpPromptPath, context);
        const needFollowUp = await sendMessageToAzureOpenAI(followUpPrompt, model);

        if (needFollowUp === 'true') {
            socket.emit('message', { response: "Answering...", status: 'loading', type: 'progress' });
            const followUpQuestionPath = '/followUpQuestion/true/followUpQuestionTrue';
            const followUpQuestionPrompt = await loadPrompt(followUpQuestionPath, context);
            const followUpQuestion = await sendMessageToAzureOpenAI(followUpQuestionPrompt, model, socket);

            await saveMessage(chatId, message, 'agent');

            return followUpQuestion;

        } else {
            socket.emit('message', { response: "Determining use-case...", status: 'loading', type: 'progress' });
            const searchPromptPath = '/Search/searchPrompt';
            const searchPrompt = await loadPrompt(searchPromptPath, context);
            const strategy = await sendMessageToAzureOpenAI(searchPrompt, model);

            switch (strategy) {
                case "1": {
                    return await handleChatHistory(chat, context, model, socket);
                }
                case "2": {
                    return await handleSearchChunks(chat, context, model, socket);
                }
                case "3": {
                    return await handleSearchDocuments(chat, context, model, socket);
                }
                default:
                    console.error('Stratégie inconnue :', strategy);
                    throw new Error('Stratégie inconnue');
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'exécution du message :', error);
        throw error;
    }
}

export {
    executeMessage,
    deleteChat
};
