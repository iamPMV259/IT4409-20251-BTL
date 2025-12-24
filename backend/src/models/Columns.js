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
    taskOrder: [{
        type: mongoose.Schema.Types.UUID,
        ref: 'Task',
    }],
}, {
    timestamps: true,
    collection: 'columns',
    toJSON: {
        getters: true,
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            delete ret.id;

            if (ret._id && typeof ret._id === 'object' && ret._id.toString) {
                ret._id = ret._id.toString();
            }
            if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId.toString) {
                ret.projectId = ret.projectId.toString();
            }

            if (ret.taskOrder && Array.isArray(ret.taskOrder)) {
                ret.taskOrder = ret.taskOrder.map(id => 
                    (id && typeof id === 'object' && id.toString) ? id.toString() : id
                );
            }
            return ret;
        }
    }
});

module.exports = mongoose.model('Column', ColumnSchema);