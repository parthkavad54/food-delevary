import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';
import MenuItem from '../models/menuItem.model.js';

const menuTemplates = [
  { name: 'Margherita Pizza', description: 'Classic cheese and tomato pizza', price: 299, category: 'Pizza', imageUrl: './public/images/pizza.jpg' },
  { name: 'Pepperoni Pizza', description: 'Spicy pepperoni with mozzarella', price: 349, category: 'Pizza', imageUrl: './public/images/pizza.jpg' },
  { name: 'Veggie Supreme Pizza', description: 'Loaded with fresh vegetables', price: 319, category: 'Pizza', imageUrl: './public/images/pizza.jpg' },
  
  { name: 'Grilled Cheese Sandwich', description: 'Toasted bread with melted cheddar', price: 120, category: 'Sandwich', imageUrl: './public/images/sandwich.jpg' },
  { name: 'Club Sandwich', description: 'Triple decker with chicken and egg', price: 180, category: 'Sandwich', imageUrl: './public/images/sandwich.jpg' },
  { name: 'Paneer Tikka Sandwich', description: 'Spicy paneer filling', price: 150, category: 'Sandwich', imageUrl: './public/images/sandwich.jpg' },
  
  { name: 'Classic Veg Burger', description: 'Crispy potato patty with fresh veggies', price: 110, category: 'Burger', imageUrl: './public/images/burger.jpg' },
  { name: 'Double Cheese Burger', description: 'Extra cheese with juicy patty', price: 160, category: 'Burger', imageUrl: './public/images/burger.jpg' },
  { name: 'Spicy Chicken Burger', description: 'Crispy fried chicken with spicy mayo', price: 190, category: 'Burger', imageUrl: './public/images/burger.jpg' },
  
  { name: 'Gujarati Thali', description: 'Authentic complete meal with dal, shaak, roti, rice', price: 250, category: 'Gujarati', imageUrl: './public/images/curry.jpg' },
  { name: 'Dhokla', description: 'Steamed gram flour snack', price: 80, category: 'Gujarati', imageUrl: './public/images/curry.jpg' },
  { name: 'Undhiyu', description: 'Mixed vegetable dish', price: 180, category: 'Gujarati', imageUrl: './public/images/curry.jpg' },
  
  { name: 'Paneer Butter Masala', description: 'Rich tomato gravy with paneer cubes', price: 220, category: 'Punjabi', imageUrl: './public/images/curry.jpg' },
  { name: 'Chole Bhature', description: 'Spicy chickpeas with fried bread', price: 150, category: 'Punjabi', imageUrl: './public/images/curry.jpg' },
  { name: 'Dal Makhani', description: 'Creamy black lentils', price: 190, category: 'Punjabi', imageUrl: './public/images/curry.jpg' },
  
  { name: 'Masala Dosa', description: 'Crispy crepe with potato filling', price: 120, category: 'Indian', imageUrl: './public/images/curry.jpg' },
  { name: 'Biryani', description: 'Aromatic rice cooked with spices', price: 280, category: 'Indian', imageUrl: './public/images/curry.jpg' },
  { name: 'Samosa', description: 'Fried pastry with savory filling', price: 40, category: 'Indian', imageUrl: './public/images/curry.jpg' }
];

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri);
    console.log('MongoDB Connected');

    // Get all restaurant owners
    const owners = await User.find({ role: 'restaurant_owner' });
    console.log(`Found ${owners.length} restaurant owners.`);

    let restaurantCount = 0;
    let menuCount = 0;

    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      
      // Check if they have a restaurant
      let restaurant = await Restaurant.findOne({ owner: owner._id });
      
      if (!restaurant) {
        restaurant = new Restaurant({
          owner: owner._id,
          name: `Restaurant ${i + 1}`,
          description: `The best multi-cuisine restaurant managed by ${owner.name}`,
          phone: owner.phone,
          cuisine: ['Pizza', 'Indian', 'Fast Food'],
          address: {
            line1: '123 Food Street',
            city: 'Rajkot',
            state: 'Gujarat',
            postalCode: '360005',
            lat: 22.3039,
            lng: 70.8022
          },
          isActive: true,
          averageRating: 4.5
        });
        await restaurant.save();
        console.log(`Created restaurant: ${restaurant.name}`);
        restaurantCount++;
      } else {
        console.log(`Found existing restaurant: ${restaurant.name}`);
      }

      // Add menu items for this restaurant
      for (const template of menuTemplates) {
        const exists = await MenuItem.findOne({ restaurant: restaurant._id, name: template.name });
        
        if (!exists) {
          // Add a slight random variation to the price
          const priceVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10
          
          const menuItem = new MenuItem({
            ...template,
            restaurant: restaurant._id,
            price: template.price + priceVariation
          });
          
          await menuItem.save();
          menuCount++;
        }
      }
    }

    console.log(`\nSuccess! Added/Verified ${restaurantCount} restaurants and added ${menuCount} menu items.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding menus:', error);
    process.exit(1);
  }
};

seedData();
