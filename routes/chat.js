const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const chat       = require('../controllers/chat');

router.post('/', catchAsync(chat.chat));

module.exports = router;
