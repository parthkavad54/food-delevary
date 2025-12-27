# Food Delivery App - Setup Guide

This guide will help you connect your frontend and backend using Node.js.

## 🏗️ Project Structure

```
food-delivery/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controller/      # API controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── index.js         # Main server file
│   └── package.json
├── frontend/                # HTML/CSS/JS frontend
│   ├── assets/
│   │   ├── script.js        # Main frontend logic
│   │   ├── api.js           # API service layer
│   │   └── styles.css       # Styling
│   └── *.html               # HTML pages
├── start-server.js         # Server startup script
├── test-connection.js       # Connection test script
└── package.json             # Root package.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Start the Application

```bash
# Start both frontend and backend
npm start
```

This will:
- Start the backend server on `http://localhost:5000`
- Serve the frontend files from the backend
- Enable CORS for frontend-backend communication

### 3. Access Your Application

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 🔧 Manual Setup (Alternative)

If you prefer to run components separately:

### Backend Only
```bash
cd backend
npm run dev
```

### Frontend Only
Open `frontend/index.html` in your browser or use a local server.

## 🧪 Testing the Connection

Run the connection test to verify everything is working:

```bash
node test-connection.js
```

This will test:
- Backend server health
- API endpoint availability
- CORS configuration

## 📡 API Integration

The frontend now includes an API service (`assets/api.js`) that provides:

### Authentication
- `loginUser(email, password)` - User login
- `registerUser(userData)` - User registration
- `logoutUser()` - User logout

### Restaurants
- `getRestaurants(filters)` - Get restaurant list
- `getRestaurant(id)` - Get specific restaurant

### Menu & Cart
- `getMenuItems(restaurantId)` - Get menu items
- `addToCart(itemData)` - Add item to cart
- `getCart()` - Get user's cart
- `updateCartItem(itemId, quantity)` - Update cart item

### Orders
- `createOrder(orderData)` - Create new order
- `getOrders()` - Get user's orders
- `getOrder(id)` - Get specific order

### Reviews
- `getReviews(restaurantId)` - Get restaurant reviews
- `createReview(reviewData)` - Create new review

## 🔄 How It Works

1. **Backend Server**: Express.js server running on port 5000
2. **CORS Configuration**: Allows frontend to make API calls
3. **Static File Serving**: Backend serves frontend files
4. **API Service**: JavaScript class handles all API communication
5. **Local Storage**: Cart and user data stored locally
6. **Backend Sync**: Cart syncs with backend when user is logged in

## 🛠️ Configuration

### Backend Configuration
- **Port**: 5000 (configurable via `PORT` environment variable)
- **Database**: MongoDB (configurable via `MONGODB_URI`)
- **CORS**: Configured for localhost development

### Frontend Configuration
- **API Base URL**: `http://localhost:5000/api`
- **Token Storage**: localStorage for authentication
- **Cart Storage**: localStorage with backend sync

## 🐛 Troubleshooting

### Backend Issues
1. **Port already in use**: Change port in `backend/src/index.js`
2. **MongoDB connection**: Ensure MongoDB is running
3. **Dependencies**: Run `npm install` in backend folder

### Frontend Issues
1. **CORS errors**: Check CORS configuration in backend
2. **API calls failing**: Verify backend is running
3. **Authentication**: Check token storage in localStorage

### Common Solutions
```bash
# Kill process on port 5000
npx kill-port 5000

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check MongoDB connection
mongosh
```

## 📝 Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food_delivery
JWT_SECRET=your_jwt_secret_here
```

## 🎯 Next Steps

1. **Database Setup**: Ensure MongoDB is running
2. **API Testing**: Use the test script to verify endpoints
3. **Frontend Testing**: Open the app and test functionality
4. **Authentication**: Test login/register functionality
5. **Cart Sync**: Test cart synchronization with backend

## 📚 API Documentation

The backend provides these main endpoints:

- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/restaurants` - Get restaurants
- `GET /api/menu` - Get menu items
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order

## ✨ Features

- **Full-stack Integration**: Frontend and backend connected
- **Authentication**: User login/register with JWT
- **Cart Management**: Local storage with backend sync
- **API Service**: Clean JavaScript API layer
- **CORS Support**: Cross-origin requests enabled
- **Error Handling**: Comprehensive error management
- **Health Monitoring**: Server health checks

Your food delivery app is now fully connected and ready to use! 🎉


