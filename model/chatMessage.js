const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const chatMessageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    msgs: [messageSchema]
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
