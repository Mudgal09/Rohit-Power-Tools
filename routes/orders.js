const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const orders     = require('../controllers/orders');
const { isLoggedIn, validateOrder } = require('../middleware');

router.get('/checkout',                  isLoggedIn, catchAsync(orders.showCheckout));
router.post('/create-razorpay-order',    isLoggedIn, catchAsync(orders.createRazorpayOrder));
router.post('/place',                    isLoggedIn, catchAsync(orders.placeOrder));
router.get('/',                          isLoggedIn, catchAsync(orders.myOrders));
router.get('/:id',                       isLoggedIn, catchAsync(orders.showOrder));
router.post('/:id/cancel',               isLoggedIn, catchAsync(orders.cancelOrder));

module.exports = router;
