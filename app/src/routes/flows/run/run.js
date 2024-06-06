import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../../middlewares/auth.js';
import executeFlow from '../../../services/run/flowService/flowService.js';

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

export default router ;