const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Note = require('../models/Note');
const Version = require('../models/Version');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/notes — list notes (optional filters: folder, search, trashed)
router.get('/', async (req, res) => {
    try {
        const { folder, search, trashed } = req.query;
        let query = { user: req.user._id };

        // Show trashed or non-trashed
        if (trashed === 'true') {
            query.isTrashed = true;
        } else {
            query.isTrashed = { $ne: true };
        }

        if (folder) {
            query.folder = folder;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
            ];
        }

        const notes = await Note.find(query)
            .sort({ isPinned: -1, updatedAt: -1 })
            .select('title content isPinned isLocked isTrashed trashedAt tags isShared shareToken createdAt updatedAt folder');

        // Create preview from content (strip HTML, first 120 chars)
        const notesWithPreview = notes.map((note) => {
            const doc = note.toObject();
            const plainText = doc.content.replace(/<[^>]*>/g, '');
            doc.preview = plainText.substring(0, 120);
            return doc;
        });

        res.json(notesWithPreview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notes/:id — get single note
router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/notes — create note
router.post('/', async (req, res) => {
    try {
        const { title, content, folder } = req.body;
        const note = await Note.create({
            title: title || 'New Note',
            content: content || '',
            folder: folder || null,
            user: req.user._id,
        });
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notes/:id — update note
router.put('/:id', async (req, res) => {
    try {
        const { title, content, folder, isPinned, isLocked, tags } = req.body;
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (folder !== undefined) updateData.folder = folder;
        if (isPinned !== undefined) updateData.isPinned = isPinned;
        if (isLocked !== undefined) updateData.isLocked = isLocked;
        if (tags !== undefined) updateData.tags = tags;

        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notes/:id/trash — soft delete (move to trash)
router.put('/:id/trash', async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isTrashed: true, trashedAt: new Date() },
            { new: true }
        );
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notes/:id/restore — restore from trash
router.put('/:id/restore', async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isTrashed: false, trashedAt: null },
            { new: true }
        );
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/notes/:id — permanently delete
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });
        // Also delete all versions
        await Version.deleteMany({ note: req.params.id });
        res.json({ message: 'Note permanently deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Version History ─────────────────────────────────────

// POST /api/notes/:id/versions — save a version snapshot
router.post('/:id/versions', async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        // Get the latest version number
        const latestVersion = await Version.findOne({ note: note._id })
            .sort({ versionNumber: -1 });
        const nextVersion = latestVersion ? latestVersion.versionNumber + 1 : 1;

        const version = await Version.create({
            note: note._id,
            user: req.user._id,
            title: note.title,
            content: note.content,
            versionNumber: nextVersion,
        });

        res.status(201).json(version);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notes/:id/versions — list all versions of a note
router.get('/:id/versions', async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        const versions = await Version.find({ note: note._id })
            .sort({ versionNumber: -1 })
            .select('versionNumber title createdAt');

        res.json(versions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notes/:id/versions/:versionId — get a specific version
router.get('/:id/versions/:versionId', async (req, res) => {
    try {
        const version = await Version.findOne({
            _id: req.params.versionId,
            note: req.params.id,
        });
        if (!version) return res.status(404).json({ error: 'Version not found' });
        res.json(version);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notes/:id/versions/:versionId/restore — restore a version
router.put('/:id/versions/:versionId/restore', async (req, res) => {
    try {
        const version = await Version.findOne({
            _id: req.params.versionId,
            note: req.params.id,
        });
        if (!version) return res.status(404).json({ error: 'Version not found' });

        // Save current state as a new version before restoring
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        const latestVersion = await Version.findOne({ note: note._id })
            .sort({ versionNumber: -1 });
        const nextVersion = latestVersion ? latestVersion.versionNumber + 1 : 1;

        await Version.create({
            note: note._id,
            user: req.user._id,
            title: note.title,
            content: note.content,
            versionNumber: nextVersion,
        });

        // Restore the selected version
        const updated = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { title: version.title, content: version.content },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Sharing ─────────────────────────────────────────────

// PUT /api/notes/:id/share — toggle sharing and generate/remove token
router.put('/:id/share', async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        if (note.isShared) {
            // Disable sharing
            note.isShared = false;
            note.shareToken = null;
        } else {
            // Enable sharing with a new token
            note.isShared = true;
            note.shareToken = crypto.randomBytes(16).toString('hex');
        }

        await note.save();
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
