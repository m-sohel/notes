const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// GET /api/shared/:token — public route (no auth) to view a shared note
router.get('/:token', async (req, res) => {
    try {
        const note = await Note.findOne({
            shareToken: req.params.token,
            isShared: true,
            isTrashed: { $ne: true },
        }).select('title content tags createdAt updatedAt');

        if (!note) {
            return res.status(404).json({ error: 'Shared note not found or sharing is disabled' });
        }

        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
