import axios from 'axios';
import User from '../../../models/User/User.js';
import { OpenAI } from 'openai';

async function sendMessageToOpenAI(userId, messages, model, stepId, socket) {
    // Retrieve user from database and immediately check for errors
    const user = await User.findById(userId).orFail(() => new Error("User not found"));
    
    if (!user.APIKey) {
        throw new Error("API Key is missing for user");
    }
    
    // Initialize OpenAI client with the user's API Key
    const openai = new OpenAI({
        apiKey: user.APIKey
    });

    // Send message to OpenAI and await the stream of events
    const events = await openai.chat.completions.create({
        messages: messages,
        model: model,
        stream: true
    });

    let response = '';
    // Efficiently process each event and handle socket emission
    for await (const event of events) {
        const content = event.choices.map(choice => choice.delta?.content).filter(Boolean).join('');
        response += content;
        if (socket && content) {
            socket.emit('message', { stepId, response, status: 'loading'});
        }
    }
    if (socket && response) {
        socket.emit('message', { stepId, response, status: 'done'});
    }
    
    return response;
}

export {
    sendMessageToOpenAI
};
