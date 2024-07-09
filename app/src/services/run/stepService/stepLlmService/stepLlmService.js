import Step from '../../../../.../../models/Step/Step.js';
import Model from '../../../../.../../models/Model/Model.js';
import { sendMessageToAzureOpenAI } from '../../../llms/azureOpenAIService/azureOpenAIService.js';
import { sendMessageToOpenAI } from '../../../llms/openAIService/openAIService.js';
import { encoding_for_model } from "tiktoken";
import { decode } from 'jsonwebtoken';

async function executeStepLlm(stepId, userId, input = '', socket = null) {
  try {
      const gpt4Enc = encoding_for_model("gpt-4-0125-preview");

      const step = await Step.findById(stepId).orFail(new Error("Step not found"));
      
      let Content = `${input}\n\n\n${input ? `Considering the above input the user wants to perform this task: ${step.data} Answer:` : step.data}`;
      
      const model = await Model.findById(step.modelId).orFail(new Error("Model not found"));

      const tokenLimit = model.tokenLength - 4192;

      model.activation = (model.activation || 0) + 1;
      await model.save();
      
      const tokenizedContent = gpt4Enc.encode(Content);
      decodeContent(tokenizedContent).substring(0, 100);
      if ( tokenizedContent.length >= tokenLimit - 4192 ) {
        if (socket) {
          socket.emit('message', { stepId, answer: 'Analyzing context', status: 'loading'});
        }
        Content = await processContent(tokenizedContent, tokenLimit, model, step.data);
      }

      let messages = [{
        role: "user",
        content: Content
    }];

      switch (model.provider) {
          case "AzureOpenAI":
              return await sendMessageToAzureOpenAI(messages, model, stepId, socket);
          case "OpenAI":
              return await sendMessageToOpenAI(userId, messages, model, stepId, socket);
          default:
              throw new Error("Model not found");
      }
  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function processContent(tokens, tokenLimit, model, stepData) {
  const gpt4Enc = encoding_for_model("gpt-4-0125-preview");
  decodeContent(tokens)
  let responseString = '';
  while (tokens.length > tokenLimit) {
      let subMessages = splitIntoSubMessages(tokens, tokenLimit);
      let results = await Promise.all(subMessages.map(async (subMessage) => {
          let subContent = decodeContent(subMessage);
          let messages = [{
              role: "user",
              content: `${subContent}\n\n\nConsidering the above input the user wants to perform this task, here you have a sub passage of the context used to answer, don't try to answer the question, just rewrite usefulle passages from the input without changing anything at all (the exact same text word for word), only the passages of this subpassage that are useful to answer the user needs ${stepData}, just rewrite usefull passages, respect format and ponctuation, don't add anything else, no blabla. Answer:`
          }];
          
          switch (model.provider) {
              case "AzureOpenAI":
                  return await sendMessageToAzureOpenAI(messages, model);
              case "OpenAI":
                  return await sendMessageToOpenAI(null, messages, model);
              default:
                  throw new Error("Model not found");
          }
      }));

      responseString = results.join(" ");
      tokens = gpt4Enc.encode(responseString);
  }
  return responseString;
}

function splitIntoSubMessages(tokens, tokenLimit) {
  let subMessages = [];

  let numberOfMessages = Math.ceil(tokens.length / tokenLimit);
  for (let i = 0; i < numberOfMessages; i++) {
      let subMessage = tokens.slice(i * tokenLimit, (i + 1) * tokenLimit);
      subMessages.push(subMessage);
  }
  return subMessages;
}

function decodeContent(tokens) {
  const gpt4Enc = encoding_for_model("gpt-4-0125-preview");
  const decoder = new TextDecoder().decode(gpt4Enc.decode(tokens));
  return decoder;
}

export {
  executeStepLlm,
};