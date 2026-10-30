const express = require('express');
const { body } = require('express-validator');
const {
  getSlots,
  getAllSlotsAdmin,
  createSlot,
  updateSlot,
  deleteSlot
} = require('../controllers/slotController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', getSlots);
router.get('/admin', protect, adminOnly, getAllSlotsAdmin);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('label').trim().notEmpty().withMessage('Slot label is required'),
    body('startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid start time required (HH:mm)'),
    body('endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid end time required (HH:mm)'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    validate
  ],
  createSlot
);

router.put('/:id', protect, adminOnly, updateSlot);
router.delete('/:id', protect, adminOnly, deleteSlot);

module.exports = router;
