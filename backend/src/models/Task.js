// src/models/Task.js
const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: () => new mongoose.Types.UUID(),
    },
    text: {
        type: String,
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
});

const TaskSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: () => new mongoose.Types.UUID(),
    },
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true,
    },
    description: {
        type: String,
    },
    projectId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'Project',
        required: true,
        index: true,
    },
    columnId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'Column',
        required: true,
        index: true,
    },
    creatorId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'User',
        required: true,
    },
    // Mảng các ID người dùng được giao việc
    assignees: [{
        type: mongoose.Schema.Types.UUID,
        ref: 'User',
    }],
    dueDate: {
        type: Date,
        index: true,
    },
    // Mảng các ID nhãn
    labels: [{
        type: mongoose.Schema.Types.UUID,
        ref: 'Label',
    }],
    checklists: [ChecklistItemSchema],
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);