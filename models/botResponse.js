// models/BotResponse.js

const mongoose = require('mongoose');

const BotResponseSchema = new mongoose.Schema({
    intent: {
        type: String,
        required: true,
        unique: true,
    },
    responses: {
        type: [String],
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('BotResponse', BotResponseSchema);
