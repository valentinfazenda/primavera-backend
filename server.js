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

const allowedOrigins = ['http://localhost:3000', 'https://valentinfazenda.com','https://www.valentinfazenda.com', 'https://www.primavera-ai.com', 'https://primavera-ai.com'];

app.use(cors({
  // Function to set the origin parameter dynamically based on the incoming origin
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed HTTP headers
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

app.options('*', cors({
  // Function to set the origin parameter dynamically based on the incoming origin
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed HTTP headers
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

const PORT = process.env.PORT || 5000;

connectDB();
app.get('/health', (req, res) => res.send('OK'));
app.use(bodyParser.json());

// Public routes
app.use('/auth', authRoute);
app.use('/waitingList', waitingListRoute);

// Protected routes
app.use('/documents/', authenticateToken, documentsRoute);
app.use('/llms/', authenticateToken, llmsRoute);
app.use('/user/', authenticateToken, userRoute);
app.use('/models/', authenticateToken, modelsRoute);
app.use('/dev/', authenticateToken, devRoute);
app.use('/workspace/', authenticateToken, workspaceRoute);
app.use('/company/', authenticateToken, companyRoute);
app.use('/chat/', authenticateToken, chatRoute);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { io };