import mongoose from 'mongoose';
import Document from '../Document/Document.js';
const { Schema } = mongoose;

const ChunkSchema = new Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    text: { type: String, required: true },
    chunkNumber: { type: Number, required: true },
    chunks: {
        type: String
      },
    embeddedChunks: [Number],
    creationDate: { type: Date, required: true, default: Date.now },
});

const Chunk = mongoose.model('Chunk', ChunkSchema);

export default Chunk;