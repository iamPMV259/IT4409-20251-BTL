// src/models/Labels.js
const mongoose = require('mongoose');

const LabelSchema = new mongoose.Schema({
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
    text: {
        type: String,
        required: true,
        trim: true,
    },
    color: {
        type: String,
        required: true,
        match: [/^#([0-9A-F]{3}){1,2}$/i, 'Please provide a valid hex color code'], 
    },
}, {
    collection: 'labels' 
});

module.exports = mongoose.model('Label', LabelSchema);