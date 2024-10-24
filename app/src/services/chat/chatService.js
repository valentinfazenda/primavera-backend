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

        // Sauvegarder le message de l'utilisateur
        const userMessage = new Message({
            chatId: chat._id,
            text: message,
            sender: 'user'
        });
        await userMessage.save();

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

        const model = await Model.findById(modelId).orFail(new Error("Modèle introuvable"));

        // Étape 1 : Vérifier si une question de suivi est nécessaire
        const followUpPromptPath = '/followUpQuestion/followUpQuestion';
        const followUpPrompt = await loadPrompt(followUpPromptPath, context);
        const needFollowUp = await sendMessageToAzureOpenAI(followUpPrompt, model);

        if (needFollowUp === 'true') {
            // Générer et retourner la question de suivi
            socket.emit('message', { response: "Answering...", status: 'loading', type: 'progress' });
            const followUpQuestionPath = '/followUpQuestion/true/followUpQuestionTrue';
            const followUpQuestionPrompt = await loadPrompt(followUpQuestionPath, context);
            const followUpQuestion = await sendMessageToAzureOpenAI(followUpQuestionPrompt, model, socket);

            const agentMessage = new Message({
                chatId: chat._id,
                text: followUpQuestion,
                sender: 'agent'
            });
            await agentMessage.save();

            return followUpQuestion;

        } else {
            socket.emit('message', { response: "Determining use-case...", status: 'loading', type: 'progress' });
            // Déterminer la stratégie à utiliser
            const searchPromptPath = '/Search/searchPrompt';
            const searchPrompt = await loadPrompt(searchPromptPath, context);
            const strategy = await sendMessageToAzureOpenAI(searchPrompt, model);

            switch (strategy) {
                case "1": {
                    // Répondre en utilisant l'historique du chat
                    socket.emit('message', { response: 'Determining use-case: ChatHistory', status: 'loading', type: 'progress' });
                    const answerChatHistoryPath = '/Search/chatHistory/answerChatHistory';
                    console.log(answerChatHistoryPath);
                    const answerChatHistoryPrompt = await loadPrompt(answerChatHistoryPath, context);

                    const answerChatHistory = await sendMessageToAzureOpenAI(answerChatHistoryPrompt, model, socket);

                    const agentMessage = new Message({
                        chatId: chat._id,
                        text: answerChatHistory,
                        sender: 'agent'
                    });
                    await agentMessage.save();

                    return answerChatHistory;
                }
                case "2": {
                    socket.emit('message', { response: 'Determining use-case: Search Information', status: 'loading', type: 'progress' });
                    const searchInfoPath = '/Search/information/searchInformation';
                    const searchInfoPrompt = await loadPrompt(searchInfoPath, context);
                    const queriesResponse = (await sendMessageToAzureOpenAI(searchInfoPrompt, model))            
                    .replaceAll('```', '')
                    .replace('json', '')
                    .replaceAll('\n', '')
                    .replaceAll(/\\/g, '');

                    let queries;
                    try {
                        queries = JSON.parse(queriesResponse);
                    } catch (error) {
                        throw new Error('Erreur lors de l\'analyse des requêtes JSON');
                    }

                    let chunks = [];
                    if (queries.queries && queries.queries.length > 0) {
                        const searchPromises = queries.queries.map(query => searchService(query, chat.workspaceId));
                        const results = await Promise.all(searchPromises);
                        chunks.push(...results);
                    }

                    context = { 
                        ...context,
                        chunks: JSON.stringify(chunks),
                    };

                    const response = await messageGenerationService(context, modelId, chatId, socket);

                    const agentMessage = new Message({
                        chatId: chat._id,
                        text: response,
                        sender: 'agent'
                    });
                    await agentMessage.save();

                    return response;
                }
                case "3": {
                    // Implémentation pour le cas "3"
                    socket.emit('message', { response: 'Determining use-case: Search Document', status: 'loading', type: 'progress' });
                    console.log('case 3: search document');
                    const searchSummaryPath = '/Search/document/searchDocument';
                    const searchSummaryPrompt = await loadPrompt(searchSummaryPath, context);
                    const queriesResponse = (await sendMessageToAzureOpenAI(searchSummaryPrompt, model))            
                        .replaceAll('```', '')
                        .replace('json', '')
                        .replaceAll('\n', '')
                        .replaceAll(/\\/g, '');

                    let queries;
                    console.log('queriesResponse', queriesResponse);
                    try {
                        queries = JSON.parse(queriesResponse);
                    } catch (error) {
                        throw new Error('Erreur lors de l\'analyse des requêtes JSON');
                    }

                    let chunks = [];
                    console.log('queries', queries.queries);   
                    if (queries.queries && queries.queries.length > 0) {
                        const searchPromises = queries.queries.map(query => searchService(query, chat.workspaceId));
                        const results = await Promise.all(searchPromises);
                        chunks.push(...results);
                    }
                    console.log('chunks', chunks);

                    // Aplatir le tableau 'chunks' pour obtenir un seul niveau
                    let flattenedChunks = chunks.flat();
                    
                    // Collecter les documentIds à partir des chunks aplatis
                    let documentIds = new Set();
                    for (const chunk of flattenedChunks) {
                        if (chunk.documentId) {
                            console.log('chunk.documentId', chunk.documentId);
                            documentIds.add(chunk.documentId.toString());
                        }
                    }
                    console.log('documentIds', documentIds);

                    // Récupérer les documents complets à partir des documentIds
                    const documents = await Document.find({ _id: { $in: Array.from(documentIds) } });
                    const documentsFulltexts = documents.map(doc => doc.fulltext);

                    // Ajouter les fulltexts des documents au contexte
                    context = { 
                        ...context,
                        documents: documentsFulltexts,
                    };
                    /// case summary


                                        
                    // Rechercher des informations et générer une réponse
                    const answerMeetingSummaryPath = '/Search/document/summary/meeting/meetingAnswer';
                    const answerMeetingSummaryPrompt = (await loadPrompt(answerMeetingSummaryPath, context)).replace(/{{\$document}}/g, context.documents);;
                    console.log('answerMeetingSummaryPrompt', answerMeetingSummaryPrompt);
                    const response = await sendMessageToAzureOpenAI(answerMeetingSummaryPrompt, model, socket);

                    const agentMessage = new Message({
                        chatId: chat._id,
                        text: response,
                        sender: 'agent'
                    });
                    await agentMessage.save();

                    return response;
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
