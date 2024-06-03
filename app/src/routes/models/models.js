const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const Model = require('../../models/Model/Model');

// List available models for a user
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const models = await Model.find({ userId: req.user.id });
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
  
  try {
    const newModel = new Model({ name, userId: req.user.id, apiKey, active });
    const savedModel = await newModel.save();
    res.status(201).json(savedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Edit an existing model
router.patch('/edit', authenticateToken, async (req, res) => {
  const { id, name, apiKey, active } = req.body;
  const update = { ...(name && { name }), ...(apiKey && { apiKey }), ...(active != null && { active }) };

  try {
    const updatedModel = await Model.findByIdAndUpdate(id, update, { new: true }).orFail();
    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    // Differentiate between not found and other server errors
    res.status(error.name === 'DocumentNotFoundError' ? 404 : 500).json({ error: error.message });
  }
});

// Activate or deactivate a model
router.patch('/activate', authenticateToken, async (req, res) => {
  const { id, active } = req.body;
  try {
    const updatedModel = await Model.findByIdAndUpdate(id, { active }, { new: true }).orFail();
    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    res.status(error.name === 'DocumentNotFoundError' ? 404 : 500).json({ error: error.message });
  }
});

// Delete a specific model
router.delete('/delete', authenticateToken, async (req, res) => {
  const { id } = req.body;

  try {
    const deletedModel = await Model.findByIdAndDelete(id);

    if (!deletedModel) {
      return res.status(404).json({ error: "Model not found" });
    }

    res.status(200).json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
