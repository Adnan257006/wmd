const express = require('express');
const { body } = require('express-validator');
const { recordWastage, getWastage } = require('../controllers/wastageController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect, adminOnly);

router.post(
  '/',
  [
    body('date').notEmpty().withMessage('Date is required'),
    body('entries').isArray({ min: 1 }).withMessage('Entries array is required'),
    validate
  ],
  recordWastage
);

router.get('/', getWastage);

module.exports = router;
