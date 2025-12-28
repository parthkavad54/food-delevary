// src/models/restaurant.model.js
import mongoose from'mongoose';

const RestaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  phone: { type: String },
  cuisine: [{ type: String }],
  address: {
    line1: String, city: String, state: String, postalCode: String, lat: Number, lng: Number
  },
  isActive: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual to populate menu items
RestaurantSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'restaurant'
});

export default mongoose.model('Restaurant', RestaurantSchema);
