import { OpenAI } from 'openai';

async function sendMessageToOpenAI( messages, model, socket) {
    const apiKey = model.apiKey;
    
    if (!apiKey) {
        throw new Error("API Key is missing for model");
    }
    
    // Initialize OpenAI client with the user's API Key
    const openai = new OpenAI({
        apiKey
    });

    // Send message to OpenAI and await the stream of events
    const events = await openai.chat.completions.create({
        messages: messages,
        model: model.name,
        stream: true
    });

    let response = '';
    // Efficiently process each event and handle socket emission
    for await (const event of events) {
        const content = event.choices.map(choice => choice.delta?.content).filter(Boolean).join('');
        response += content;
        if (socket && content) {
            socket.emit('message', { response, status: 'loading'});
        }
    }
    if (socket && response) {
        socket.emit('message', { response, status: 'done'});
    }
    
    return response;
}

export {
    sendMessageToOpenAI
};
