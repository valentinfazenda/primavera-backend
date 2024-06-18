import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Model from '../../models/Model/Model.js';
import Flow from '../../models/Flow/Flow.js';
import Step from '../../models/Step/Step.js';

// List available models for a user
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const models = await Model.find({ ownerId: req.user.id });
    // Return a 404 status if no models are found, otherwise return the models list
    res.status(models.length ? 200 : 404).json(models.length ? models : { message: "No models found for this user." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new model
router.post('/create', authenticateToken, async (req, res) => {
  const { name, apiKey, active = true } = req.body;
  if (!name || !apiKey) {
    return res.status(400).json({ error: "Name and API Key are required" });
  }
  const ownerType = 'user';
  
  try {
    const newModel = new Model({ name, ownerType, ownerId: req.user.id, apiKey, active });
    const savedModel = await newModel.save();
    res.status(201).json(savedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/edit', authenticateToken, async (req, res) => {
  const { id, name, apiKey, active } = req.body;
  const update = { ...(name && { name }), ...(apiKey && { apiKey }), ...(active != null && { active }) };

  try {
    const model = await Model.findById(id);

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    if (req.user.id !== model.ownerId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    Object.assign(model, update);
    const updatedModel = await model.save();
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

      res.status(200).json(model);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

// Find the most recurrent model name in steps for a user's flows
router.get('/most-recurrent-model', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
      // Find all flows for the given userId
      const flows = await Flow.find({ userId: userId });
      if (!flows.length) {
          return res.status(404).json({ message: "No flows found for this user." });
      }

      // Extract flowIds
      const flowIds = flows.map(flow => flow._id);

      // Find all steps that belong to these flows
      const steps = await Step.find({ flowId: { $in: flowIds } });
      
      // Create a map to count occurrences of each modelName
      const modelCount = {};
      steps.forEach(step => {
          if (step.modelName) {
              modelCount[step.modelName] = (modelCount[step.modelName] || 0) + 1;
          }
      });

      // Find the modelName with the maximum count
      let mostRecurrentModel = null;
      let maxCount = 0;
      for (let model in modelCount) {
          if (modelCount[model] > maxCount) {
              mostRecurrentModel = model;
              maxCount = modelCount[model];
          }
      }

      if (!mostRecurrentModel) {
          return res.status(404).json({ message: "No model names found in steps." });
      }

      // Return the most recurrent modelName
      res.status(200).json({ mostRecurrentModel });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

export default router;
