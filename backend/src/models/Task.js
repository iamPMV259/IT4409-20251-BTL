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
}, {
    _id: false,
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
    assignees: [{
        type: mongoose.Schema.Types.UUID,
        ref: 'User',
    }],
    dueDate: {
        type: Date,
        index: true,
    },
    labels: [{
        type: mongoose.Schema.Types.UUID,
        ref: 'Label',
    }],
    checklists: [ChecklistItemSchema],
}, {
    timestamps: true,
    collection: 'tasks',
    toJSON: {
        getters: true,
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            delete ret.id;

            const uuidFields = ['_id', 'projectId', 'columnId', 'creatorId'];
            uuidFields.forEach(field => {
                if (ret[field] && typeof ret[field] === 'object' && ret[field].toString) {
                    ret[field] = ret[field].toString();
                }
            });

            const arrayUUIDFields = ['assignees', 'labels'];
            arrayUUIDFields.forEach(field => {
                if (ret[field] && Array.isArray(ret[field])) {
                    ret[field] = ret[field].map(item => {
                        if (item && typeof item === 'object' && item.constructor.name === 'Binary') {
                            return item.toString();
                        }
                        return item;
                    });
                }
            });

            return ret;
        }
    }
});

module.exports = mongoose.model('Task', TaskSchema);