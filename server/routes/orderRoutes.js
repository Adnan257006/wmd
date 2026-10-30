const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Student routes
router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required in the order'),
    body('slot').notEmpty().withMessage('Slot ID is required'),
    validate
  ],
  createOrder
);

router.get('/my', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, adminOnly, getAllOrders);
router.put(
  '/:id/status',
  protect,
  adminOnly,
  [
    body('status').notEmpty().withMessage('Status is required'),
    validate
  ],
  updateOrderStatus
);

module.exports = router;
