const express    = require('express');
const router     = express.Router();
const passport   = require('passport');
const catchAsync = require('../utils/catchAsync');
const auth       = require('../controllers/auth');
const { isLoggedIn, storeReturnTo } = require('../middleware');

router.get('/register', auth.renderRegister);
router.post('/register', catchAsync(auth.register));

router.get('/login', auth.renderLogin);
router.post('/login', storeReturnTo,
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash:    true,
  }),
  auth.login
);

router.get('/logout', auth.logout);

router.get('/profile', isLoggedIn, catchAsync(auth.profile));
router.post('/profile/update', isLoggedIn, catchAsync(auth.updateProfile));

module.exports = router;
