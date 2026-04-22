import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') }); // in case it's in parent

// Need to define the user schema manually here or import it
import User from '../models/user.model.js';

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri);
    console.log('MongoDB Connected');

    const mockUsers = [];
    const plainTextPasswords = {};

    // Generate 10 customers
    for (let i = 1; i <= 10; i++) {
      mockUsers.push({
        name: `Customer User ${i}`,
        email: `customer${i}@foody.com`,
        password: `customer${i}pass`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        role: 'customer',
        isActive: true,
        isVerified: true
      });
    }

    // Generate 5 restaurant owners
    for (let i = 1; i <= 5; i++) {
      mockUsers.push({
        name: `Restaurant Owner ${i}`,
        email: `owner${i}@foody.com`,
        password: `owner${i}pass`,
        phone: `87654321${i.toString().padStart(2, '0')}`,
        role: 'restaurant_owner',
        isActive: true,
        isVerified: true
      });
    }

    // Generate 5 delivery partners
    for (let i = 1; i <= 5; i++) {
      mockUsers.push({
        name: `Delivery Partner ${i}`,
        email: `delivery${i}@foody.com`,
        password: `delivery${i}pass`,
        phone: `76543210${i.toString().padStart(2, '0')}`,
        role: 'delivery_person',
        isActive: true,
        isVerified: true
      });
    }

    let report = 'FOODY MOCK USERS CREDENTIALS\n';
    report += '=================================\n\n';

    console.log(`Creating ${mockUsers.length} users...`);
    
    // Process one by one
    for (const u of mockUsers) {
      // Check if user exists
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User(u);
        await user.save();
        console.log(`Created: ${u.email}`);
      } else {
        console.log(`Skipped (already exists): ${u.email}`);
      }
      
      report += `Role: ${u.role}\n`;
      report += `Name: ${u.name}\n`;
      report += `Email: ${u.email}\n`;
      report += `Password: ${u.password}\n`;
      report += `---------------------------------\n`;
    }

    // Write to a file in the root
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootPath = path.resolve(__dirname, '../../../../');
    const filePath = path.join(rootPath, 'mock-users-credentials.txt');
    
    fs.writeFileSync(filePath, report);
    console.log(`\nCredentials saved to ${filePath}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
