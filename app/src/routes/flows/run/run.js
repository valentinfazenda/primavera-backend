const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middlewares/auth');
const { executeFlow } = require('../../../services/run/flow/flow');

router.post('/run', authenticateToken, async (req, res) => {
  try {
    const { flowId } = req.body;

    if (!flowId) {
      return res.status(400).json({ error: "Flow ID is required" });
    }

    const result = await executeFlow(flowId);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;