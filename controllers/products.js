const Product      = require('../models/product');
const { cloudinary } = require('../config/cloudinary');

// GET /products
module.exports.index = async (req, res) => {
  const { category, brand, minPrice, maxPrice, rating, sort, search, page = 1 } = req.query;
  const limit = 12;
  const skip  = (page - 1) * limit;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (brand)    filter.brand    = { $in: Array.isArray(brand) ? brand : [brand] };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search };

  let sortObj = { isFeatured: -1, createdAt: -1 };
  if (sort === 'price-asc')  sortObj = { price: 1 };
  if (sort === 'price-desc') sortObj = { price: -1 };
  if (sort === 'rating')     sortObj = { avgRating: -1 };
  if (sort === 'name')       sortObj = { name: 1 };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  const brands     = await Product.distinct('brand', { isActive: true });
  const totalPages = Math.ceil(total / limit);

  res.render('products/index', {
    title: 'All Products', products, brands,
    filters: req.query, total, totalPages, page: Number(page),
  });
};

// GET /products/:id
module.exports.show = async (req, res) => {
  const product  = await Product.findById(req.params.id);
  if (!product) {
    req.flash('error', 'Product not found.');
    return res.redirect('/products');
  }
  const related = await Product.find({
    category: product.category, _id: { $ne: product._id }, isActive: true
  }).limit(4);

  res.render('products/show', { title: product.name, product, related });
};

// POST /products/:id/reviews
module.exports.addReview = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    req.flash('error', 'Product not found.');
    return res.redirect('/products');
  }
  const { rating, comment } = req.body.review;
  product.reviews.push({
    user:    req.user._id,
    name:    req.user.fullName || req.user.username,
    rating:  Number(rating),
    comment,
  });
  await product.save();
  req.flash('success', 'Review added! Thank you. ⭐');
  res.redirect(`/products/${product._id}`);
};

// DELETE /products/:id/reviews/:reviewId
module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Product.findByIdAndUpdate(id, {
    $pull: { reviews: { _id: reviewId } }
  });
  req.flash('success', 'Review deleted.');
  res.redirect(`/products/${id}`);
};

// POST /products/:id/wishlist
module.exports.toggleWishlist = async (req, res) => {
  const user    = req.user;
  const prodId  = req.params.id;
  const idx     = user.wishlist.indexOf(prodId);
  if (idx === -1) {
    user.wishlist.push(prodId);
    await user.save();
    return res.json({ success: true, wishlisted: true, message: 'Added to wishlist!' });
  }
  user.wishlist.splice(idx, 1);
  await user.save();
  res.json({ success: true, wishlisted: false, message: 'Removed from wishlist.' });
};
