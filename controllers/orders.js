const Order    = require('../models/order');
const Product  = require('../models/product');
const razorpay = require('../config/razorpay');
const crypto   = require('crypto');
const { getCart, saveCart } = require('../middleware');

// GET /orders/checkout
module.exports.showCheckout = (req, res) => {
  const cart = getCart(req);
  if (!cart.length) {
    req.flash('error', 'Your cart is empty.');
    return res.redirect('/cart');
  }
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const coupon   = req.session.coupon || null;
  const discount = coupon ? coupon.discount : 0;
  const shipping = subtotal >= 2000 ? 0 : 99;
  const gst      = Math.round(subtotal * 0.18);
  const total    = subtotal + shipping + gst - discount;

  res.render('orders/checkout', {
    title: 'Checkout', cart, subtotal, discount, shipping, gst, total,
    coupon, razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    user: req.user,
  });
};

// POST /orders/create-razorpay-order
module.exports.createRazorpayOrder = async (req, res) => {
  const cart     = getCart(req);
  if (!cart.length) return res.status(400).json({ error: 'Cart is empty.' });

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const coupon   = req.session.coupon || null;
  const discount = coupon ? coupon.discount : 0;
  const shipping = subtotal >= 2000 ? 0 : 99;
  const gst      = Math.round(subtotal * 0.18);
  const total    = subtotal + shipping + gst - discount;

  const options = {
    amount:   total * 100,     // Razorpay expects paise
    currency: 'INR',
    receipt:  `rpt_${Date.now()}`,
    notes:    { userId: req.user._id.toString() },
  };

  const razorpayOrder = await razorpay.orders.create(options);
  res.json({ success: true, order: razorpayOrder, key: process.env.RAZORPAY_KEY_ID });
};

// POST /orders/place
module.exports.placeOrder = async (req, res) => {
  const {
    shippingAddress, paymentMethod,
    razorpayOrderId, razorpayPaymentId, razorpaySignature,
    couponCode,
  } = req.body;

  const cart = getCart(req);
  if (!cart.length) {
    req.flash('error', 'Your cart is empty.');
    return res.redirect('/cart');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const coupon   = req.session.coupon || null;
  const discount = coupon ? coupon.discount : 0;
  const shipping = subtotal >= 2000 ? 0 : 99;
  const gst      = Math.round(subtotal * 0.18);
  const total    = subtotal + shipping + gst - discount;

  // ── Verify Razorpay signature ─────────────────────────────────────────────
  let paymentStatus = 'pending';
  if (paymentMethod === 'razorpay' && razorpayOrderId && razorpayPaymentId) {
    const body      = razorpayOrderId + '|' + razorpayPaymentId;
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body).digest('hex');
    paymentStatus   = expected === razorpaySignature ? 'paid' : 'failed';
  }
  if (paymentMethod === 'cod') paymentStatus = 'pending';

  // ── Build order ───────────────────────────────────────────────────────────
  const order = new Order({
    user:    req.user._id,
    items:   cart.map(i => ({
      product: i.productId,
      name:    i.name,
      brand:   i.brand,
      image:   i.image,
      price:   i.price,
      qty:     i.qty,
    })),
    shippingAddress: JSON.parse(shippingAddress),
    pricing: { subtotal, discount, shipping, gst, total },
    couponCode,
    payment: {
      method:            paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status:            paymentStatus,
      paidAt:            paymentStatus === 'paid' ? new Date() : undefined,
    },
    status:            paymentStatus === 'paid' || paymentMethod === 'cod' ? 'confirmed' : 'placed',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000),
  });

  await order.save();

  // ── Decrement stock ───────────────────────────────────────────────────────
  for (const item of cart) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.qty }
    });
  }

  // ── Clear cart ────────────────────────────────────────────────────────────
  saveCart(req, []);
  req.session.coupon = null;

  req.flash('success', `Order ${order.orderNumber} placed successfully! 🎉`);
  res.redirect(`/orders/${order._id}`);
};

// GET /orders
module.exports.myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.render('orders/index', { title: 'My Orders', orders });
};

// GET /orders/:id
module.exports.showOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('items.product');
  if (!order) {
    req.flash('error', 'Order not found.');
    return res.redirect('/orders');
  }
  res.render('orders/show', { title: `Order ${order.orderNumber}`, order });
};

// POST /orders/:id/cancel
module.exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    req.flash('error', 'Order not found.');
    return res.redirect('/orders');
  }
  if (!['placed', 'confirmed'].includes(order.status)) {
    req.flash('error', 'This order cannot be cancelled at this stage.');
    return res.redirect(`/orders/${order._id}`);
  }
  order.status = 'cancelled';
  await order.save();
  req.flash('success', 'Order cancelled. Refund will be processed in 5–7 days.');
  res.redirect(`/orders/${order._id}`);
};
