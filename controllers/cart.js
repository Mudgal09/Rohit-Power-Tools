const Product                  = require('../models/product');
const { getCart, saveCart, applyCoupon } = require('../middleware');

// GET /cart
module.exports.showCart = (req, res) => {
  const cart     = getCart(req);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 2000 ? 0 : 99;
  const gst      = Math.round(subtotal * 0.18);
  const coupon   = req.session.coupon || null;
  const discount = coupon ? coupon.discount : 0;
  const total    = subtotal + shipping + gst - discount;

  res.render('cart/index', {
    title: 'My Cart', cart, subtotal, shipping, gst, discount, total, coupon,
  });
};

// POST /cart/add
module.exports.addToCart = async (req, res) => {
  const { productId, qty = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  if (product.stock < 1) return res.status(400).json({ success: false, message: 'Out of stock.' });

  let cart = getCart(req);
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + Number(qty), product.stock);
  } else {
    cart.push({
      productId: productId.toString(),
      name:      product.name,
      brand:     product.brand,
      price:     product.price,
      mrp:       product.mrp,
      image:     product.primaryImage,
      qty:       Number(qty),
      stock:     product.stock,
    });
  }
  saveCart(req, cart);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  res.json({ success: true, message: `${product.name} added to cart!`, cartCount: count });
};

// POST /cart/update
module.exports.updateCart = (req, res) => {
  const { productId, qty } = req.body;
  let cart = getCart(req);
  const item = cart.find(i => i.productId === productId);
  if (item) item.qty = Math.max(1, Math.min(Number(qty), item.stock));
  saveCart(req, cart);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  res.json({ success: true, cartCount: count });
};

// POST /cart/remove
module.exports.removeFromCart = (req, res) => {
  const { productId } = req.body;
  let cart = getCart(req).filter(i => i.productId !== productId);
  saveCart(req, cart);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  res.json({ success: true, cartCount: count });
};

// POST /cart/coupon
module.exports.applyCouponCode = (req, res) => {
  const { code } = req.body;
  const cart      = getCart(req);
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const result    = applyCoupon(code, subtotal);
  if (result.valid) {
    req.session.coupon = { code: code.toUpperCase(), discount: result.discount };
  } else {
    req.session.coupon = null;
  }
  res.json(result);
};

// DELETE /cart/coupon
module.exports.removeCoupon = (req, res) => {
  req.session.coupon = null;
  res.json({ success: true });
};

// POST /cart/clear
module.exports.clearCart = (req, res) => {
  saveCart(req, []);
  req.session.coupon = null;
  res.json({ success: true });
};
