const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middlewares/auth');
const Step = require('../../../models/Step/Step');
const mongoose = require('mongoose');

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendErrorResponse = (res, status, message) => res.status(status).json({ error: message });

router.get('/details/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Id");
    }

    try {
        const step = await Step.findById(id);
        if (!step) {
            return sendErrorResponse(res, 404, "Step not found");
        }
        res.status(200).json(step);
    } catch (error) {
        console.error(error);
        sendErrorResponse(res, 500, error.message);
    }
});

router.post('/list', authenticateToken, async (req, res) => {
    const { flowId } = req.body;

    if (!flowId) {
        return sendErrorResponse(res, 400, "FlowId is required");
    }

    if (!validateObjectId(flowId)) {
        return sendErrorResponse(res, 400, "Invalid FlowId");
    }

    try {
        const steps = await Step.find({ flowId });
        if (steps.length === 0) {
            return sendErrorResponse(res, 404, "No steps corresponding to flowId");
        }
        res.status(200).json(steps);
    } catch (error) {
        console.error(error);
        sendErrorResponse(res, 500, error.message);
    }
});

// Create a new step
router.post('/create', authenticateToken, async (req, res) => {
    const { name, flowId, type, documentId, modelLlm, modelName, previousSteps, nextSteps, startingStep, endingStep, data } = req.body;

    if (!name || !flowId || !type) {
        return sendErrorResponse(res, 400, "All required fields must be provided");
    }

    try {
        const newStep = new Step({ name, flowId, type, documentId, modelLlm, modelName, previousSteps, nextSteps, startingStep, endingStep, data });
        const savedStep = await newStep.save();
        res.status(201).json(savedStep);
    } catch (error) {
        console.error(error);
        sendErrorResponse(res, 500, error.message);
    }
});

// Edit an existing step
router.post('/edit', authenticateToken, async (req, res) => {
    const { id, column, value } = req.body;

    if (!id || !column || value === undefined) {
        return sendErrorResponse(res, 400, "Id, column, and value must be provided");
    }

    if (!validateObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Id");
    }

    if (!Step.schema.path(column)) {
        return sendErrorResponse(res, 400, "Invalid column");
    }

    try {
        const updatedStep = await Step.findByIdAndUpdate(
            id,
            { [column]: value },
            { new: true, runValidators: true }
        );

        if (!updatedStep) {
            return sendErrorResponse(res, 404, "Step not found");
        }

        res.status(200).json(updatedStep);
    } catch (error) {
        console.error(error);
        sendErrorResponse(res, 500, error.message);
    }
});

module.exports = router;