import executeFlow from './app/src/services/run/flowService/flowService.js';

// Définir la fonction
function handleConnection(socket) {
    socket.on('message', async (msg) => {
        try {
            socket.emit('authenticated', { status: 'success' });
            if (msg.flowId) {
                const messageContent = await executeFlow(msg.flowId, socket.user.id, socket);
                socket.emit('message', messageContent);
            } else {
                console.error('missing flowId');
                socket.emit('message', { status: 'error', message: "missing flowId" });
            }
        } catch (err) {
            console.log(err.message);
            socket.emit('authenticated', { status: 'error', message: err.message });
        }
    });
}

export { handleConnection };
