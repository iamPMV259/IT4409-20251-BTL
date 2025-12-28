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
    },
    details: {
        type: mongoose.Schema.Types.Mixed, 
    },
}, {
    timestamps: true,
    collection: 'activities' 
});

module.exports = mongoose.model('Activity', ActivitySchema);