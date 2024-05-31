const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ws.on('message', function incoming(message) {
        console.log('Received:', message);
    });

    ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server is running on ws://localhost:8080');
