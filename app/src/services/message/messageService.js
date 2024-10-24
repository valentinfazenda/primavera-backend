import Message from '../../models/Message/Message.js';

async function saveMessage(chatId, text, sender) {
    const message = new Message({ chatId, text, sender });
    await message.save();
    return message;
}

export { saveMessage };
