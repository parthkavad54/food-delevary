// server.js
import express from "express";
import mongoose from 'mongoose';

import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

const app = express();

app.enable("trust proxy");

// app.use((req, res, next) => {
//   if (req.headers["x-forwarded-proto"] !== "https") {
//     return res.redirect("https://" + req.headers.host + req.url);
//   }
//   next();
// });


// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'file://'],
  // process.env.CORS_ORIGIN,
  // [
  //   "https://food-delevary-2.onrender.com",
  //   "http://localhost:3000"
  //  ],
  
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static('../frontend'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Import Routes
import authRoutes from '../src/routes/auth.routes.js';
import userRoutes from '../src/routes/users.routes.js';
import restaurantRoutes from '../src/routes/restaurants.routes.js';
import menuRoutes from '../src/routes/menu.routes.js';
import orderRoutes from '../src/routes/order.routes.js';
import cartRoutes from '../src/routes/cart.routes.js';
import reviewRoutes from '../src/routes/reviews.routes.js';
import paymentRoutes from '../src/routes/payment.routes.js';
import adminRoutes from '../src/routes/admin.routes.js';
import restaurantOwnerRoutes from '../src/routes/restaurantOwner.routes.js';



// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurant-owner', restaurantOwnerRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Import Error Handler
import { errorHandler } from'./middleware/errorHandler.middleware.js';

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});