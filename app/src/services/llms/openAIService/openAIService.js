const axios = require('axios');
const User = require('../../../models/User/User');

async function sendMessageToOpenAI(userId, messages, model) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    const userApiKey = user.APIKey;
    if (!userApiKey) {
        throw new Error("API Key is missing for user");
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: messages,
        model: model,
        max_tokens: 150
    }, {
        headers: {
            'Authorization': `Bearer ${userApiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

module.exports = {
    sendMessageToOpenAI
};
