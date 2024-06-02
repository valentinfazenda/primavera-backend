const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const Model = require('../../models/Model/Model');

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

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, apiKey } = req.body;

    if (!name || !apiKey) {
      return res.status(400).json({ error: "Name and API Key are required" });
    }

    const newModel = new Model({
      name: name,
      userId: userId,
      apiKey: apiKey
    });

    const savedModel = await newModel.save();
    res.status(201).json(savedModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
