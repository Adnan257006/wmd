const Order = require('../models/Order');
const Slot = require('../models/Slot');
const { getTomorrowForecast } = require('../services/forecastService');

// Helper to get start and end of day in Date
const getDayRange = (dateStr) => {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay, targetDate };
};

// @desc    Dashboard overview summary (cards)
// @route   GET /api/dashboard/summary?date=YYYY-MM-DD
// @access  Private/Admin
const getDashboardSummary = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay, targetDate } = getDayRange(req.query.date);

    const [statusStats, revenueStats] = await Promise.all([
      // 1. Group counts by status
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // 2. Revenue and total items from non-cancelled orders
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'Cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalItemsOrdered: { $sum: '$items.quantity' }
          }
        }
      ])
    ]);

    const statusCounts = {
      Placed: 0,
      Preparing: 0,
      Ready: 0,
      Collected: 0,
      Cancelled: 0
    };

    let totalOrders = 0;
    statusStats.forEach(stat => {
      if (statusCounts[stat._id] !== undefined) {
        statusCounts[stat._id] = stat.count;
      }
      totalOrders += stat.count;
    });

    const activeOrders = totalOrders - statusCounts.Cancelled;
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const totalItemsOrdered = revenueStats.length > 0 ? revenueStats[0].totalItemsOrdered : 0;

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        totalOrders,
        activeOrders,
        totalRevenue,
        totalItemsOrdered,
        statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demand by item for today (Table + Bar Chart data)
// @route   GET /api/dashboard/demand-by-item?date=YYYY-MM-DD
// @access  Private/Admin
const getDemandByItem = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getDayRange(req.query.date);

    const itemDemand = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: 'Cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'details'
        }
      },
      { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          quantity: 1,
          revenue: 1,
          category: '$details.category',
          price: '$details.price',
          isVeg: '$details.isVeg',
          dailyLimit: '$details.dailyLimit'
        }
      },
      { $sort: { quantity: -1 } }
    ]);

    res.json({
      success: true,
      data: itemDemand
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demand by time slot (Bar chart: orders vs capacity)
// @route   GET /api/dashboard/demand-by-slot?date=YYYY-MM-DD
// @access  Private/Admin
const getDemandBySlot = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getDayRange(req.query.date);

    const [slots, slotOrders] = await Promise.all([
      Slot.find().sort({ startTime: 1 }).lean(),
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: '$slot',
            bookedCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const orderMap = {};
    slotOrders.forEach(so => {
      orderMap[so._id.toString()] = so.bookedCount;
    });

    const data = slots.map(slot => {
      const booked = orderMap[slot._id.toString()] || 0;
      const capacity = slot.capacity || 25;
      const percentFilled = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
      const isBusy = percentFilled >= 80;

      return {
        slotId: slot._id,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
        booked,
        capacity,
        available: Math.max(0, capacity - booked),
        percentFilled,
        isBusy,
        status: isBusy ? 'Busy' : 'Normal'
      };
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tomorrow's forecast
// @route   GET /api/dashboard/forecast
// @access  Private/Admin
const getForecast = async (req, res, next) => {
  try {
    const referenceDate = req.query.date ? new Date(req.query.date) : new Date();
    const forecastData = await getTomorrowForecast(referenceDate);

    res.json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getDemandByItem,
  getDemandBySlot,
  getForecast
};
