import Document from "../../../models/Document/Document.js";
import { messageGenerationService } from "../../generationService/messageService/messageService.js";
import { sendMessageToAzureOpenAI } from "../../llms/azureOpenAIService/azureOpenAIService.js";
import { saveMessage } from "../../message/messageService.js";
import { loadPrompt } from "../../prompts/promptsService.js";
import { searchService } from "../searchService.js";

async function handleChatHistory(chat, context, model, socket) {
    const chatId = chat._id;
    socket.emit('message', { response: 'Determining use-case: ChatHistory', status: 'loading', type: 'progress' });
    
    const answerChatHistoryPath = '/Search/chatHistory/answerChatHistory';
    console.log(answerChatHistoryPath);

    const answerChatHistoryPrompt = await loadPrompt(answerChatHistoryPath, context);
    const answerChatHistory = await sendMessageToAzureOpenAI(answerChatHistoryPrompt, model, socket);

    await saveMessage(chatId, answerChatHistory, 'agent');

    return answerChatHistory;
}

async function handleSearchChunks(chat, context, model, socket) {
    const chatId = chat._id;
    const modelId = chat.modelId;

    socket.emit('message', { response: 'Determining use-case: SearchChunks', status: 'loading', type: 'progress' });
    
    const SearchChunksPath = '/Search/information/searchInformation';

    const SearchChunksPrompt = await loadPrompt(SearchChunksPath, context);
    const SearchChunksQueries = (await sendMessageToAzureOpenAI(SearchChunksPrompt, model))            
    .replaceAll('```', '')
    .replace('json', '')
    .replaceAll('\n', '')
    .replaceAll(/\\/g, '');

    let queries;
    try {
        queries = JSON.parse(SearchChunksQueries);
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

    const SearchChunksAnswer = await messageGenerationService(context, modelId, chatId, socket);


    await saveMessage(chatId, SearchChunksAnswer, 'agent');

    return SearchChunksAnswer;
}

async function handleSearchDocuments(chat, context, model, socket) {
    const chatId = chat._id;
    socket.emit('message', { response: 'Determining use-case: SearchDocuments', status: 'loading', type: 'progress' });
    
    const SearchDocumentsPath = '/Search/document/searchDocument';

    const SearchDocumentsPrompt = await loadPrompt(SearchDocumentsPath, context);
    const SearchDocumentsQueries = (await sendMessageToAzureOpenAI(SearchDocumentsPrompt, model))            
    .replaceAll('```', '')
    .replace('json', '')
    .replaceAll('\n', '')
    .replaceAll(/\\/g, '');

    let queries;
    try {
        queries = JSON.parse(SearchDocumentsQueries);
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
    const answerMeetingSummaryPrompt = (await loadPrompt(answerMeetingSummaryPath, context));
    console.log('answerMeetingSummaryPrompt', answerMeetingSummaryPrompt);
    const response = await sendMessageToAzureOpenAI(answerMeetingSummaryPrompt, model, socket);

    await saveMessage(chatId, response, 'agent');

    return SearchDocumentsAnswer;
}

export { handleChatHistory, handleSearchChunks, handleSearchDocuments };