import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { handleConnection } from './socket.js';
import connectDB from './app/src/config/db.js';
import bodyParser from 'body-parser';
import llmsRoute from './app/src/routes/llms/index.js';
import documentsRoute from './app/src/routes/documents/index.js';
import modelsRoute from './app/src/routes/models/index.js';
import userRoute from './app/src/routes/user/index.js';
import authRoute from './app/src/routes/auth.js';
import waitingListRoute from './app/src/routes/waitingList.js';
import workspaceRoute from './app/src/routes/workspaces/index.js';
import companyRoute from './app/src/routes/company/index.js';
import chatRoute from './app/src/routes/chat/index.js';
import devRoute from './app/src/routes/dev/index.js';
import { authenticateToken, authenticateSocket } from './app/src/middlewares/auth.js';
import 'dotenv/config';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io/',
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "OPTIONS", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization"],
    crendentials: true
  }
});
io.use(authenticateSocket);
io.on('connection', (socket) => {
  handleConnection(socket);
});

app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const PORT = process.env.PORT || 5000;

connectDB();
app.use(bodyParser.json());

// Public routes
app.use('/api/auth', authRoute);
app.use('/api/waitingList', waitingListRoute);

// Protected routes
app.use('/api/documents/', authenticateToken, documentsRoute);
app.use('/api/llms/', authenticateToken, llmsRoute);
app.use('/api/user/', authenticateToken, userRoute);
app.use('/api/models/', authenticateToken, modelsRoute);
app.use('/api/dev/', authenticateToken, devRoute);
app.use('/api/workspace/', authenticateToken, workspaceRoute);
app.use('/api/company/', authenticateToken, companyRoute);
app.use('/api/chat/', authenticateToken, chatRoute);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { io };