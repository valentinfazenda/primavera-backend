const { executeFlow } = require('./app/src/services/run/flowService/flowService');

module.exports = {
    handleConnection: (socket) => {
        socket.on('message', async (msg) => {
            try {
                socket.emit('authenticated', { status: 'success' });

                if (msg.flowId) {
                    const messageContent = await executeFlow(msg.flowId, socket.user.id, socket);
                    socket.emit('answer', messageContent)
                } else {
                    console.error('missing flowId');
                }
            } catch (err) {
                console.log(err.message);
                socket.emit('authenticated', { status: 'error', message: err.message });
            }
        });
    }
};
