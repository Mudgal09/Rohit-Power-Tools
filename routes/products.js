const express      = require('express');
const router       = express.Router();
const catchAsync   = require('../utils/catchAsync');
const products     = require('../controllers/products');
const { isLoggedIn, validateReview } = require('../middleware');

router.get('/',    catchAsync(products.index));
router.get('/:id', catchAsync(products.show));

router.post('/:id/reviews', isLoggedIn, validateReview, catchAsync(products.addReview));
router.delete('/:id/reviews/:reviewId', isLoggedIn, catchAsync(products.deleteReview));
router.post('/:id/wishlist', isLoggedIn, catchAsync(products.toggleWishlist));

module.exports = router;
