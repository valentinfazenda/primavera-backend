import Document from '../../models/Document/Document.js';
import Chunk from '../../models/Chunk/Chunk.js';
import Workspace from '../../models/Workspace/Workspace.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../../config/aws.js';
import mongoose from 'mongoose';

/**
 * Deletes a document by its ID, including associated chunks and the file in S3.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<Object>} - An object containing details of the deleted document and chunks.
 * @throws {Error} - Throws an error if the document or workspace is not found.
 */
async function deleteDocument(documentId) {
    // Convert documentId to a MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(documentId);

    // Find and delete the document by its ObjectId
    const deletedDocument = await Document.findByIdAndDelete(objectId);
    if (!deletedDocument) {
        throw new Error("Document not found");
    }

    // Extract workspaceId from the deleted document
    const workspaceId = deletedDocument.workspaceId;

    // Find the workspace to get the userId
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    const userId = workspace.userId;

    // Build the S3 key for the document
    const s3Key = `documents/${userId}/${workspaceId}/${documentId}`;

    // Parameters for deleting the object from S3
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key
    };

    try {
        // Delete the object from S3
        await s3.send(new DeleteObjectCommand(params));
        console.log(`Document ${s3Key} deleted from S3 successfully.`);
    } catch (s3Error) {
        console.error(`Error deleting document ${s3Key} from S3:`, s3Error);
        // Handle S3 deletion error as needed
        throw new Error(`Error deleting document from S3: ${s3Error.message}`);
    }

    // Delete all chunks associated with the documentId
    const deletedChunks = await Chunk.deleteMany({ documentId: objectId });

    // Return details about the deletion
    return {
        deletedDocument,
        deletedChunksCount: deletedChunks.deletedCount
    };
}

export {
    deleteDocument
  };
