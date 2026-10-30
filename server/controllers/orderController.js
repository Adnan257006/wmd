const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Slot = require('../models/Slot');
const { generateTokenNumber } = require('../services/tokenService');

// Helper to normalize date to midnight
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// @desc    Place a new food order
// @route   POST /api/orders
// @access  Private/Student
const createOrder = async (req, res, next) => {
  try {
    const { items, slot: slotId, orderDate: requestedDate } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one item' });
    }

    if (!slotId) {
      return res.status(400).json({ success: false, message: 'Please select a pickup time slot' });
    }

    // 1. Verify Slot exists and is active
    const slot = await Slot.findById(slotId);
    if (!slot || !slot.isActive) {
      return res.status(400).json({ success: false, message: 'Selected time slot is invalid or inactive' });
    }

    // 2. Validate Order Date (Only Today or Tomorrow allowed)
    const now = new Date();
    const today = normalizeDate(now);
    const tomorrow = normalizeDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    const targetDate = requestedDate ? normalizeDate(requestedDate) : today;

    const isToday = targetDate.getTime() === today.getTime();
    const isTomorrow = targetDate.getTime() === tomorrow.getTime();

    if (!isToday && !isTomorrow) {
      return res.status(400).json({
        success: false,
        message: 'Orders can only be placed for today or tomorrow'
      });
    }

    // 3. If today, ensure slot start time has not passed
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;

    if (isToday && slot.startTime <= currentTimeStr) {
      return res.status(400).json({
        success: false,
        message: `Slot '${slot.label}' has already started or passed for today`
      });
    }

    // 4. Check Slot Capacity
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const activeSlotOrdersCount = await Order.countDocuments({
      orderDate: { $gte: startOfDay, $lte: endOfDay },
      slot: slot._id,
      status: { $ne: 'Cancelled' }
    });

    if (activeSlotOrdersCount >= slot.capacity) {
      return res.status(400).json({
        success: false,
        message: `Time slot '${slot.label}' is already at full capacity (${slot.capacity} orders)`
      });
    }

    // 5. Validate items, fetch prices directly from DB, and check daily limits
    const orderItems = [];
    let calculatedTotal = 0;

    for (const orderItem of items) {
      const dbItem = await MenuItem.findById(orderItem.menuItem);
      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item with id ${orderItem.menuItem} was not found`
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `'${dbItem.name}' is currently unavailable`
        });
      }

      const qty = parseInt(orderItem.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for '${dbItem.name}'`
        });
      }

      // Check dailyLimit if set
      if (dbItem.dailyLimit !== null && dbItem.dailyLimit !== undefined) {
        const itemSales = await Order.aggregate([
          {
            $match: {
              orderDate: { $gte: startOfDay, $lte: endOfDay },
              status: { $ne: 'Cancelled' },
              'items.menuItem': dbItem._id
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              'items.menuItem': dbItem._id
            }
          },
          {
            $group: {
              _id: null,
              totalOrdered: { $sum: '$items.quantity' }
            }
          }
        ]);

        const currentOrderedQty = itemSales.length > 0 ? itemSales[0].totalOrdered : 0;
        if (currentOrderedQty + qty > dbItem.dailyLimit) {
          const remaining = Math.max(0, dbItem.dailyLimit - currentOrderedQty);
          return res.status(400).json({
            success: false,
            message: `'${dbItem.name}' daily order limit reached. Only ${remaining} portions remaining for this date.`
          });
        }
      }

      orderItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty
      });

      calculatedTotal += dbItem.price * qty;
    }

    // 6. Generate Unique Token Number
    const tokenNumber = await generateTokenNumber(slot._id, targetDate);

    // 7. Create Order
    const newOrder = await Order.create({
      user: req.user._id,
      items: orderItems,
      slot: slot._id,
      orderDate: targetDate,
      totalAmount: calculatedTotal,
      status: 'Placed',
      tokenNumber
    });

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('slot', 'label startTime endTime')
      .populate('user', 'name email rollNumber');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in student's orders
// @route   GET /api/orders/my
// @access  Private/Student
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('slot', 'label startTime endTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (Student only, condition: Placed & > 30 mins before slot)
// @route   PUT /api/orders/:id/cancel
// @access  Private/Student
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('slot');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Must be in 'Placed' status
    if (order.status !== 'Placed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${order.status}' status. Only 'Placed' orders can be cancelled.`
      });
    }

    // Cancellation is allowed only at least 30 mins before slot start time
    if (order.slot && order.slot.startTime) {
      const [slotHours, slotMinutes] = order.slot.startTime.split(':').map(Number);
      const slotDateTime = new Date(order.orderDate);
      slotDateTime.setHours(slotHours, slotMinutes, 0, 0);

      const diffMs = slotDateTime.getTime() - Date.now();
      const thirtyMinutesMs = 30 * 60 * 1000;

      if (diffMs < thirtyMinutesMs) {
        return res.status(400).json({
          success: false,
          message: 'Orders can only be cancelled at least 30 minutes before the pickup time slot starts'
        });
      }
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin only, filters: date, status, slot)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { date, status, slot } = req.query;

    const query = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.orderDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (slot && slot !== 'All') {
      query.slot = slot;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email rollNumber')
      .populate('slot', 'label startTime endTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status along: Placed -> Preparing -> Ready -> Collected (or Cancelled)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('slot', 'label startTime endTime')
      .populate('user', 'name email rollNumber');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: `Order status updated to '${status}'`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
};
