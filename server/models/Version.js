const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
    {
        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Note',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: '',
        },
        versionNumber: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

versionSchema.index({ note: 1, createdAt: -1 });

module.exports = mongoose.model('Version', versionSchema);
