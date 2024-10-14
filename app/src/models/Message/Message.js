import mongoose from 'mongoose';
import Chat from '../Chat/Chat.js';
import text from 'body-parser/lib/types/text.js';
const { Schema } = mongoose;

const MessageSchema = new Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    text: { type: String, required: true },
    sender: { type: String, required: true },
    creationDate: { type: Date, required: true, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;
