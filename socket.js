import { executeMessage } from "./app/src/services/chat/chatService.js";

function handleConnection(socket) {
    socket.on('message', async (msg) => {
        try {
            socket.emit('authenticated', { status: 'success' });
            if (msg.chatId && msg.message) {
                console.log('chatId:', msg.chatId)
                const messageContent = await executeMessage(msg.message, msg.chatId, socket.user.id, socket);
                console.log(messageContent);
                socket.emit('message', '{"status": "success"}');
            } else {
                socket.emit('message', { status: 'error', message: "missing flowId" });
            }
        } catch (err) {
            console.log(err.message);
            socket.emit('authenticated', { status: 'error', message: err.message });
        }
    });
}

export { handleConnection };
