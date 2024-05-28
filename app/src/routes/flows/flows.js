const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middlewares/auth');
const Flow = require('../../models/Flow/Flow');

router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const flows = await Flow.find({ userId: userId });
    console.log(userId);
    if (flows.length === 0) {
      return res.status(200).json({ error: "No flows found for this user." });
    }

    res.status(200).json(flows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) {
        return res.status(400).json({ error: "Name is required" });
        }
  
        const newFlow = new Flow({
        userId: userId,
        name: name
        });

        const savedFlow = await newFlow.save();

        res.status(201).json(savedFlow);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
    });
  
module.exports = router;