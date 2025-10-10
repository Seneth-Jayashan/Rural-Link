const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://rural_link_db:ruralLink.sliit.12@cluster0.z5vjzpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    const conn = mongoose.connection;
    conn.on('error', (err) => {
      console.error('Mongo connection error event:', err);
    });
    conn.on('disconnected', () => {
      console.warn('Mongo connection disconnected');
    });
    conn.on('reconnected', () => {
      console.log('Mongo connection reconnected');
    });
    conn.on('connecting', () => {
      console.log('Mongo connection connecting...');
    });
    conn.on('connected', () => {
      console.log('Mongo connection connected');
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
