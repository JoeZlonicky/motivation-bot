const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    userID: {
        type: String,
        required: true
    },
    what: String,
    intervalMinutes: {
        type: Number,
        required: true
    },
    lastNotified: {
        type: Date,
        required: true,
        default: Date.now
    },
    started: {
        type: Date,
        required: true,
        default: Date.now
    }
});

module.exports = mongoose.model('reminder', Schema);
