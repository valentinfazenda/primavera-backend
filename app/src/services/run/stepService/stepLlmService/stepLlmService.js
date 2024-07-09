import axios from 'axios';
import Step from '../../../../.../../models/Step/Step.js';
import Model from '../../../../.../../models/Model/Model.js';
import { sendMessageToAzureOpenAI } from '../../../llms/azureOpenAIService/azureOpenAIService.js';
import { sendMessageToOpenAI } from '../../../llms/openAIService/openAIService.js';
import { encoding_for_model } from "tiktoken";

async function executeStepLlm(stepId, userId, input = '', socket = null) {
  try {
      const gpt4Enc = encoding_for_model("gpt-4-0125-preview");

      const step = await Step.findById(stepId).orFail(new Error("Step not found"));
      
      const initialContent = `${input}\n\n\n${input ? `Considering the above input the user wants to perform this task ${step.data} Answer:` : step.data}`;
      
      
      
      let messages = [{
          role: "user",
          content: 
          //content: initialContent
      }];
      
      const model = await Model.findById(step.modelId).orFail(new Error("Model not found"));

      const tokenLimit = model.tokenLength - 4192;

      model.activation = (model.activation || 0) + 1;
      await model.save();
      
      let tokenizedContent = gpt4Enc.encode(initialContent);
      console.log("end tokenization");

      if ( tokenizedContent.length >= tokenLimit - 4192 ) {
        let finalContent = await processContent(initialContent, tokenLimit, model, input);
        console.log("finalContent", finalContent.substring(0, 10));
        //messages[0].content = finalContent;
      }

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

async function processContent(tokens, tokenLimit, model, input = '') {
  console.log("Processing content cause content is too long for llm");
  const gpt4Enc = encoding_for_model("gpt-4-0125-preview");
  while (tokens.length > tokenLimit) {
      let subMessages = splitIntoSubMessages(tokens, tokenLimit);
      let results = await Promise.all(subMessages.map(async (subMessage) => {
          let subContent = gpt4Enc.decode(subMessage);
          let messages = [{
              role: "user",
              content: `${subContent}\n\n\nConsidering the above input the user wants to perform this task, here you have a sub passage of the context used to answer, rewrite without changing anything at all (the exact same text word for word) only the passages of this subpassage that are useful to answer the user needs ${input} Answer:`
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

      const reponseString = results.join(" ");
      tokens = gpt4Enc.encode(reponseString);
  }
  return reponseString;
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

export {
  executeStepLlm,
};