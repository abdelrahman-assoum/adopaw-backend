// routes/chatRoute.js
const topicGuard = require('../middlewares/topicGuardGroq');
const router      = require('express').Router();
const { chat }    = require('../controllers/chatController');
const rateLimit   = require('../middlewares/rateLimit');

router.post('/', rateLimit, topicGuard, chat);
module.exports = router;
