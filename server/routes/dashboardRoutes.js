const express = require('express');
const {
  getDashboardSummary,
  getDemandByItem,
  getDemandBySlot,
  getForecast
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

const router = express.Router();

// All dashboard endpoints require admin authentication
router.use(protect, adminOnly);

router.get('/summary', getDashboardSummary);
router.get('/demand-by-item', getDemandByItem);
router.get('/demand-by-slot', getDemandBySlot);
router.get('/forecast', getForecast);

module.exports = router;
