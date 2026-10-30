const express = require('express');
const { body } = require('express-validator');
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category')
      .isIn(['Breakfast', 'Lunch', 'Snacks', 'Beverages'])
      .withMessage('Valid category required (Breakfast, Lunch, Snacks, Beverages)'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    validate
  ],
  createMenuItem
);

router.put(
  '/:id',
  protect,
  adminOnly,
  updateMenuItem
);

router.delete('/:id', protect, adminOnly, deleteMenuItem);

module.exports = router;
