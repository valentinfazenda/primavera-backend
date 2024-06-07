import executeFlow from './app/src/services/run/flowService/flowService.js';

function handleConnection(socket) {
    socket.on('message', async (msg) => {
        try {
            socket.emit('authenticated', { status: 'success' });
            console.log('message received:')
            if (msg.flowId) {
                console.log('flowId:', msg.flowId)
                const messageContent = await executeFlow(msg.flowId, socket.user.id, socket);
                console.log(messageContent);
                socket.emit('message', messageContent.response);
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
