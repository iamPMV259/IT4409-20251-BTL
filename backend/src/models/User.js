// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: () => new mongoose.Types.UUID(),
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: [true, 'Please add a password hash'],
    },
    avatarUrl: {
        type: String,
        default: 'default-avatar.png',
    },

}, {
    timestamps: true,
    collection: 'users',
    toJSON: {
        getters: true,
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.passwordHash; 
            delete ret.__v;
            delete ret.id;
            return ret;
        }
    }
});

module.exports = mongoose.model('User', UserSchema);