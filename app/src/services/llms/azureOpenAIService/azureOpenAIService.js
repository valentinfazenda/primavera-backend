const axios = require('axios');
const User = require('../../../models/User/User');
const Company = require('../../../models/Company/Company');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

async function sendMessageToAzureOpenAI(userId, messages, modelName) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    const companyName = user.company;
    if (!companyName) {
        throw new Error("Company not found for user");
    }

    const company = await Company.findOne({ name: companyName });
    if (!company) {
        throw new Error("Company details not found");
    }
    const azureOpenAIDeploymentName = company.azureOpenAIDeploymentName;
    const azureOpenAIApiKey = company.azureOpenAIApiKey;
    if (!azureOpenAIDeploymentName || !azureOpenAIApiKey) {
        throw new Error("Deployment name or API key details not found");
    }
    const url = `https://${azureOpenAIDeploymentName}/`;
    console.log("URL: ", url);
    const client = new OpenAIClient(
        url, 
        new AzureKeyCredential(azureOpenAIApiKey)
      );
      
    const events = await client.streamChatCompletions(modelName, messages);
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
    sendMessageToAzureOpenAI
};
