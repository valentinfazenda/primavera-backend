import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Flow from '../../models/Flow/Flow.js';
import Step from '../../models/Step/Step.js';

router.get('/list', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    const flows = await Flow.find({ ownerId: ownerId });
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
        const ownerId = req.user.id;
        const { name } = req.body;

        if (!name) {
        return res.status(400).json({ error: "Name is required" });
        }
  
        const newFlow = new Flow({
        ownerType: 'user',
        ownerId: ownerId,
        name: name
        });

        const savedFlow = await newFlow.save();

        res.status(201).json(savedFlow);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
    });

router.delete('/delete', authenticateToken, async (req, res) => {
  const { id } = req.body;

  try {
    const deletedModel = await Flow.findByIdAndDelete(id);
    if (!deletedModel) {
      return res.status(404).json({ error: "Model not found" });
    }
    await Step.deleteMany({ flowId: id });
    res.status(200).json({ message: "Model and related steps deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Edit an existing flow
router.patch('/edit', authenticateToken, async (req, res) => {
  const { name, status, ownerType, ownerId, modified, runnedTimes } = req.body;
  const update = { ...(name && { name }), ...(status && { status }), ...(ownerType && { ownerType }), ...(ownerId && { ownerId }), ...(modified && { modified }), ...(runnedTimes && { runnedTimes }) };

  try {
    const updatedModel = await Model.findByIdAndUpdate(id, update, { new: true }).orFail();
    res.status(200).json(updatedModel);
  } catch (error) {
    console.error(error);
    // Differentiate between not found and other server errors
    res.status(error.name === 'DocumentNotFoundError' ? 404 : 500).json({ error: error.message });
  }
});

// Get the flow where ownerId = ownerId that has been runned the most and return it
router.get('/most-run-flow', authenticateToken, async (req, res) => {
  const ownerId = req.user.id;
  try {
    const mostRunFlow = await Flow.findOne({ ownerId: ownerId }).sort({ runnedTimes: -1 }).orFail();
    res.status(200).json(mostRunFlow);
  } catch (error) {
    console.error(error);
    res.status(error.name === 'DocumentNotFoundError' ? 404 : 500).json({ error: error.message });
  }
});

// Get the number of flows where ownerId = ownerId with status true and return it
router.get('/active-flows-count', authenticateToken, async (req, res) => {
  const ownerId = req.user.id;
  try {
    const count = await Flow.countDocuments({ ownerId: ownerId, status: true });
    res.status(200).json({ activeFlowsCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get the total number of runnedTimes of all flows where ownerId = ownerId and return it
router.get('/total-runned-times', authenticateToken, async (req, res) => {
  const ownerId = req.user.id;
  try {
    const flows = await Flow.find({ ownerId: ownerId });
    const totalRunnedTimes = flows.reduce((acc, flow) => acc + flow.runnedTimes, 0);
    res.status(200).json({ totalRunnedTimes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;