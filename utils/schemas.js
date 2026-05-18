const Joi = require('joi');

module.exports.productSchema = Joi.object({
  product: Joi.object({
    name:        Joi.string().required(),
    brand:       Joi.string().required(),
    category:    Joi.string().valid('Drills','Grinders','Saws','Wrenches','Sanders','Accessories').required(),
    description: Joi.string().required(),
    price:       Joi.number().required().min(1),
    mrp:         Joi.number().required().min(1),
    stock:       Joi.number().min(0).default(0),
    badge:       Joi.string().allow('', null),
    badgeType:   Joi.string().allow('', null),
    isFeatured:  Joi.boolean().default(false),
    features:    Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    inBox:       Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  }).required(),
  deleteImages: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating:  Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});

module.exports.registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email:    Joi.string().email().required(),
  fullName: Joi.string().allow(''),
  password: Joi.string().min(6).required(),
});

module.exports.orderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone:    Joi.string().length(10).required(),
    line1:    Joi.string().required(),
    city:     Joi.string().required(),
    state:    Joi.string().required(),
    pincode:  Joi.string().length(6).required(),
  }).required(),
  paymentMethod: Joi.string().valid('razorpay', 'cod').default('razorpay'),
  couponCode:    Joi.string().allow('', null),
});
