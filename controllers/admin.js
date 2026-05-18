const Product    = require('../models/product');
const Order      = require('../models/order');
const User       = require('../models/user');
const { cloudinary } = require('../config/cloudinary');

// GET /admin  — Dashboard
module.exports.dashboard = async (req, res) => {
  const [totalProducts, totalOrders, totalUsers, recentOrders, revenue] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    User.countDocuments({ isAdmin: false }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'username'),
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
  ]);

  const totalRevenue = revenue[0]?.total || 0;
  const lowStock     = await Product.find({ stock: { $lt: 5 }, isActive: true });

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    totalProducts, totalOrders, totalUsers, recentOrders, totalRevenue, lowStock,
  });
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
// GET /admin/products
module.exports.listProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.render('admin/products/index', { title: 'Manage Products', products });
};

// GET /admin/products/new
module.exports.newProductForm = (req, res) => {
  res.render('admin/products/new', { title: 'Add Product' });
};

// POST /admin/products
module.exports.createProduct = async (req, res) => {
  const { product: data } = req.body;
  // Parse arrays from newline-separated textarea inputs
  const features = typeof data.features === 'string'
    ? data.features.split('\n').map(s => s.trim()).filter(Boolean)
    : (data.features || []);
  const inBox = typeof data.inBox === 'string'
    ? data.inBox.split('\n').map(s => s.trim()).filter(Boolean)
    : (data.inBox || []);

  const product = new Product({ ...data, features, inBox });
  product.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
  await product.save();
  req.flash('success', `Product "${product.name}" created!`);
  res.redirect('/admin/products');
};

// GET /admin/products/:id/edit
module.exports.editProductForm = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    req.flash('error', 'Product not found.');
    return res.redirect('/admin/products');
  }
  res.render('admin/products/edit', { title: 'Edit Product', product });
};

// PUT /admin/products/:id
module.exports.updateProduct = async (req, res) => {
  const { product: data, deleteImages } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    req.flash('error', 'Product not found.');
    return res.redirect('/admin/products');
  }

  const features = typeof data.features === 'string'
    ? data.features.split('\n').map(s => s.trim()).filter(Boolean)
    : (data.features || product.features);
  const inBox = typeof data.inBox === 'string'
    ? data.inBox.split('\n').map(s => s.trim()).filter(Boolean)
    : (data.inBox || product.inBox);

  Object.assign(product, { ...data, features, inBox });

  if (req.files && req.files.length) {
    const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
    product.images.push(...newImages);
  }
  if (deleteImages) {
    const toDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
    for (const filename of toDelete) {
      await cloudinary.uploader.destroy(filename);
    }
    product.images = product.images.filter(img => toDelete.indexOf(img.filename) === -1);
  }
  await product.save();
  req.flash('success', 'Product updated!');
  res.redirect('/admin/products');
};

// DELETE /admin/products/:id
module.exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.filename);
    }
    await product.deleteOne();
  }
  req.flash('success', 'Product deleted.');
  res.redirect('/admin/products');
};

// ── ORDERS ────────────────────────────────────────────────────────────────────
// GET /admin/orders
module.exports.listOrders = async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit  = 20;
  const filter = status ? { status } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate('user', 'username email'),
    Order.countDocuments(filter),
  ]);
  res.render('admin/orders/index', {
    title: 'Manage Orders', orders, total,
    totalPages: Math.ceil(total / limit), page: Number(page), status,
  });
};

// GET /admin/orders/:id
module.exports.showOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'username email phone');
  if (!order) {
    req.flash('error', 'Order not found.');
    return res.redirect('/admin/orders');
  }
  res.render('admin/orders/show', { title: `Order ${order.orderNumber}`, order });
};

// PUT /admin/orders/:id/status
module.exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    req.flash('error', 'Order not found.');
    return res.redirect('/admin/orders');
  }
  order.status = status;
  if (status === 'delivered') order.deliveredAt = new Date();
  await order.save();
  req.flash('success', `Order status updated to "${status}".`);
  res.redirect(`/admin/orders/${order._id}`);
};

// ── USERS ─────────────────────────────────────────────────────────────────────
// GET /admin/users
module.exports.listUsers = async (req, res) => {
  const users = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
  res.render('admin/users/index', { title: 'Manage Users', users });
};
