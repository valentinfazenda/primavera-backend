const axios = require('axios');
const User = require('../../../models/User/User');
const { OpenAI } = require('openai');

async function sendMessageToOpenAI(userId, messages, model, socket) {
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
            socket.emit('message', content);
        }
    }
    
    return response;
}

module.exports = {
    sendMessageToOpenAI
};
