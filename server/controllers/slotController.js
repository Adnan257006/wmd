const Slot = require('../models/Slot');
const Order = require('../models/Order');

// @desc    Get all slots with booked count and full status for a specific date
// @route   GET /api/slots?date=YYYY-MM-DD
// @access  Public
const getSlots = async (req, res, next) => {
  try {
    const { date } = req.query;

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date);
    }
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await Slot.find({ isActive: true }).sort({ startTime: 1 }).lean();

    // Check if targetDate is today for time check
    const now = new Date();
    const isToday =
      now.getFullYear() === targetDate.getFullYear() &&
      now.getMonth() === targetDate.getMonth() &&
      now.getDate() === targetDate.getDate();

    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;

    // Get order counts grouped by slot for this date (excluding cancelled)
    const bookings = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: '$slot',
          count: { $sum: 1 }
        }
      }
    ]);

    const bookingMap = {};
    bookings.forEach(b => {
      bookingMap[b._id.toString()] = b.count;
    });

    const enrichedSlots = slots.map(slot => {
      const booked = bookingMap[slot._id.toString()] || 0;
      const isFull = booked >= slot.capacity;
      const isPast = isToday && slot.startTime < currentTimeStr;

      return {
        ...slot,
        booked,
        available: Math.max(0, slot.capacity - booked),
        isFull,
        isPast,
        canBook: !isFull && !isPast
      };
    });

    res.json({
      success: true,
      data: enrichedSlots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all slots (raw, for admin management)
// @route   GET /api/slots/admin
// @access  Private/Admin
const getAllSlotsAdmin = async (req, res, next) => {
  try {
    const slots = await Slot.find().sort({ startTime: 1 });
    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new time slot
// @route   POST /api/slots
// @access  Private/Admin
const createSlot = async (req, res, next) => {
  try {
    const { label, startTime, endTime, capacity, isActive } = req.body;

    const newSlot = await Slot.create({
      label,
      startTime,
      endTime,
      capacity: capacity ? Number(capacity) : 25,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: newSlot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a time slot
// @route   PUT /api/slots/:id
// @access  Private/Admin
const updateSlot = async (req, res, next) => {
  try {
    const { label, startTime, endTime, capacity, isActive } = req.body;

    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Time slot not found' });
    }

    if (label !== undefined) slot.label = label;
    if (startTime !== undefined) slot.startTime = startTime;
    if (endTime !== undefined) slot.endTime = endTime;
    if (capacity !== undefined) slot.capacity = Number(capacity);
    if (isActive !== undefined) slot.isActive = Boolean(isActive);

    await slot.save();

    res.json({
      success: true,
      message: 'Time slot updated successfully',
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a time slot
// @route   DELETE /api/slots/:id
// @access  Private/Admin
const deleteSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Time slot not found' });
    }

    await slot.deleteOne();

    res.json({
      success: true,
      message: 'Time slot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSlots,
  getAllSlotsAdmin,
  createSlot,
  updateSlot,
  deleteSlot
};
