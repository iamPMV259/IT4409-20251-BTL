
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: () => new mongoose.Types.UUID(),
    },
    projectId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'Project',
        required: true,
        index: true,
    },
    taskId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'Task',
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.UUID,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        // Ví dụ về các giá trị: 'CREATED_TASK', 'MOVED_TASK', 'ADDED_COMMENT', 'CHANGED_ASSIGNEE'
    },
    details: {
        type: mongoose.Schema.Types.Mixed, // Sử dụng Mixed cho dữ liệu ngữ cảnh linh hoạt
        // Ví dụ: { fromColumn: 'Todo', toColumn: 'In Progress' }
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Activity', ActivitySchema);