// routes/chatRoute.js
const router      = require('express').Router();
const { chat }    = require('../controllers/chatController');
const rateLimit   = require('../middlewares/rateLimit');

router.post('/', rateLimit, chat);
module.exports = router;
