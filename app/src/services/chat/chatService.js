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

async function loadPrompt(filePath, context) {
    const template = await fs.readFile(filePath, 'utf8');
    return template
        .replace(/{{\$chatHistory}}/g, context.chatHistory)
        .replace(/{{\$query}}/g, context.query);
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
        const followUpPromptPath = path.resolve('app/src/prompts/followUpQuestion/followUpQuestion.txt');
        const followUpPrompt = (await loadPrompt(followUpPromptPath, context)).replace(/{{\$documents}}/g, context.documents);
        const needFollowUp = await sendMessageToAzureOpenAI(followUpPrompt, model);

        if (needFollowUp === 'true') {
            // Générer et retourner la question de suivi
            const followUpQuestionPath = path.resolve('app/src/prompts/followUpQuestion/true/followUpQuestionTrue.txt');
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
            // Déterminer la stratégie à utiliser
            const searchPromptPath = path.resolve('app/src/prompts/Search/search.txt');
            const searchPrompt = await loadPrompt(searchPromptPath, context);
            const strategy = await sendMessageToAzureOpenAI(searchPrompt, model);

            switch (strategy) {
                case "1": {
                    // Répondre en utilisant l'historique du chat
                    console.log('case 1');
                    const answerChatHistoryPath = path.resolve('app/src/prompts/Search/chatHistory/answerChatHistory.txt');
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
                    console.log('case 2');
                    // Rechercher des informations et générer une réponse
                    const searchInfoPath = path.resolve('app/src/prompts/Search/information/searchInformation.txt');
                    const searchInfoPrompt = await loadPrompt(searchInfoPath, context);
                    const queriesResponse = await sendMessageToAzureOpenAI(searchInfoPrompt, model);

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
                    // Implémentation similaire pour le cas "3"
                    console.log('case 3');
                    const searchSummaryPath = path.resolve('app/src/prompts/Search/document/searchDocument.txt');
                    const searchSummaryPrompt = await loadPrompt(searchSummaryPath, context);
                    const queriesResponse = await sendMessageToAzureOpenAI(searchSummaryPrompt, model);

                    let queries;
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
    executeMessage
};
