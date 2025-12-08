// src/models/Projects.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.UUID,
    default: () => new mongoose.Types.UUID(),
  },
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
  },
  description: {
    type: String,
  },
  workspaceId: {
    type: mongoose.Schema.Types.UUID,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.UUID,
    ref: 'User',
    required: true,
  },
  // Lưu trữ IDs người dùng
  members: [{
    type: mongoose.Schema.Types.UUID,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed'],
    default: 'active',
  },
  deadline: {
    type: Date,
  },
  // Mảng các ID tham chiếu đến 'columns', quyết định thứ tự các cột
  columnOrder: [{
    type: mongoose.Schema.Types.UUID,
    ref: 'Column',
  }],
  // Mẫu tính toán (Computed Pattern) để tối ưu hóa việc đọc
  taskStats: {
    open: {
      type: Number,
      default: 0,
    },
    closed: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
  collection: 'projects' // Explicitly set collection name to match MongoDB
});

module.exports = mongoose.model('Project', ProjectSchema);