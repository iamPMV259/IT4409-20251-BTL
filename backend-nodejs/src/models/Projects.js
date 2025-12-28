// src/models/Projects.js
const mongoose = require('mongoose');

const MemberDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member',
    },
}, { 
    _id: false,
    toJSON: { getters: true } 
});

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
  members: [MemberDataSchema],
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed'],
    default: 'active',
  },
  deadline: {
    type: Date,
  },
  columnOrder: [{
    type: mongoose.Schema.Types.UUID,
    ref: 'Column',
  }],
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
  collection: 'projects',
  toJSON: {
    getters: true,  
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret.id;
      
      if (ret._id && typeof ret._id === 'object' && ret._id.toString) {
          ret._id = ret._id.toString();
      }
      if (ret.workspaceId && typeof ret.workspaceId === 'object' && ret.workspaceId.toString) {
          ret.workspaceId = ret.workspaceId.toString();
      }
      if (ret.ownerId && typeof ret.ownerId === 'object' && ret.ownerId.constructor.name === 'Binary') {
          ret.ownerId = ret.ownerId.toString();
      }

      return ret;
    }
  }
});

module.exports = mongoose.model('Project', ProjectSchema);