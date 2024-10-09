import mongoose from 'mongoose';
import Chat from '../Chat/Chat.js';
import text from 'body-parser/lib/types/text.js';
import { embedAllDocumentsChunks } from '../../services/indexing/embedder/embederService.js';
const { Schema } = mongoose;

const ChunkSchema = new Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    text: { type: String, required: true },
    embeddedText: { type: String, required: true },
    creationDate: { type: Date, required: true, default: Date.now },
});

const Chunk = mongoose.model('Chunk', ChunkSchema);

export default Chunk;
