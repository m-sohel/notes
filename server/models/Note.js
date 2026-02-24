const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: 'New Note',
            trim: true,
        },
        content: {
            type: String,
            default: '',
        },
        folder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        isLocked: {
            type: Boolean,
            default: false,
        },
        isTrashed: {
            type: Boolean,
            default: false,
        },
        trashedAt: {
            type: Date,
            default: null,
        },
        tags: [
            {
                type: String,
                enum: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
            },
        ],
        isShared: {
            type: Boolean,
            default: false,
        },
        shareToken: {
            type: String,
            default: null,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for search
noteSchema.index({ title: 'text', content: 'text' });
// Index for user-scoped queries
noteSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
