const axios = require('axios');
const User = require('../../../models/User/User');
const {OpenAI} = require('openai');

async function sendMessageToOpenAI(userId, messages, model) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    const userApiKey = user.APIKey;
    if (!userApiKey) {
        throw new Error("API Key is missing for user");
    }
    const openai = new OpenAI({
        apiKey: userApiKey
    });

    const events = await openai.chat.completions.create({
        messages: messages,
        model: model,
        stream: true
      });

      let response = '';
      for await (const event of events) {
          for (const choice of event.choices) {
            const delta = choice.delta?.content;
            if (delta !== undefined) {
              response += delta;
            }
          }
        }
      return response;
}

module.exports = {
    sendMessageToOpenAI
};
