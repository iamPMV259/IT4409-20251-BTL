// src/models/Projects.js
const mongoose = require('mongoose');

// Schema phụ cho Member
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
    // Quan trọng: Áp dụng transform cho cả schema con
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
  // Lưu trữ IDs người dùng
  members: [MemberDataSchema],
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed'],
    default: 'active',
  },
  deadline: {
    type: Date,
  },
  // Mảng các ID tham chiếu đến 'columns'
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
  // --- PHẦN QUAN TRỌNG MỚI THÊM ---
  toJSON: {
    getters: true,  // Cho phép Mongoose chạy hàm getter để convert UUID Buffer -> String
    virtuals: true,
    transform: (doc, ret) => {
      // Xóa trường __v (version key) cho gọn response
      delete ret.__v;
      // Xóa trường id (duplicate của _id) nếu virtuals tạo ra
      delete ret.id;
      
      // Fix thủ công cho các trường UUID nếu getters không tự chạy (đề phòng)
      if (ret._id && typeof ret._id === 'object' && ret._id.toString) {
          ret._id = ret._id.toString();
      }
      if (ret.workspaceId && typeof ret.workspaceId === 'object' && ret.workspaceId.toString) {
          ret.workspaceId = ret.workspaceId.toString();
      }
      // Lưu ý: ownerId nếu đã populate thì nó là Object User, nếu chưa thì là UUID
      if (ret.ownerId && typeof ret.ownerId === 'object' && ret.ownerId.constructor.name === 'Binary') {
          ret.ownerId = ret.ownerId.toString();
      }

      return ret;
    }
  }
});

module.exports = mongoose.model('Project', ProjectSchema);