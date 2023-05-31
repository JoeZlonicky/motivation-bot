const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    nickname: String
});

module.exports = mongoose.model('nickname', Schema);
