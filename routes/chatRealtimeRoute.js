const express = require('express');
const router = express.Router();

const c = require('../controllers/chatRealtimeController');

// REST under /chat-api/*
router.post('/chats', c.createDirectChat);        // create/find direct chat
router.get('/me/chats', c.listMyChats);           // list with unread + last
router.get('/chats/:id/messages', c.getMessages); // history
router.post('/chats/:id/messages', c.postMessage);// Postman helper send

module.exports = router;
