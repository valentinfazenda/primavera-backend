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
    const { id, updates } = req.body;

    if (!id || !updates || updates.length === 0) {
        return sendErrorResponse(res, 400, "Step Id and updates must be provided");
    }

    if (!validateObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Step Id");
    }

    const updateObject = {};
    for (const update of updates) {
        const { column, value } = update;
        if (!column || value === undefined) {
            return sendErrorResponse(res, 400, "Each update must include a column and a value");
        }
        if (!Step.schema.path(column)) {
            return sendErrorResponse(res, 400, `Invalid column: ${column}`);
        }
        updateObject[column] = value;
    }

    try {
        const updatedStep = await Step.findByIdAndUpdate(
            id,
            { $set: updateObject },
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

router.post('/connect', authenticateToken, async (req, res) => {
    
    const { sourceStepId, targetStepId } = req.body;

    if (!sourceStepId || !targetStepId) {
        return sendErrorResponse(res, 400, "Both sourceStepId and targetStepId are required");
    }

    if (!validateObjectId(sourceStepId) || !validateObjectId(targetStepId)) {
        return sendErrorResponse(res, 400, "Invalid Step ID(s)");
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        // Add targetStepId to the nextSteps of the source step
        const sourceStepUpdate = await Step.findByIdAndUpdate(
            sourceStepId,
            { $addToSet: { nextSteps: targetStepId } },
            { new: true, session }
        );

        // Add sourceStepId to the previousSteps of the target step
        const targetStepUpdate = await Step.findByIdAndUpdate(
            targetStepId,
            { $addToSet: { previousSteps: sourceStepId } },
            { new: true, session }
        );

        if (!sourceStepUpdate || !targetStepUpdate) {
            await session.abortTransaction();
            session.endSession();
            return sendErrorResponse(res, 404, "One or both steps not found");
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            message: "Steps connected successfully",
            sourceStep: sourceStepUpdate,
            targetStep: targetStepUpdate
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        sendErrorResponse(res, 500, error.message);
    }
});

router.post('/disconnect', authenticateToken, async (req, res) => {
    const { sourceStepId, targetStepId } = req.body;

    if (!sourceStepId || !targetStepId) {
        return sendErrorResponse(res, 400, "Both sourceStepId and targetStepId are required");
    }

    if (!validateObjectId(sourceStepId) || !validateObjectId(targetStepId)) {
        return sendErrorResponse(res, 400, "Invalid Step ID(s)");
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        // Remove targetStepId from the nextSteps of the source step
        const sourceStepUpdate = await Step.findByIdAndUpdate(
            sourceStepId,
            { $pull: { nextSteps: targetStepId } },
            { new: true, session }
        );

        // Remove sourceStepId from the previousSteps of the target step
        const targetStepUpdate = await Step.findByIdAndUpdate(
            targetStepId,
            { $pull: { previousSteps: sourceStepId } },
            { new: true, session }
        );

        if (!sourceStepUpdate || !targetStepUpdate) {
            await session.abortTransaction();
            session.endSession();
            return sendErrorResponse(res, 404, "One or both steps not found");
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            message: "Steps disconnected successfully",
            sourceStep: sourceStepUpdate,
            targetStep: targetStepUpdate
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        sendErrorResponse(res, 500, error.message);
    }
});


export default router;