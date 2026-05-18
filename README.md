# ⚡ Rohit Power Tools — Full-Stack eCommerce

> India's #1 Power Tool Store — Built with Node.js, Express, MongoDB, EJS & AI

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express.js v4 |
| Database | MongoDB Atlas + Mongoose |
| Views | EJS + ejs-mate + Bootstrap 5 |
| Auth | Passport.js + passport-local-mongoose |
| Images | Cloudinary + Multer |
| Payments | Razorpay |
| AI Chatbot | Anthropic Claude API |
| Security | Helmet, express-mongo-sanitize, Joi |
| Hosting | Render.com |

---

## 📁 Project Structure

```
rohit-power-tools/
├── app.js                    ← Express entry point
├── .env                      ← Environment variables (never commit!)
├── .env.example              ← Template for .env
├── package.json
├── config/
│   ├── cloudinary.js         ← Cloudinary SDK setup
│   └── razorpay.js           ← Razorpay SDK setup
├── controllers/
│   ├── auth.js               ← Register, login, logout, profile
│   ├── products.js           ← CRUD + reviews + wishlist
│   ├── cart.js               ← Cart, coupon logic
│   ├── orders.js             ← Checkout, Razorpay, order tracking
│   ├── admin.js              ← Admin dashboard, product/order/user mgmt
│   └── chat.js               ← Claude AI chatbot endpoint
├── middleware/
│   └── index.js              ← isLoggedIn, isAdmin, validators, coupon
├── models/
│   ├── user.js               ← User schema (PLM plugin)
│   ├── product.js            ← Product schema (images, reviews, specs)
│   └── order.js              ← Order schema (items, payment, tracking)
├── routes/
│   ├── auth.js               ← /login /register /logout /profile
│   ├── products.js           ← /products /products/:id
│   ├── cart.js               ← /cart
│   ├── orders.js             ← /orders /orders/checkout
│   ├── admin.js              ← /admin (all admin routes)
│   └── chat.js               ← /api/chat (AI endpoint)
├── utils/
│   ├── ExpressError.js       ← Custom error class
│   ├── catchAsync.js         ← Async error wrapper
│   └── schemas.js            ← Joi validation schemas
├── views/
│   ├── layouts/boilerplate.ejs
│   ├── partials/ (navbar, footer)
│   ├── home.ejs
│   ├── error.ejs
│   ├── chatbot/index.ejs
│   ├── products/ (index, show)
│   ├── cart/index.ejs
│   ├── orders/ (checkout, index, show)
│   ├── users/ (login, register, profile)
│   └── admin/ (dashboard, products, orders, users)
├── public/
│   ├── stylesheets/main.css
│   └── javascripts/main.js
└── seeds/index.js            ← Database seeder
```

---

## ⚙️ Local Setup

### 1. Clone and install
```bash
git clone https://github.com/your-username/rohit-power-tools.git
cd rohit-power-tools
npm install
```

### 2. Create `.env` file
```bash
cp .env.example .env
```
Fill in your credentials (see section below).

### 3. Seed the database
```bash
node seeds/index.js
```
This creates 8 sample products + admin and test user accounts.

### 4. Start the server
```bash
npm run dev          # development (nodemon auto-reload)
npm start            # production
```

Visit: **http://localhost:3000**

---

## 🔑 Environment Variables

Create a `.env` file in the root with these values:

| Variable | Where to get it |
|---|---|
| `DB_URL` | MongoDB Atlas → Connect → Driver → copy connection string |
| `SECRET` | Any long random string (e.g. generate with `openssl rand -hex 32`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → Account Details |
| `CLOUDINARY_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_SECRET` | Cloudinary Dashboard → API Keys |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → API Keys (use test keys) |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys |
| `GEMINI_API_KEY      | console.anthropic.com → API Keys |
| `NODE_ENV` | Set to `production` on Render |
| `PORT` | 3000 (default) |

---

## 👤 Default Accounts (after seeding)

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Customer** | `testuser` | `test123` |

---

## 🛒 Features

### Customer
- Browse & search 8 power tool categories
- Filter by brand, category, price, rating
- Product detail with image gallery, specs, reviews
- Add to cart with qty control
- Apply coupon codes (ROHIT10, TOOLS20, FLAT500, NEWUSER)
- Checkout with Razorpay (UPI/Card/Net Banking) or COD
- Order tracking with live status timeline
- Cancel orders (before shipped)
- User profile with saved address
- Wishlist (add/remove)
- Write & delete product reviews
- 🤖 **Bolt AI chatbot** — Claude-powered 24/7 support

### Admin (`/admin`)
- Dashboard with stats (revenue, orders, users, low stock)
- Add / Edit / Delete products with Cloudinary image upload
- Manage orders — update status (placed → confirmed → shipped → delivered)
- View all customers

---

## 💳 Razorpay Test Cards

Use these in test mode:
- Card: `4111 1111 1111 1111` | Expiry: any future | CVV: any
- UPI: `success@razorpay`

---

## 🌐 Deploy to Render.com

1. Push code to GitHub
2. Create **New Web Service** on Render
3. Connect your GitHub repo
4. Set:
   - Build Command: `npm install`
   - Start Command: `node app.js`
5. Add all environment variables in Render dashboard
6. Deploy!

---

## 🎫 Coupon Codes

| Code | Discount | Min Order |
|---|---|---|
| `ROHIT10` | 10% off | ₹500 |
| `TOOLS20` | 20% off | ₹2,000 |
| `FLAT500` | ₹500 flat off | ₹3,000 |
| `NEWUSER` | 15% off | None |

---

## 📄 License

MIT © Rohit Power Tools
