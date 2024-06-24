import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../../middlewares/auth.js';
import Step from '../../../models/Step/Step.js';
import mongoose from 'mongoose';

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
    const steps = req.body.steps;

    if (!steps || steps.length === 0) {
        return sendErrorResponse(res, 400, "No steps provided");
    }

    if (steps.some(step => !step.name || !step.flowId || !step.type)) {
        return sendErrorResponse(res, 400, "All required fields must be provided for each step");
    }

    try {
        const savedSteps = [];
        for (const step of steps) {
            const { name, flowId, type, documentId, modelLlm, modelName, previousSteps, nextSteps, startingStep, endingStep, data, positionX, positionY } = step;
            const newStep = new Step({ name, flowId, type, documentId, modelLlm, modelName, previousSteps, nextSteps, startingStep, endingStep, data, positionX, positionY });
            const savedStep = await newStep.save();
            savedSteps.push(savedStep);
        }
        res.status(201).json(savedSteps);
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

router.delete('/delete', authenticateToken, async (req, res) => {
    const steptId = req.body.stepId;
    try {
        const stepDocument = await Step.findByIdAndDelete(steptId);
        if (!stepDocument) {
            return res.status(404).json({ error: "Step not found" });
        }
        res.status(200).json({ message: "Step deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;