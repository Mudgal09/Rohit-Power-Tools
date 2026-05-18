const User = require('../models/user');

// GET /register
module.exports.renderRegister = (req, res) => {
  res.render('users/register', { title: 'Register' });
};

// POST /register
module.exports.register = async (req, res, next) => {
  try {
    const { email, username, fullName, password } = req.body;
    const user = new User({ email, username, fullName });
    const registered = await User.register(user, password);
    req.login(registered, err => {
      if (err) return next(err);
      req.flash('success', `Welcome to Rohit Power Tools, ${username}! 🎉`);
      const redirectUrl = req.session.returnTo || '/products';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
};

// GET /login
module.exports.renderLogin = (req, res) => {
  res.render('users/login', { title: 'Login' });
};

// POST /login — passport.authenticate() runs before this
module.exports.login = (req, res) => {
  req.flash('success', `Welcome back, ${req.user.username}! ⚡`);
  const redirectUrl = req.session.returnTo || '/products';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

// GET /logout
module.exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully. Come back soon!');
    res.redirect('/');
  });
};

// GET /profile
module.exports.profile = (req, res) => {
  res.render('users/profile', { title: 'My Profile' });
};

// POST /profile/update
module.exports.updateProfile = async (req, res) => {
  const { fullName, phone, line1, city, state, pincode } = req.body;
  await User.findByIdAndUpdate(req.user._id, {
    fullName, phone,
    address: { line1, city, state, pincode }
  });
  req.flash('success', 'Profile updated successfully!');
  res.redirect('/profile');
};
