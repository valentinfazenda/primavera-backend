const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const Model = require('../../models/Model/Model');

//list availables models for a user
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const models = await Model.find({ userId: userId });
    
    if (models.length === 0) {
      return res.status(200).json({ message: "No models found for this user." });
    }

    res.status(200).json(models);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// create a new model
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, apiKey, active } = req.body;

    if (!name || !apiKey) {
      return res.status(400).json({ error: "Name and API Key are required" });
    }

    const newModel = new Model({
      name: name,
      userId: userId,
      apiKey: apiKey,
      active: active || true
    });

    const savedModel = await newModel.save();
    res.status(201).json(savedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// edit a specific model
router.patch('/edit', authenticateToken, async (req, res) => {
  const { id, name, apiKey, active } = req.body;

  try {
    const updatedData = {};
    if (name) updatedData.name = name;
    if (apiKey) updatedData.apiKey = apiKey;
    if (active) updatedData.active = active;

    const updatedModel = await Model.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedModel) {
      return res.status(404).json({ error: "Model not found" });
    }

    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// activate or desactivate a model
router.patch('/activate', authenticateToken, async (req, res) => {
  const { id, active } = req.body;

  try {
    const updatedData = {};
    if (active) updatedData.active = active;

    const updatedModel = await Model.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedModel) {
      return res.status(404).json({ error: "Model not found" });
    }

    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
