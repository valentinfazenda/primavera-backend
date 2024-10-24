import Workspace from '../../models/Workspace/Workspace.js';
import Document from '../../models/Document/Document.js';
import Chat from '../../models/Chat/Chat.js';
import { deleteDocument } from '../documents/documentsService.js'; // Assuming your document service is located here
import mongoose from 'mongoose';
import { deleteChat } from '../chat/chatService.js';

/**
 * Deletes a workspace, including all associated documents, chats, and S3 files.
 * @param {string} workspaceId - The ID of the workspace to delete.
 * @returns {Promise<Object>} - Details of the deleted workspace, documents, and chats.
 * @throws {Error} - Throws an error if the workspace or associated data is not found.
 */
async function deleteWorkspaceById(workspaceId) {
    // Convert workspaceId to a MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(workspaceId);

    // Find the workspace to ensure it exists
    const workspace = await Workspace.findById(objectId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    // Delete all documents associated with the workspace
    const documents = await Document.find({ workspaceId: objectId });
    for (const doc of documents) {
        await deleteDocument(doc._id);  // Assuming deleteDocument is properly implemented
    }

    // Delete all chats associated with the workspace
    const chats = await Chat.find({ workspaceId: objectId });
    for (const chat of chats) {
        await deleteChat(chat._id);  // Assuming deleteChat is properly implemented
    }

    // Finally, delete the workspace itself
    const deletedWorkspace = await Workspace.findByIdAndDelete(objectId);

    return {
        deletedWorkspace,
        deletedDocumentsCount: documents.length,
        deletedChatsCount: chats.length
    };
}

export {
    deleteWorkspaceById
};
