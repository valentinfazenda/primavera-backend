import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Model from '../../models/Model/Model.js';
import User from '../../models/User/User.js';
import AzureOpenAIEndpoint from '../../models/AzureOpenAIEndpoint/AzureOpenAIEndpoint.js';

// List available models for a user
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userModels = await Model.find({ ownerType: 'user', ownerId: userId });

    let companyModels = [];
    if (user.company) {
      const companyId = user.company;
      companyModels = await Model.find({ ownerType: 'company', ownerId: companyId });
    }

    const models = [...userModels, ...companyModels];

    res.status(models.length ? 200 : 404).json(models.length ? models : { message: "No models found for this user or company." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


router.post('/create', authenticateToken, async (req, res) => {
  const { name, apiKey, provider, active = true, azureOpenAIDeploymentName, modelDeploymentName } = req.body;
  if (!name || !apiKey) {
    return res.status(400).json({ error: "Name and API Key are required" });
  }
  const ownerType = 'user';
  
  try {
    const newModel = new Model({ name, ownerType, provider, ownerId: req.user.id, apiKey, active });
    const savedModel = await newModel.save();

    // Check if the provider is AzureOpenAI and create an AzureOpenAIEndpoint entry
    if (provider === 'AzureOpenAI' && azureOpenAIDeploymentName && modelDeploymentName) {
      const newEndpoint = new AzureOpenAIEndpoint({
        modelId: savedModel._id,
        azureOpenAIDeploymentName,
        modelDeploymentName,
        modelApiKey: apiKey 
      });
      await newEndpoint.save();
    }

    res.status(201).json(savedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/edit', authenticateToken, async (req, res) => {
  const { id, name, apiKey, active, azureOpenAIDeploymentName, modelDeploymentName } = req.body;

  // Prepare updates for the main model
  const update = { ...(name && { name }), ...(apiKey && { apiKey }), ...(active != null && { active }) };

  try {
    const model = await Model.findById(id);

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    if (req.user.id !== model.ownerId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the main model
    Object.assign(model, update);
    const updatedModel = await model.save();

    // If the model's provider is AzureOpenAI, update the related AzureOpenAIEndpoint
    if (model.provider === 'AzureOpenAI') {
      const azureEndpoint = await AzureOpenAIEndpoint.findOne({ modelId: model._id });

      if (azureEndpoint) {
        if (azureOpenAIDeploymentName) {
          azureEndpoint.azureOpenAIDeploymentName = azureOpenAIDeploymentName;
        }
        if (modelDeploymentName) {
          azureEndpoint.modelDeploymentName = modelDeploymentName;
        }
        if (apiKey) {
          azureEndpoint.modelApiKey = apiKey;
        }

        await azureEndpoint.save(); // Save the updated AzureOpenAIEndpoint
      } else {
        // Optionally handle the scenario where there is no endpoint found but expected to exist
        console.log('No AzureOpenAIEndpoint found for this model, one may need to be created.');
      }
    }

    // Return the updated model
    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    res.status(error.name === 'DocumentNotFoundError' ? 404 : 500).json({ error: error.message });
  }
});


// Activate or deactivate a model
router.patch('/activate', authenticateToken, async (req, res) => {
  const { id, active } = req.body;
  
  try {
    const model = await Model.findById(id);

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    if (req.user.id !== model.ownerId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    model.active = active;
    const updatedModel = await model.save();
    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/delete', authenticateToken, async (req, res) => {
  const { id } = req.body;

  try {
    const model = await Model.findById(id);

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    if (req.user.id !== model.ownerId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // If the model's provider is AzureOpenAI, delete the related AzureOpenAIEndpoint
    if (model.provider === 'AzureOpenAI') {
      const azureEndpoint = await AzureOpenAIEndpoint.findOne({ modelId: model._id });

      if (azureEndpoint) {
        await azureEndpoint.deleteOne();// Remove the AzureOpenAIEndpoint
      } else {
        // Optionally log that no endpoint was found but expected
        console.log('No AzureOpenAIEndpoint found for this model, none deleted.');
      }
    }

    // Proceed to delete the main model
    const deletedModel = await Model.findByIdAndDelete(id);
    res.status(200).json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


//return details for a specific model
router.get('/details/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
      const model = await Model.findById(id);
      if (!model) {
          return res.status(404).json({ error: "Model not found" });
      }

      if (req.user.id !== model.ownerId.toString()) {
          return res.status(403).json({ error: "Access denied" });
      }

      const modelObject = model.toObject();

      // Check if the provider is AzureOpenAI and fetch related deployment details
      if (model.provider === 'AzureOpenAI') {
        const azureEndpoint = await AzureOpenAIEndpoint.findOne({ modelId: model._id }).exec();
        if (azureEndpoint) {
          modelObject.azureOpenAIDeploymentName = azureEndpoint.azureOpenAIDeploymentName;
          modelObject.modelDeploymentName = azureEndpoint.modelDeploymentName;
        } else {
          // Handle the case where no AzureOpenAIEndpoint data exists but is expected
          modelObject.azureOpenAIDeploymentName = 'N/A';
          modelObject.modelDeploymentName = 'N/A';
        }
      }

      res.status(200).json(modelObject);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

export default router;
