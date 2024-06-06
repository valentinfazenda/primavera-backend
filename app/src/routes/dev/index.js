import express from 'express';
const router = express.Router();
import { io } from '../../../../server';
import { authenticateToken } from '../../middlewares/auth';
import { DocumentOCR } from '../../services/documents/pdf/ocrService/ocrService';

router.post('/pdfOCR', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).send({ error: "Property URL is missing" });
        }
        console.log("socket id: ", req.body.socketId)
        const socketId = uniqueIdFunction(req);
        res.status(200).json({ message: "Processing started", socketId: socketId });

        const socket = io.sockets.connected[socketId];
        console.log("Socket ID:", socketId);
        console.log("Sockets available:", Object.keys(io.sockets.connected));
        if (socket) {
            try {
                const result = await DocumentOCR(url, (progress) => {
                    socket.emit('ocrProgress', progress);
                });
                socket.emit('ocrComplete', { result });
            } catch (error) {
                socket.emit('ocrError', { error: error.message });
            }
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            if (error.response) {
                res.status(error.response.status).json({ error: error.response.data });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
});


import { v4 as uuidv4 } from ('uuid');

function uniqueIdFunction(req) {
  const idFromRequest = req?.body?.socketId;
  return idFromRequest || uuidv4();
}

export default router;