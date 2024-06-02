const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middlewares/auth');
const { executeFlow } = require('../../../services/run/flowService/flowService');

router.post('', authenticateToken, async (req, res) => {
  try {
    const { flowId } = req.body;
    const userId = req.user.id;

    if (!flowId) {
      return res.status(400).json({ error: "Flow ID is required" });
    }

    const result = await executeFlow(flowId, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;