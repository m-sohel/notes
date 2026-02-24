const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: 100,
    },
    icon: {
      type: String,
      default: '📁',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for note count
folderSchema.virtual('noteCount', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'folder',
  count: true,
});

module.exports = mongoose.model('Folder', folderSchema);
