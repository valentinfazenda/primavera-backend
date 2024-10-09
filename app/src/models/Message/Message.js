import mongoose from 'mongoose';
import Chat from '../Chat/Chat.js';
const { Schema } = mongoose;

const MessageSchema = new Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    creationDate: { type: Date, required: true, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;
