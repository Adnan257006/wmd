const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Wastage = require('../models/Wastage');

/**
 * Calculates demand forecast and suggested preparation quantities for tomorrow.
 */
const getTomorrowForecast = async (referenceDate = new Date()) => {
  // Determine target date (tomorrow by default)
  const targetDate = new Date(referenceDate);
  targetDate.setDate(targetDate.getDate() + 1);
  targetDate.setHours(0, 0, 0, 0);

  const targetDayOfWeek = targetDate.getDay();

  // Find the exact dates for the same weekday over the past 4 weeks
  const pastWeekdayDates = [];
  for (let w = 1; w <= 4; w++) {
    const pastDate = new Date(targetDate);
    pastDate.setDate(targetDate.getDate() - w * 7);
    pastDate.setHours(0, 0, 0, 0);
    pastWeekdayDates.push(pastDate);
  }

  // 7 days ago cutoff for fallback and wastage
  const sevenDaysAgo = new Date(referenceDate);
  sevenDaysAgo.setDate(referenceDate.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const allItems = await MenuItem.find({ isAvailable: true }).lean();

  const results = [];

  for (const item of allItems) {
    const itemIdStr = item._id.toString();

    // 1. Gather sales on the same weekday over the past 4 weeks
    const pastWeekdayOrders = await Order.aggregate([
      {
        $match: {
          orderDate: { $in: pastWeekdayDates },
          status: { $ne: 'Cancelled' },
          'items.menuItem': item._id
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.menuItem': item._id
        }
      },
      {
        $group: {
          _id: '$orderDate',
          dailyTotal: { $sum: '$items.quantity' }
        }
      }
    ]);

    let forecast = 0;

    if (pastWeekdayOrders.length > 0) {
      // Average across the available weekday historical points (up to 4)
      const totalSold = pastWeekdayOrders.reduce((sum, doc) => sum + doc.dailyTotal, 0);
      const avgSold = totalSold / 4; // divided by 4 weeks baseline
      forecast = Math.round(avgSold * 1.10); // 10% safety buffer
    } else {
      // Fallback: Overall daily average of the last 7 days
      const last7DaysOrders = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: sevenDaysAgo, $lte: referenceDate },
            status: { $ne: 'Cancelled' },
            'items.menuItem': item._id
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.menuItem': item._id
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$items.quantity' }
          }
        }
      ]);

      if (last7DaysOrders.length > 0 && last7DaysOrders[0].totalQuantity > 0) {
        const fallbackAvg = last7DaysOrders[0].totalQuantity / 7;
        forecast = Math.round(fallbackAvg * 1.10);
      } else {
        forecast = 0;
      }
    }

    // 2. Average leftover from Wastage collection over the last 7 days
    const wastageRecords = await Wastage.find({
      menuItem: item._id,
      date: { $gte: sevenDaysAgo, $lte: referenceDate }
    }).lean();

    let avgLeftover = 0;
    if (wastageRecords.length > 0) {
      const totalLeftover = wastageRecords.reduce((sum, w) => sum + (w.leftover || 0), 0);
      avgLeftover = Math.round((totalLeftover / wastageRecords.length) * 10) / 10;
    }

    // 3. Suggested prepare: max(0, forecast - round(avgLeftover * 0.5))
    const suggestedPrepare = Math.max(0, forecast - Math.round(avgLeftover * 0.5));

    results.push({
      itemId: item._id,
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl,
      forecast,
      avgLeftover,
      suggestedPrepare
    });
  }

  return results;
};

module.exports = { getTomorrowForecast };
