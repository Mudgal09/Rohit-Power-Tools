const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const { storage } = require('../config/cloudinary');
const upload     = multer({ storage });
const catchAsync = require('../utils/catchAsync');
const admin      = require('../controllers/admin');
const { isAdmin, validateProduct } = require('../middleware');

// All admin routes require isAdmin
router.use(isAdmin);

router.get('/',                         catchAsync(admin.dashboard));

// Products
router.get('/products',                 catchAsync(admin.listProducts));
router.get('/products/new',             admin.newProductForm);
router.post('/products',    upload.array('images', 8), validateProduct, catchAsync(admin.createProduct));
router.get('/products/:id/edit',        catchAsync(admin.editProductForm));
router.put('/products/:id', upload.array('images', 8), validateProduct, catchAsync(admin.updateProduct));
router.delete('/products/:id',          catchAsync(admin.deleteProduct));

// Orders
router.get('/orders',                   catchAsync(admin.listOrders));
router.get('/orders/:id',               catchAsync(admin.showOrder));
router.put('/orders/:id/status',        catchAsync(admin.updateOrderStatus));

// Users
router.get('/users',                    catchAsync(admin.listUsers));

module.exports = router;
