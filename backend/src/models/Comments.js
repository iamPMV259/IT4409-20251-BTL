// src/models/Comments.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.UUID,
    default: () => new mongoose.Types.UUID(),
  },
  taskId: {
    type: mongoose.Schema.Types.UUID,
    ref: 'Task',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.UUID,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Comment content cannot be empty'],
  },
}, {
  timestamps: true,
  collection: 'comments' // Explicitly set collection name to match MongoDB
});

module.exports = mongoose.model('Comment', CommentSchema);