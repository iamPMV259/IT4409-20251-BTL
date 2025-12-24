// src/models/Workspace.js
const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.UUID,
    default: () => new mongoose.Types.UUID(),
  },
  name: {
    type: String,
    required: [true, 'Please add a workspace name'],
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.UUID,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.UUID,
    ref: 'User',
  }],
}, {
  timestamps: true,
  collection: 'workspaces' 
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);