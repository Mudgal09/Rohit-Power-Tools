const ExpressError              = require('../utils/ExpressError');
const { productSchema, reviewSchema, orderSchema } = require('../utils/schemas');
const Product                   = require('../models/product');

// ── Auth guards ───────────────────────────────────────────────────────────────
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be logged in to do that.');
    return res.redirect('/login');
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    req.flash('error', 'Admin access required.');
    return res.redirect('/');
  }
  next();
};

// ── returnTo helper ───────────────────────────────────────────────────────────
module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};

// ── Joi validators ────────────────────────────────────────────────────────────
module.exports.validateProduct = (req, res, next) => {
  const { error } = productSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(e => e.message).join(', ');
    throw new ExpressError(msg, 400);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(e => e.message).join(', ');
    throw new ExpressError(msg, 400);
  }
  next();
};

module.exports.validateOrder = (req, res, next) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(e => e.message).join(', ');
    throw new ExpressError(msg, 400);
  }
  next();
};

// ── Cart helpers ──────────────────────────────────────────────────────────────
module.exports.getCart = (req) => req.session.cart || [];

module.exports.saveCart = (req, cart) => { req.session.cart = cart; };

// ── Coupon validator ──────────────────────────────────────────────────────────
const COUPONS = {
  'ROHIT10':  { type: 'percent', value: 10, min: 500 },
  'TOOLS20':  { type: 'percent', value: 20, min: 2000 },
  'FLAT500':  { type: 'flat',    value: 500, min: 3000 },
  'NEWUSER':  { type: 'percent', value: 15, min: 0 },
};
module.exports.COUPONS = COUPONS;

module.exports.applyCoupon = (code, subtotal) => {
  const coupon = COUPONS[code?.toUpperCase()];
  if (!coupon) return { valid: false, discount: 0, message: 'Invalid coupon code.' };
  if (subtotal < coupon.min) return { valid: false, discount: 0, message: `Minimum order ₹${coupon.min} required.` };
  const discount = coupon.type === 'percent'
    ? Math.round(subtotal * coupon.value / 100)
    : coupon.value;
  return { valid: true, discount, message: `Coupon applied! You saved ₹${discount}` };
};
