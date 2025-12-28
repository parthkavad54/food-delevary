// Script to create a restaurant owner user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const createRestaurantOwner = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');

    // Default restaurant owner credentials
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@restaurant.com';
    const ownerPassword = process.env.OWNER_PASSWORD || 'owner123';
    const ownerName = process.env.OWNER_NAME || 'Restaurant Owner';
    const ownerPhone = process.env.OWNER_PHONE || '9876543210';

    // Check if owner already exists
    const existingOwner = await User.findOne({ email: ownerEmail });
    if (existingOwner) {
      console.log('Restaurant owner user already exists!');
      console.log(`Email: ${ownerEmail}`);
      console.log('You can change the password through the restaurant panel or update the user role.');
      await mongoose.connection.close();
      return;
    }

    // Create restaurant owner user
    const owner = new User({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      phone: ownerPhone,
      role: 'restaurant_owner',
      isActive: true,
      isVerified: true
    });

    await owner.save();
    console.log('✅ Restaurant owner user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Restaurant Owner Login Credentials:');
    console.log(`Email: ${ownerEmail}`);
    console.log(`Password: ${ownerPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change the password after first login!');
    console.log('\n📝 Next Steps:');
    console.log('1. Login with these credentials');
    console.log('2. Go to Restaurant Dashboard');
    console.log('3. Create your first restaurant');
    console.log('4. Add menu items to your restaurant');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating restaurant owner user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createRestaurantOwner();

