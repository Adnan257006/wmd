require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Slot = require('../models/Slot');
const Order = require('../models/Order');
const Wastage = require('../models/Wastage');
const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      MenuItem.deleteMany({}),
      Slot.deleteMany({}),
      Order.deleteMany({}),
      Wastage.deleteMany({})
    ]);

    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const studentPassword = await bcrypt.hash('Student@123', salt);

    const admin = await User.create({
      name: 'Canteen Manager',
      email: 'admin@canteen.com',
      password: adminPassword,
      role: 'admin',
      rollNumber: 'STAFF-01'
    });

    const student1 = await User.create({
      name: 'Adnan Khan',
      email: 'student1@college.edu',
      password: studentPassword,
      role: 'student',
      rollNumber: 'CS-2024-042'
    });

    const student2 = await User.create({
      name: 'Priya Sharma',
      email: 'student2@college.edu',
      password: studentPassword,
      role: 'student',
      rollNumber: 'IT-2024-118'
    });

    const student3 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@college.edu',
      password: studentPassword,
      role: 'student',
      rollNumber: 'ME-2024-075'
    });

    const students = [student1, student2, student3];

    console.log('Seeding Menu Items...');
    const menuItemsData = [
      // Breakfast
      {
        name: 'Poha with Sev',
        description: 'Traditional flattened rice steamed with turmeric, onions, roasted peanuts and fresh coriander.',
        category: 'Breakfast',
        price: 35,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 60
      },
      {
        name: 'Idli Sambar (2 Pcs)',
        description: 'Steamed fluffy rice cakes served with hot vegetable lentil stew and coconut chutney.',
        category: 'Breakfast',
        price: 40,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 70
      },
      {
        name: 'Masala Dosa',
        description: 'Crispy fermented crepe stuffed with spiced potato mash, served with sambar and fresh chutney.',
        category: 'Breakfast',
        price: 60,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 50
      },
      {
        name: 'Chole Bhature',
        description: 'Spicy chickpea curry paired with two large golden puffy deep-fried bhaturas and pickled onions.',
        category: 'Breakfast',
        price: 75,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 45
      },

      // Lunch
      {
        name: 'Special Veg Thali',
        description: 'Complete wholesome meal: 2 Rotis, Paneer Sabzi, Dal Tadka, Jeera Rice, Salad, and Gulab Jamun.',
        category: 'Lunch',
        price: 90,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 100
      },
      {
        name: 'Hyderabadi Chicken Biryani',
        description: 'Fragrant dum cooked basmati rice with tender spiced chicken pieces, served with mint raita and salan.',
        category: 'Lunch',
        price: 130,
        isVeg: false,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 80
      },
      {
        name: 'Paneer Butter Masala Combo',
        description: 'Rich tomato cashew gravy with soft cottage cheese cubes, served with 2 butter naans or jeera rice.',
        category: 'Lunch',
        price: 95,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 60
      },
      {
        name: 'Egg Fried Rice with Manchurian',
        description: 'Wok tossed basmati rice with scrambled eggs and veggies, paired with 3 crispy veg manchurian balls.',
        category: 'Lunch',
        price: 85,
        isVeg: false,
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 50
      },

      // Snacks
      {
        name: 'Punjabi Samosa (2 Pcs)',
        description: 'Crispy golden triangular pastries filled with spicy potato-pea filling, served with tamarind dip.',
        category: 'Snacks',
        price: 30,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 120
      },
      {
        name: 'Mumbai Vada Pav (2 Pcs)',
        description: 'Batata vada sandwiched in soft pav smeared with spicy garlic chutney and fried green chilli.',
        category: 'Snacks',
        price: 35,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 100
      },
      {
        name: 'Pav Bhaji',
        description: 'Spiced thick vegetable mash loaded with butter, served with two butter-toasted pav buns and lemon wedges.',
        category: 'Snacks',
        price: 65,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 70
      },
      {
        name: 'Veg Grilled Cheese Sandwich',
        description: 'Triple layered sandwich with sliced cucumber, tomato, potato, green chutney, and melted cheese.',
        category: 'Snacks',
        price: 55,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 50
      },

      // Beverages
      {
        name: 'Special Masala Chai',
        description: 'Freshly brewed strong milk tea infused with crushed ginger, cardamom, and aromatic spices.',
        category: 'Beverages',
        price: 15,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 200
      },
      {
        name: 'Thick Cold Coffee with Ice Cream',
        description: 'Creamy blended chilled espresso topped with chocolate syrup and a scoop of vanilla ice cream.',
        category: 'Beverages',
        price: 45,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 90
      },
      {
        name: 'Sweet Mango Lassi',
        description: 'Chilled rich yogurt beverage blended with ripe Alphonso mango pulp and a pinch of cardamom.',
        category: 'Beverages',
        price: 40,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 75
      },
      {
        name: 'Fresh Nimbu Pani (Lemonade)',
        description: 'Refreshing sweet and salty lemonade prepared with fresh limes and mint leaves.',
        category: 'Beverages',
        price: 25,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        dailyLimit: 100
      }
    ];

    const menuItems = await MenuItem.insertMany(menuItemsData);
    console.log(`Seeded ${menuItems.length} menu items.`);

    console.log('Seeding Time Slots...');
    const slotsData = [
      // 2 breakfast slots
      { label: '08:30 AM - 09:00 AM', startTime: '08:30', endTime: '09:00', capacity: 25, isActive: true },
      { label: '09:00 AM - 09:30 AM', startTime: '09:00', endTime: '09:30', capacity: 25, isActive: true },
      // 6 lunch slots
      { label: '11:30 AM - 12:00 PM', startTime: '11:30', endTime: '12:00', capacity: 25, isActive: true },
      { label: '12:00 PM - 12:30 PM', startTime: '12:00', endTime: '12:30', capacity: 25, isActive: true },
      { label: '12:30 PM - 01:00 PM', startTime: '12:30', endTime: '13:00', capacity: 25, isActive: true },
      { label: '01:00 PM - 01:30 PM', startTime: '13:00', endTime: '13:30', capacity: 25, isActive: true },
      { label: '01:30 PM - 02:00 PM', startTime: '13:30', endTime: '14:00', capacity: 25, isActive: true },
      { label: '02:00 PM - 02:30 PM', startTime: '14:00', endTime: '14:30', capacity: 25, isActive: true }
    ];

    const slots = await Slot.insertMany(slotsData);
    console.log(`Seeded ${slots.length} time slots.`);

    console.log('Seeding 4 weeks of historical orders & wastage...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const historicalOrders = [];
    const historicalWastage = [];

    // Helper random integer
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Slot group letters: A, B, C, D, E, F, G, H
    const slotLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // Generate for the past 28 days down to day 0 (today)
    for (let dayOffset = 28; dayOffset >= 0; dayOffset--) {
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - dayOffset);

      // Track item prepared & sold for this day to generate realistic wastage
      const dailyItemPrepared = {};
      const dailyItemOrdered = {};
      menuItems.forEach(item => {
        dailyItemPrepared[item._id.toString()] = randInt(25, 65);
        dailyItemOrdered[item._id.toString()] = 0;
      });

      // Number of orders for this day (10 to 30 orders)
      const isCurrentDay = dayOffset === 0;
      const orderCountForDay = isCurrentDay ? 18 : randInt(14, 28);

      for (let orderIndex = 0; orderIndex < orderCountForDay; orderIndex++) {
        const student = students[orderIndex % students.length];
        const slotIdx = orderIndex % slots.length;
        const slot = slots[slotIdx];
        const slotLetter = slotLetters[slotIdx % slotLetters.length];
        const tokenNumber = `${slotLetter}-${101 + orderIndex}`;

        // Select 1 to 3 random items
        const numItems = randInt(1, 3);
        const selectedItems = [];
        let totalAmount = 0;

        for (let i = 0; i < numItems; i++) {
          const item = menuItems[(orderIndex * 2 + i) % menuItems.length];
          const qty = randInt(1, 2);
          selectedItems.push({
            menuItem: item._id,
            name: item.name,
            price: item.price,
            quantity: qty
          });
          totalAmount += item.price * qty;
          dailyItemOrdered[item._id.toString()] += qty;
        }

        // Determine status
        let status = 'Collected';
        if (isCurrentDay) {
          // Today's orders spread across statuses for realistic dashboard demo
          const statusPool = ['Placed', 'Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'];
          status = statusPool[orderIndex % statusPool.length];
        } else {
          // Historical orders mostly Collected, a few Cancelled
          status = Math.random() < 0.08 ? 'Cancelled' : 'Collected';
        }

        historicalOrders.push({
          user: student._id,
          items: selectedItems,
          slot: slot._id,
          orderDate,
          totalAmount,
          status,
          tokenNumber,
          createdAt: new Date(orderDate.getTime() + (orderIndex * 15 * 60 * 1000))
        });
      }

      // Generate wastage record for past days (and also yesterday/today)
      if (dayOffset > 0) {
        menuItems.forEach(item => {
          const prepared = dailyItemPrepared[item._id.toString()];
          const ordered = dailyItemOrdered[item._id.toString()];
          const leftover = Math.max(0, prepared - ordered);

          historicalWastage.push({
            date: orderDate,
            menuItem: item._id,
            prepared,
            leftover,
            createdAt: orderDate
          });
        });
      }
    }

    // Insert historical orders in chunks or bulk
    await Order.insertMany(historicalOrders);
    console.log(`Seeded ${historicalOrders.length} historical and today's orders.`);

    await Wastage.insertMany(historicalWastage);
    console.log(`Seeded ${historicalWastage.length} wastage records across 28 days.`);

    console.log('\n======================================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('------------------------------------------------------');
    console.log('👤 Admin Account:');
    console.log('   Email:    admin@canteen.com');
    console.log('   Password: Admin@123');
    console.log('👤 Student Accounts:');
    console.log('   Email:    student1@college.edu | Password: Student@123');
    console.log('   Email:    student2@college.edu | Password: Student@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
