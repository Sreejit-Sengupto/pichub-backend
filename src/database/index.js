import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log('\nReady State ✅:', connection.connection.readyState);
        console.log('MongoDB connected successfully ⚙\n');
        console.log('Connection Host 🌐:', connection.connection.host);
    } catch (error) {
        console.log('Connection to MongoDB failed' + error.message);
        process.exit(1);
    }
};

export default connectDB;
