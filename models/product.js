const mongoose   = require('mongoose');
const { Schema } = mongoose;

// ── Image sub-schema ──────────────────────────────────────────────────────────
const ImageSchema = new Schema({
  url:      String,
  filename: String,
});
ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_300,h_225,c_fill');
});

// ── Review sub-schema (embedded) ──────────────────────────────────────────────
const ReviewSchema = new Schema({
  user:    { type: Schema.Types.ObjectId, ref: 'User' },
  name:    String,
  rating:  { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  date:    { type: Date, default: Date.now },
});

// ── Product schema ────────────────────────────────────────────────────────────
const ProductSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  brand:       { type: String, required: true },
  category:    {
    type: String, required: true,
    enum: ['Drills', 'Grinders', 'Saws', 'Wrenches', 'Sanders', 'Accessories']
  },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  mrp:         { type: Number, required: true, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  images:      [ImageSchema],
  specs:       [{ key: String, value: String }],
  features:    [String],
  inBox:       [String],
  badge:       String,
  badgeType:   { type: String, default: 'badge-orange' },
  isFeatured:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  reviews:     [ReviewSchema],
  createdAt:   { type: Date, default: Date.now },
}, { toJSON: { virtuals: true } });

// ── Virtuals ──────────────────────────────────────────────────────────────────
ProductSchema.virtual('discount').get(function () {
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});
ProductSchema.virtual('avgRating').get(function () {
  if (!this.reviews.length) return 0;
  const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});
ProductSchema.virtual('primaryImage').get(function () {
  return this.images.length ? this.images[0].url
    : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=70';
});

module.exports = mongoose.model('Product', ProductSchema);
