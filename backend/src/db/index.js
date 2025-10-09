// src/config/db.js
import mongoose from "mongoose";

const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connect error:', err);
    process.exit(1);
  }
};

export default connectDB;
