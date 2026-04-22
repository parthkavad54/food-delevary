// server.js
import express from "express";
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from './config/passport.js';


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
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'file://',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  'https://food-delevary-sable.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // Allow all in production for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth (Google/Facebook) needs a session for callbacks
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'foody_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: false
  }
}));
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files are served by Vercel directly; serve them using Express only locally
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../../frontend'), { extensions: ['html', 'htm'] }));
}
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery')
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Import Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import restaurantRoutes from './routes/restaurants.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import cartRoutes from './routes/cart.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import restaurantOwnerRoutes from './routes/restaurantOwner.routes.js';



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
import { errorHandler } from './middleware/errorHandler.middleware.js';

// Error Handling Middleware
app.use(errorHandler);

// Export app for Vercel
export default app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  // Create HTTP server and attach Socket.io
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5500',
        'file://',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        'https://food-delevary-sable.vercel.app',
      ],
      credentials: true
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join order updates room for specific order
    socket.on('join-order', (orderId, userId) => {
      const roomName = `order-${orderId}`;
      socket.join(roomName);
      console.log(`User ${userId} joined room: ${roomName}`);
    });

    // Leave order room
    socket.on('leave-order', (orderId) => {
      const roomName = `order-${orderId}`;
      socket.leave(roomName);
      console.log(`User left room: ${roomName}`);
    });

    // Listen for order status updates from backend and broadcast to customer
    socket.on('order-status-update', (data) => {
      const { orderId, newStatus, userId } = data;
      const roomName = `order-${orderId}`;
      
      // Broadcast to all clients in the order room
      io.to(roomName).emit('order-status-changed', {
        orderId,
        newStatus,
        timestamp: new Date()
      });
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Make io accessible to routes
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}