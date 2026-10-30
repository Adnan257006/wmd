# CanteenFlow: College Canteen Food Demand Management System (MERN)

> A modern MERN-stack web application designed for campus dining to eliminate over-cooking food wastage and reduce long student queue waiting times through smart slot pre-ordering and moving-average demand forecasting.

---

## 📌 Project Overview

College canteens face a persistent dilemma:
1. **Over-cooking**: Leads to substantial food wastage, financial loss, and spoilage.
2. **Under-cooking**: Leaves students stranded hungry during peak rush hours, causing long queues and dissatisfaction.

**CanteenFlow** solves this by providing:
- **For Students**: A seamless web portal to browse the daily menu, configure portion quantities, choose a guaranteed pickup time slot (today or tomorrow), and receive a short pickup token (e.g., `A-102`).
- **For Canteen Management & Chefs**: A live demand dashboard displaying real-time ordered portions per dish, slot occupancy tracking (&gt;80% capacity flags), an automated next-day kitchen preparation forecast (using a 4-week moving average with wastage feedback), and an end-of-day food wastage audit tracker.

---

## 🏗️ System Architecture

```text
 +-------------------------------------------------------------------------+
 |                               CLIENT LAYER                              |
 |   React (Vite) + Tailwind CSS + React Router + Context API + Recharts  |
 +-------------------------------------------------------------------------+
                                      │
                         HTTPS / JSON │ Axios + JWT Bearer
                                      ▼
 +-------------------------------------------------------------------------+
 |                           EXPRESS REST API                              |
 |   - Auth & Role Middleware (protect, adminOnly)                         |
 |   - Request Validation (express-validator)                              |
 |   - Controllers (Auth, Menu, Slot, Order, Dashboard, Wastage)           |
 |   - Demand Forecasting Engine (4-Week Same-Weekday Avg + Wastage Loss)  |
 |   - Token Generation Service (Slot Letter + Sequence Counter)           |
 +-------------------------------------------------------------------------+
                                      │
                           Mongoose   │ Queries & Pipelines
                                      ▼
 +-------------------------------------------------------------------------+
 |                            MONGODB DATABASE                             |
 |   Collections: Users | MenuItems | Slots | Orders | Wastage             |
 +-------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 (Vite) | Fast modern frontend bundling |
| **Routing** | React Router DOM v7 | Dynamic client-side routing & protected route guards |
| **Styling** | Tailwind CSS v3 | Warm food-inspired palette (`#F97316`), responsive card UI |
| **Icons** | Lucide React | Modern, clean UI iconography |
| **Charts** | Recharts | Interactive SVG bar charts and 7-day trend line charts |
| **Backend** | Node.js + Express.js | Layered RESTful API architecture |
| **Database** | MongoDB + Mongoose | Schema validation, compound indexes, aggregation pipelines |
| **Authentication** | JWT + bcryptjs | Stateless authorization with hashed passwords (10 rounds) |
| **Validation** | express-validator | Request sanitization and input validation |

---

## ✨ Features

### 1. Student Features
- **Registration & Authentication**: Secure student sign-up with college roll number.
- **Interactive Menu**:
  - Filter dishes by category (*Breakfast, Lunch, Snacks, Beverages*).
  - Instant live keyword search.
  - Indian dietary indicator (*Veg* green badge / *Non-Veg* red badge).
  - Quantity steppers and live daily-order limit badges.
  - Sold-out state handling.
- **Cart & Slide-out Drawer**: Real-time pricing calculations, quantity updates, and clear summaries.
- **Slot-Based Checkout**:
  - Choose pickup date (**Today** or **Tomorrow**).
  - Visual time slot chips displaying real-time booking capacity (Free = Green, Filling = Amber, Full = Grayed out).
  - Automated blocking of full slots or time slots that have already started today.
- **Unique Order Token**: Instant receipt generation with a short alphanumeric token (e.g., `A-101`, `B-105`) for counter pickup.
- **Order Tracking & Cancellation**:
  - Filter orders by status (*Placed, Preparing, Ready, Collected, Cancelled*).
  - Students can cancel orders while in `Placed` status at least **30 minutes before** the pickup slot commences.

### 2. Canteen Admin Features
- **Demand Operations Dashboard**:
  - **KPI Cards**: Today's total orders, gross pre-order revenue (₹), total portions ordered, and slot congestion status.
  - **Order Pipeline Bar**: Visual breakdown across *Placed, Preparing, Ready, Collected, Cancelled*.
  - **Item Demand Bar Chart**: High-volume dishes ranked by portions ordered and revenue generated.
  - **Slot Occupancy Bar Chart**: Visual comparison of booked orders against slot capacities, flagging intervals &gt;80% as "Busy".
  - **Next-Day Demand Forecasting Table**: Automatic recommendation for tomorrow's preparation quantities per dish.
- **Menu Management**:
  - Create, update, and delete menu items with custom categories, prices, diet type, and daily preparation limits.
  - 1-click availability toggling (*Available* vs *Sold Out*).
- **Time Slot Management**:
  - Add, edit, and deactivate pickup windows with designated order capacity limits.
- **Order Fulfillment Pipeline**:
  - Real-time order queue with instant search by Token Number, Student Name, or Roll Number.
  - Fast status advancement: `Placed` → `Preparing` → `Ready` → `Collected`.
- **End-of-Day Wastage Tracker**:
  - Audit form to record cooked quantities and unsold leftovers at closing.
  - 7-day kitchen wastage trend line chart displaying percentage waste reduction over time.

---

## 📈 Demand Forecasting Algorithm (`forecastService.js`)

To ensure kitchen efficiency without complex black-box models, CanteenFlow uses an explainable formula:

1. **Historical Moving Average**:
   Gathers orders placed for the **same day of the week** over the preceding 4 weeks for each menu item.
   $$\text{Historical Demand} = \text{Average}(\text{Quantities Sold on Same Weekday in Past 4 Weeks})$$
2. **Safety Buffer**:
   Applies a 10% safety buffer to accommodate unexpected walk-in demand:
   $$\text{Baseline Forecast} = \text{round}(\text{Historical Demand} \times 1.10)$$
3. **Wastage Feedback Correction**:
   Computes the average leftover portions recorded in the Wastage logs over the last 7 days:
   $$\text{Suggested Prepare} = \max\left(0, \text{Baseline Forecast} - \text{round}(\text{Avg Leftover} \times 0.5)\right)$$

---

## 🚀 Setup & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017 or a MongoDB Atlas URI

### 1. Clone & Enter Directory
```bash
cd "c:\adnan project"
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

**Server (`server/.env`)**:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/canteenflow
JWT_SECRET=canteenflow_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client (`client/.env`)**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed the Database
Populates the database with default accounts, 16 authentic Indian canteen dishes, 8 pickup slots, and **4 weeks of historical orders & wastage records** to test charts and forecast logic immediately:
```bash
cd server
npm run seed
```

### 5. Start Application

**Start the Backend Server (Port 5000)**:
```bash
cd server
npm run dev
```

**Start the Frontend Client (Port 5173)**:
```bash
cd client
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🔑 Default Credentials (from Seed)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Canteen Admin** | `admin@canteen.com` | `Admin@123` | Full dashboard, menu, slots, orders & wastage access |
| **Student 1** | `student1@college.edu` | `Student@123` | Pre-order, browse menu, track & cancel orders |
| **Student 2** | `student2@college.edu` | `Student@123` | Pre-order, browse menu, track & cancel orders |

*(Note: The login page includes 1-click "Quick Demo Auto-Fill" buttons for instant evaluator testing)*

---

## 📡 REST API Reference

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### Authentication
- `POST /api/auth/register` - Register student (public sign-up only creates `student` role)
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `GET  /api/auth/me` - Retrieve current logged-in user profile

### Menu
- `GET    /api/menu` - List all dishes (filters: `category`, `search`, `available`)
- `GET    /api/menu/:id` - Fetch single dish
- `POST   /api/menu` - Create dish *(Admin)*
- `PUT    /api/menu/:id` - Update dish *(Admin)*
- `DELETE /api/menu/:id` - Remove dish *(Admin)*

### Pickup Slots
- `GET    /api/slots?date=YYYY-MM-DD` - List slots with capacity, booked count, and `isFull`
- `GET    /api/slots/admin` - List all slots configuration *(Admin)*
- `POST   /api/slots` - Create pickup slot *(Admin)*
- `PUT    /api/slots/:id` - Update slot & capacity *(Admin)*
- `DELETE /api/slots/:id` - Remove slot *(Admin)*

### Orders
- `POST   /api/orders` - Place pre-order with slot and validated server prices *(Student)*
- `GET    /api/orders/my` - Fetch authenticated student's orders *(Student)*
- `PUT    /api/orders/:id/cancel` - Cancel order (Allowed only if `Placed` & &gt;30 mins before slot) *(Student)*
- `GET    /api/orders` - Query all orders with filters (`date`, `status`, `slot`) *(Admin)*
- `PUT    /api/orders/:id/status` - Advance order status *(Admin)*

### Dashboard & Analytics *(Admin Only)*
- `GET /api/dashboard/summary?date=YYYY-MM-DD` - Aggregate KPIs & status counts
- `GET /api/dashboard/demand-by-item?date=YYYY-MM-DD` - Portion demand per menu item
- `GET /api/dashboard/demand-by-slot?date=YYYY-MM-DD` - Slot occupancy & busy flags (&gt;80%)
- `GET /api/dashboard/forecast` - Moving average demand prediction for tomorrow

### Food Wastage *(Admin Only)*
- `POST /api/wastage` - Upsert daily prepared & leftover portion audit
- `GET  /api/wastage?days=7` - 7-day wastage trend aggregation

---

## 🧪 Automated Testing

A complete automated API test suite is included in `server/test-api.js`:
```bash
cd server
node test-api.js
```
Runs 17 end-to-end assertions verifying:
1. Health check
2. Student & Admin authentication
3. Menu filtering & search
4. Slot capacity computation
5. Order placement & token generation
6. Order cancellation constraints (&gt;30 min rule)
7. Role-based 403 authorization protection
8. Aggregated demand metrics & AI forecasting calculations
9. 7-Day wastage recording

Alternatively, use `api-tests.http` with the VS Code REST Client extension to execute requests directly against the live server.

---

## 🖼️ Application Screenshots Placeholder

- **Student Menu Page**: Responsive 4-column dish grid with dietary indicators and category filters.
- **Pickup Slot Selection**: Visual chips indicating slot capacity and busy levels.
- **Confirmed Token Screen**: Large bold token number for counter pickup verification.
- **Admin Dashboard**: Live demand metrics, Recharts bar graphs, and tomorrow's forecast guide.
- **Wastage Tracker**: End-of-day audit form with 7-day leftover reduction line chart.

---

## 📄 License

MIT License. Designed and built for academic college mini-project demonstration.
