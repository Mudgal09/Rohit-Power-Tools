const mongoose   = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  product:  { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     String,
  brand:    String,
  image:    String,
  price:    Number,
  qty:      { type: Number, default: 1 },
});

const OrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items:       [OrderItemSchema],

  shippingAddress: {
    fullName: String,
    phone:    String,
    line1:    String,
    city:     String,
    state:    String,
    pincode:  String,
  },

  pricing: {
    subtotal: Number,
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    gst:      Number,
    total:    Number,
  },

  couponCode:    String,

  payment: {
    method:            { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status:            { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paidAt:            Date,
  },

  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed'
  },

  tracking: [{
    status:  String,
    message: String,
    date:    { type: Date, default: Date.now }
  }],

  estimatedDelivery: Date,
  deliveredAt:       Date,
  notes:             String,
  createdAt:         { type: Date, default: Date.now },
});

// ── Auto-generate order number ────────────────────────────────────────────────
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `RPT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  // Add tracking entry when status changes
  if (this.isModified('status')) {
    const messages = {
      placed:      'Order placed successfully',
      confirmed:   'Order confirmed by seller',
      processing:  'Your order is being packed',
      shipped:     'Order shipped – out for delivery',
      delivered:   'Order delivered successfully',
      cancelled:   'Order has been cancelled',
      returned:    'Return initiated',
    };
    this.tracking.push({ status: this.status, message: messages[this.status] });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
