const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middlewares/auth');
const Step = require('../../../models/Step/Step');
const mongoose = require('mongoose');

router.post('/list', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { flowId } = req.body;

        if (!flowId) {
            return res.status(400).json({ error: "FlowId is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(flowId)) {
            return res.status(400).json({ error: "Invalid FlowId" });
        }

        const steps = await Step.find({ flowId: flowId });

        if (steps.length === 0) {
            return res.status(404).json({ error: "No steps corresponding to flowId" });
        }

        res.status(200).json(steps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name, flowId, type, previousStep, nextStep, startingStep, endingStep, data } = req.body;

        if (!name || !flowId || !type) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        const newStep = new Step({
            name,
            flowId,
            type,
            previousStep,
            nextStep,
            startingStep,
            endingStep,
            data
        });

        const savedStep = await newStep.save();

        res.status(201).json(savedStep);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
