// ── routes/cart.js ────────────────────────────────────────────────────────────
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const cart       = require('../controllers/cart');

router.get('/',              catchAsync(cart.showCart));
router.post('/add',          catchAsync(cart.addToCart));
router.post('/update',       cart.updateCart);
router.post('/remove',       cart.removeFromCart);
router.post('/coupon',       cart.applyCouponCode);
router.delete('/coupon',     cart.removeCoupon);
router.post('/clear',        cart.clearCart);

module.exports = router;
