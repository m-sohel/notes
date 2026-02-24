const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/folders — list all folders with note counts
router.get('/', async (req, res) => {
    try {
        const folders = await Folder.find({ user: req.user._id })
            .populate('noteCount')
            .sort('name');
        res.json(folders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/folders — create folder
router.post('/', async (req, res) => {
    try {
        const { name, icon } = req.body;
        const folder = await Folder.create({
            name: name || 'New Folder',
            icon: icon || '📁',
            user: req.user._id,
        });
        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/folders/:id — update folder
router.put('/:id', async (req, res) => {
    try {
        const { name, icon } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (icon !== undefined) updateData.icon = icon;

        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!folder) return res.status(404).json({ error: 'Folder not found' });
        res.json(folder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/folders/:id — delete folder (unlink notes)
router.delete('/:id', async (req, res) => {
    try {
        const folder = await Folder.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!folder) return res.status(404).json({ error: 'Folder not found' });

        // Unlink all notes from this folder
        await Note.updateMany(
            { folder: req.params.id, user: req.user._id },
            { folder: null }
        );

        res.json({ message: 'Folder deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
