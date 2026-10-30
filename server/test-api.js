const http = require('http');
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const makeRequest = (port, options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...options, port, host: '127.0.0.1' }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  await connectDB();
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    let passed = 0;
    let failed = 0;

    const assert = (condition, desc) => {
      if (condition) {
        console.log(`  ✅ PASS: ${desc}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${desc}`);
        failed++;
      }
    };

    console.log('\n--- 1. Health Check ---');
    const health = await makeRequest(port, { path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.data.status === 'ok', 'Health endpoint returns 200 ok');

    console.log('\n--- 2. Auth Tests ---');
    // Login Student
    const studentLogin = await makeRequest(port, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'student1@college.edu', password: 'Student@123' });
    assert(studentLogin.status === 200 && studentLogin.data.token, 'Student login successful');
    const studentToken = studentLogin.data.token;

    // Login Admin
    const adminLogin = await makeRequest(port, {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@canteen.com', password: 'Admin@123' });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login successful');
    const adminToken = adminLogin.data.token;

    // Register new student
    const testEmail = `newstudent_${Date.now()}@college.edu`;
    const regRes = await makeRequest(port, {
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Test Student', email: testEmail, password: 'Password123', rollNumber: 'TEST-01' });
    assert(regRes.status === 201 && regRes.data.user.role === 'student', 'New student registered with student role');

    console.log('\n--- 3. Menu Tests ---');
    const menuRes = await makeRequest(port, { path: '/api/menu', method: 'GET' });
    assert(menuRes.status === 200 && menuRes.data.data.length >= 15, 'Menu list returns all items');
    const sampleItem = menuRes.data.data[0];

    // Filter menu by category
    const filterRes = await makeRequest(port, { path: '/api/menu?category=Lunch', method: 'GET' });
    assert(filterRes.status === 200 && filterRes.data.data.every(i => i.category === 'Lunch'), 'Category filter works');

    console.log('\n--- 4. Slots Tests ---');
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const slotsRes = await makeRequest(port, { path: `/api/slots?date=${tomorrowStr}`, method: 'GET' });
    assert(slotsRes.status === 200 && slotsRes.data.data.length >= 6, 'Slots retrieved with capacity data');
    const targetSlot = slotsRes.data.data[0];

    console.log('\n--- 5. Order Flow & Business Rules ---');
    // Place order for tomorrow
    const orderRes = await makeRequest(port, {
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, {
      items: [{ menuItem: sampleItem._id, quantity: 2 }],
      slot: targetSlot._id,
      orderDate: tomorrowStr
    });
    assert(orderRes.status === 201 && orderRes.data.data.tokenNumber, `Order placed with token ${orderRes.data?.data?.tokenNumber}`);
    const placedOrder = orderRes.data.data;

    // View My Orders
    const myOrdersRes = await makeRequest(port, {
      path: '/api/orders/my',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(myOrdersRes.status === 200 && myOrdersRes.data.data.length > 0, 'Student can retrieve own orders');

    // Cancellation check: placed order for tomorrow can be cancelled (> 30 mins before)
    const cancelRes = await makeRequest(port, {
      path: `/api/orders/${placedOrder._id}/cancel`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(cancelRes.status === 200 && cancelRes.data.data.status === 'Cancelled', 'Student cancelled placed order ahead of time');

    console.log('\n--- 6. Role Protection Tests ---');
    // Student trying to access admin dashboard
    const forbiddenRes = await makeRequest(port, {
      path: '/api/dashboard/summary',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(forbiddenRes.status === 403, 'Student blocked from admin dashboard (403 Forbidden)');

    console.log('\n--- 7. Admin Dashboard & Forecast Tests ---');
    const dashSummary = await makeRequest(port, {
      path: '/api/dashboard/summary',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(dashSummary.status === 200 && dashSummary.data.data.totalOrders >= 0, 'Dashboard summary returns valid counts');

    const demandByItem = await makeRequest(port, {
      path: '/api/dashboard/demand-by-item',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(demandByItem.status === 200 && Array.isArray(demandByItem.data.data), 'Demand by item returns aggregated array');

    const demandBySlot = await makeRequest(port, {
      path: '/api/dashboard/demand-by-slot',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(demandBySlot.status === 200 && Array.isArray(demandBySlot.data.data), 'Demand by slot returns capacity and busy flags');

    const forecastRes = await makeRequest(port, {
      path: '/api/dashboard/forecast',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(forecastRes.status === 200 && forecastRes.data.data.length > 0, 'Forecast endpoint calculates tomorrow demand');
    console.log(`    Sample forecast item: ${forecastRes.data.data[0].name} -> Forecast: ${forecastRes.data.data[0].forecast}, Suggested: ${forecastRes.data.data[0].suggestedPrepare}`);

    console.log('\n--- 8. Wastage Tracking ---');
    const recordWastageRes = await makeRequest(port, {
      path: '/api/wastage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      date: new Date().toISOString().split('T')[0],
      entries: [
        { menuItem: sampleItem._id, prepared: 30, leftover: 3 }
      ]
    });
    assert(recordWastageRes.status === 200, 'Wastage entry recorded');

    const getWastageRes = await makeRequest(port, {
      path: '/api/wastage?days=7',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(getWastageRes.status === 200 && getWastageRes.data.trend.length > 0, '7-day wastage trend retrieved');

    console.log(`\n========================================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test suite failed:', err);
    server.close();
    process.exit(1);
  }
};

runTests();
