const { executeFlow } = require('./app/src/services/run/flowService/flowService');

module.exports = {
    handleConnection: (socket) => {
        socket.on('message', async (msg) => {
            try {
                socket.emit('authenticated', { status: 'success' });

                if (msg.flowId) {
                    console.log('Running flow: ' + msg.flowId + " for user " + socket.user.id);
                    const messageContent = await executeFlow(msg.flowId, socket.user.id);
                    console.log('Flow finished: ' + JSON.stringify(messageContent));
                    socket.emit('answer', JSON.stringify(messageContent));
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
