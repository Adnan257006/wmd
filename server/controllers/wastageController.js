const Wastage = require('../models/Wastage');
const MenuItem = require('../models/MenuItem');

// Helper to normalize date
const normalizeDate = (d) => {
  const date = d ? new Date(d) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// @desc    Upsert wastage entries for a specific date
// @route   POST /api/wastage
// @access  Private/Admin
const recordWastage = async (req, res, next) => {
  try {
    const { date, entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Wastage entries array is required' });
    }

    const targetDate = normalizeDate(date);

    const upsertPromises = entries.map(entry => {
      const prepared = Math.max(0, parseInt(entry.prepared, 10) || 0);
      const leftover = Math.max(0, parseInt(entry.leftover, 10) || 0);

      return Wastage.findOneAndUpdate(
        { date: targetDate, menuItem: entry.menuItem },
        {
          date: targetDate,
          menuItem: entry.menuItem,
          prepared,
          leftover
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    const savedEntries = await Promise.all(upsertPromises);

    res.status(200).json({
      success: true,
      message: `Recorded wastage for ${savedEntries.length} items`,
      data: savedEntries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wastage records and trend for the last N days
// @route   GET /api/wastage?days=7
// @access  Private/Admin
const getWastage = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(targetDate);
    startDate.setDate(targetDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // 1. Grouped by date for 7-day trend chart
    const trend = await Wastage.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalPrepared: { $sum: '$prepared' },
          totalLeftover: { $sum: '$leftover' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalPrepared: 1,
          totalLeftover: 1,
          wastagePercent: {
            $cond: [
              { $gt: ['$totalPrepared', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalLeftover', '$totalPrepared'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // 2. Fetch specific entries if date is queried, populated with item details
    const specificDate = req.query.date ? normalizeDate(req.query.date) : normalizeDate(new Date());
    const dayEntries = await Wastage.find({ date: specificDate })
      .populate('menuItem', 'name category price isVeg')
      .lean();

    res.json({
      success: true,
      days,
      trend,
      dayEntries
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordWastage,
  getWastage
};
