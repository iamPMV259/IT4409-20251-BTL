// src/models/Columns.js
const mongoose = require('mongoose');

const ColumnSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: () => new mongoose.Types.UUID(),
    },
    title: {
        type: String,
        required: [true, 'Please add a column title'],
        trim: true,
    },
    projectId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'Project',
        required: true,
        index: true,
    },
    // Mảng các ID tham chiếu đến 'tasks', quyết định thứ tự các task
    taskOrder: [{
        type: mongoose.Schema.Types.UUID,
        ref: 'Task',
    }],
}, {
    timestamps: true,
    collection: 'columns' // Explicitly set collection name to match MongoDB
});

module.exports = mongoose.model('Column', ColumnSchema);