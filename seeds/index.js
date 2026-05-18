// seeds/index.js — Run with: node seeds/index.js
if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../models/product');
const User     = require('../models/user');

const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/rohit-power-tools';

const sampleProducts = [
  {
    name: 'Bosch GSB 550 Watt Drill',
    brand: 'Bosch', category: 'Drills',
    price: 3499, mrp: 5999, stock: 50,
    badge: 'Best Seller', badgeType: 'badge-orange', isFeatured: true,
    description: 'The Bosch GSB 550 is a powerful 550W impact drill designed for heavy-duty drilling in concrete, wood, and metal. Features variable speed control and a robust metal gearbox.',
    images: [{ url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', filename: 'seed-1' }],
    specs: [
      { key: 'Power', value: '550W' }, { key: 'No-Load Speed', value: '0-3000 rpm' },
      { key: 'Max Drill (Concrete)', value: '13mm' }, { key: 'Weight', value: '1.9 kg' },
      { key: 'Chuck Size', value: '13mm' }, { key: 'Warranty', value: '2 Years' },
    ],
    features: ['Electronic speed control', 'Rotation lock for chiselling', 'Metal gearbox for durability', 'Ergonomic soft-grip handle'],
    inBox: ['GSB 550 Drill Machine', 'Auxiliary Handle', 'Depth Stop', 'Chuck Key', 'Carry Case'],
  },
  {
    name: 'Makita 9523NB Angle Grinder 720W',
    brand: 'Makita', category: 'Grinders',
    price: 4299, mrp: 6500, stock: 35,
    badge: 'Sale', badgeType: 'badge-red', isFeatured: true,
    description: 'Professional 720W angle grinder with 100mm disc. Ideal for grinding, cutting, and polishing metal and masonry. Compact and lightweight design.',
    images: [{ url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&q=80', filename: 'seed-2' }],
    specs: [
      { key: 'Power', value: '720W' }, { key: 'No-Load Speed', value: '11,000 rpm' },
      { key: 'Disc Diameter', value: '100mm' }, { key: 'Weight', value: '1.6 kg' },
    ],
    features: ['720W powerful motor', 'Anti-restart protection', 'Tool-less guard adjustment', 'Slim body design'],
    inBox: ['Makita 9523NB Grinder', 'Wheel Guard', 'Side Handle', 'Two Pin Spanner'],
  },
  {
    name: 'DeWalt DCS331 20V Jigsaw Cordless',
    brand: 'DeWalt', category: 'Saws',
    price: 11999, mrp: 16500, stock: 20,
    badge: 'Top Pick', badgeType: 'badge-yellow', isFeatured: true,
    description: '20V MAX Cordless Jigsaw with keyless blade change, 4-position orbital action, and LED work light. Perfect for curved and straight cuts.',
    images: [{ url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', filename: 'seed-3' }],
    specs: [
      { key: 'Power', value: '20V MAX Battery' }, { key: 'Stroke Length', value: '26mm' },
      { key: 'SPM', value: '0–3,000' }, { key: 'Weight', value: '2.4 kg' },
    ],
    features: ['Keyless blade change', '4-position orbital action', 'LED work light', 'Low vibration'],
    inBox: ['DCS331 Jigsaw', '20V 2Ah Battery', 'Fast Charger', 'Blade Set (5pc)', 'Carry Bag'],
  },
  {
    name: 'Stanley 1/2" Air Impact Wrench',
    brand: 'Stanley', category: 'Wrenches',
    price: 6799, mrp: 9999, stock: 40,
    badge: '32% Off', badgeType: 'badge-green', isFeatured: true,
    description: 'Professional 1/2" air impact wrench with 680 Nm maximum torque. Ideal for automotive repair and industrial maintenance.',
    images: [{ url: 'https://images.unsplash.com/photo-1609767760386-9b4b2d7f3aa9?w=600&q=80', filename: 'seed-4' }],
    specs: [
      { key: 'Max Torque', value: '680 Nm' }, { key: 'Drive Size', value: '1/2 inch' },
      { key: 'Weight', value: '2.1 kg' }, { key: 'Air Pressure', value: '6.2 bar' },
    ],
    features: ['680 Nm max torque', '4-position power regulator', 'Twin hammer mechanism', 'Lightweight composite housing'],
    inBox: ['Impact Wrench', '4 Sockets', 'Extension Bar', 'Carry Case'],
  },
  {
    name: 'Bosch GEX 125 Random Orbit Sander',
    brand: 'Bosch', category: 'Sanders',
    price: 5499, mrp: 7800, stock: 28,
    badge: 'New', badgeType: 'badge-steel', isFeatured: false,
    description: '250W random orbit sander with microfilter system and Velcro backing pad. Delivers swirl-free finish on wood and painted surfaces.',
    images: [{ url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777540?w=600&q=80', filename: 'seed-5' }],
    specs: [
      { key: 'Power', value: '250W' }, { key: 'Speed', value: '12,000 rpm' },
      { key: 'Sanding Disc', value: '125mm' }, { key: 'Weight', value: '1.3 kg' },
    ],
    features: ['Microfilter dust collection', 'Velcro sanding pad', 'Soft grip for comfort', 'Variable speed'],
    inBox: ['GEX 125 Sander', 'Sanding Disc Set (5pc)', 'Dust Box', 'Carry Bag'],
  },
  {
    name: 'Milwaukee M12 Brushless Drill Kit',
    brand: 'Milwaukee', category: 'Drills',
    price: 14999, mrp: 19500, stock: 15,
    badge: 'Premium', badgeType: 'badge-orange', isFeatured: true,
    description: 'Milwaukee M12 compact drill kit with brushless motor for maximum runtime. Features REDLINK Intelligence for overload protection.',
    images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80', filename: 'seed-6' }],
    specs: [
      { key: 'Power', value: '12V Li-Ion' }, { key: 'Max Torque', value: '35 Nm' },
      { key: 'Speed', value: '0-1,500 rpm' }, { key: 'Weight', value: '1.1 kg' },
      { key: 'Warranty', value: '5 Years' },
    ],
    features: ['Brushless motor', 'REDLINK Intelligence', 'All-metal chuck', '2 batteries included', '5-year warranty'],
    inBox: ['M12 Drill', '2× 12V Batteries', 'Rapid Charger', 'Milwaukee Bag', 'Bit Set'],
  },
  {
    name: 'Hitachi Circular Saw 185mm 1200W',
    brand: 'Hitachi', category: 'Saws',
    price: 7999, mrp: 11500, stock: 22,
    badge: 'Sale', badgeType: 'badge-red', isFeatured: false,
    description: '1200W circular saw with 185mm blade. Ideal for ripping boards, cross-cutting lumber, and sheet goods. Features laser guide.',
    images: [{ url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', filename: 'seed-7' }],
    specs: [
      { key: 'Power', value: '1200W' }, { key: 'Blade Diameter', value: '185mm' },
      { key: 'Speed', value: '5,500 rpm' }, { key: 'Weight', value: '4.0 kg' },
    ],
    features: ['1200W motor', 'Laser guide', 'Bevel cuts to 45°', 'Dust extraction port'],
    inBox: ['Circular Saw', '185mm TCT Blade', 'Parallel Fence', 'Hex Key'],
  },
  {
    name: 'DeWalt 20pc Titanium Drill Bit Set',
    brand: 'DeWalt', category: 'Accessories',
    price: 999, mrp: 1499, stock: 200,
    badge: 'Best Value', badgeType: 'badge-green', isFeatured: false,
    description: 'Professional 20-piece drill bit set with HSS titanium coating for extended life. Includes wood, metal, and masonry bits.',
    images: [{ url: 'https://images.unsplash.com/photo-1609767760386-9b4b2d7f3aa9?w=600&q=80', filename: 'seed-8' }],
    specs: [
      { key: 'Pieces', value: '20' }, { key: 'Material', value: 'HSS Titanium' },
      { key: 'Sizes', value: '2mm–13mm' }, { key: 'Compatibility', value: 'All drills' },
    ],
    features: ['Titanium nitride coating', 'High-speed steel', 'Magnetic carry case', 'Color coded by type'],
    inBox: ['20× Drill Bits (assorted)', 'Magnetic Storage Case'],
  },
];

async function seed() {
  try {
    await mongoose.connect(DB_URL);
    console.log('✅  Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑  Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅  Inserted ${sampleProducts.length} products`);

    // Create admin user if not exists
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const admin = new User({ email: 'admin@rohitpowertools.in', username: 'admin', isAdmin: true });
      await User.register(admin, 'admin123');
      console.log('✅  Admin user created: username=admin, password=admin123');
    }

    // Create test user if not exists
    const testExists = await User.findOne({ username: 'testuser' });
    if (!testExists) {
      const test = new User({ email: 'test@rohitpowertools.in', username: 'testuser', fullName: 'Test User' });
      await User.register(test, 'test123');
      console.log('✅  Test user created: username=testuser, password=test123');
    }

    console.log('\n🚀  Database seeded successfully!');
    console.log('📋  Login credentials:');
    console.log('    Admin:    username=admin,    password=admin123');
    console.log('    Customer: username=testuser, password=test123');
  } catch (err) {
    console.error('❌  Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋  Disconnected from MongoDB');
  }
}

seed();
