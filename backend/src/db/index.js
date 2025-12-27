// src/config/db.js
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    try {
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       console.log(`\n MONGODB is connected !! DB_HOST:${connectionInstance.connection.host}`)
       //console.log(connectionInstance);
    } catch (error) {
        console.log("MONGODB ERROR ",error);
        process.exit(1);
    }
}

// const connectDB = async (mongoUri) => {
//   try {
//     await mongoose.connect(mongoUri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected');
//   } catch (err) {
//     console.error('MongoDB connect error:', err);
//     process.exit(1);
//   }
// };

export default connectDB;
