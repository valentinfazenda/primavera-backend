const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middlewares/auth');
const Flow = require('../../models/Flow/Flow');

router.get('/flows', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const flows = await Flow.find({ userid: userId });

    res.status(200).json(flows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;