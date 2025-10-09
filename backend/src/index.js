// server.js
import express from "express";
import mongoose from 'mongoose';

import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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



// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);

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