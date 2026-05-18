// ── app.js ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const express        = require('express');
const mongoose       = require('mongoose');
const session        = require('express-session');
const flash          = require('connect-flash');
const passport       = require('passport');
const LocalStrategy  = require('passport-local');
const helmet         = require('helmet');
const mongoSanitize  = require('express-mongo-sanitize');
const methodOverride = require('method-override');
const ejsMate        = require('ejs-mate');
const path           = require('path');
const User           = require('./models/user');
const ExpressError   = require('./utils/ExpressError');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
const chatRoutes    = require('./routes/chat');

const app    = express();
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/rohit-power-tools';
const SECRET = process.env.SECRET || 'rohitpowertoolssecret2025';
const PORT   = process.env.PORT   || 3000;

// View engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Core middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({ replaceWith: '_' }));

// Helmet - disable CSP in development, enable in production
app.use(helmet({
  contentSecurityPolicy:     false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy:   false,
}));

// Connect MongoDB first, then boot everything
mongoose.connect(DB_URL)
  .then(() => {
    console.log('✅  MongoDB connected');

    // connect-mongo v3 API
    const MongoStore = require('connect-mongo')(session);

    app.use(session({
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
        secret:     SECRET,
        touchAfter: 24 * 3600,
      }),
      name:              'rpt.session',
      secret:            SECRET,
      resave:            false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      }
    }));

    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use((req, res, next) => {
      res.locals.currentUser = req.user || null;
      res.locals.success     = req.flash('success') || [];
      res.locals.error       = req.flash('error')   || [];
      res.locals.cartCount   = (req.session && req.session.cart)
        ? req.session.cart.reduce((s, i) => s + i.qty, 0) : 0;
      next();
    });

    app.use('/',         authRoutes);
    app.use('/products', productRoutes);
    app.use('/cart',     cartRoutes);
    app.use('/orders',   orderRoutes);
    app.use('/admin',    adminRoutes);
    app.use('/api/chat', chatRoutes);

    app.get('/',        (req, res) => res.render('home',          { title: 'Rohit Power Tools' }));
    app.get('/chatbot', (req, res) => res.render('chatbot/index', { title: 'AI Support' }));

    app.all('*', (req, res, next) => next(new ExpressError('Page Not Found', 404)));

    app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const message    = err.message    || 'Something went wrong';
      if (!res.headersSent) {
        res.status(statusCode).render('error', { err: { statusCode, message }, title: 'Error' });
      }
    });

    app.listen(PORT, () => {
      console.log('🚀  Rohit Power Tools running at http://localhost:' + PORT);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB FAILED:', err.message);
    console.error('👉  Check DB_URL in your .env file');
    process.exit(1);
  });
