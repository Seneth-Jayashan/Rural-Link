const express = require('express');
// removed static upload serving
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const cartRoutes = require('./routes/cartRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io for real-time order tracking
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3001,https://www.rurallinksite.site,https://rurallinksite.site')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Realtime: authenticated order-room join + lightweight chat

const Order = require('./models/Order');

io.on('connection', (socket) => {
  socket.data.user = null;

  // Client should emit 'authenticate' right after connect with JWT
  socket.on('authenticate', (token) => {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = { _id: payload.id, role: payload.role };
      
      
      socket.emit('auth:ok');
    } catch (e) {
      socket.emit('auth:error', 'Invalid token');
    }
  });

  // Join order room after auth; server validates access
  socket.on('joinOrderRoom', async (orderId) => {
    try {
      if (!socket.data.user) return socket.emit('auth:required');
      const order = await Order.findById(orderId).select('customer deliveryPerson');
      if (!order) return socket.emit('order:error', 'Order not found');
      const uid = String(socket.data.user._id);
      const isParticipant = String(order.customer) === uid || String(order.deliveryPerson || '') === uid;
      if (!isParticipant) return socket.emit('order:error', 'Not authorized for this order');
      socket.join(`order_${orderId}`);
      socket.emit('order:joined', orderId);
    } catch {
      socket.emit('order:error', 'Failed to join order');
    }
  });

  // Join delivery drivers room for real-time order updates
  socket.on('joinDeliveryRoom', () => {
    try {
      if (!socket.data.user) return socket.emit('auth:required');
      if (socket.data.user.role !== 'deliver') return socket.emit('auth:error', 'Not a delivery driver');
      socket.join('delivery_drivers');
      socket.emit('delivery:joined');
    } catch {
      socket.emit('delivery:error', 'Failed to join delivery room');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Clean up any delivery driver specific data if needed
    console.log('Socket disconnected:', socket.data.user?.role);
  });

  // Lightweight chat messages scoped to order room
  socket.on('orderMessage', async ({ orderId, text, tempId }) => {
    try {
      if (!socket.data.user) return socket.emit('auth:required');
      if (!orderId || !text) return;
      const order = await Order.findById(orderId).select('customer deliveryPerson');
      if (!order) return;
      const uid = String(socket.data.user._id);
      const isParticipant = String(order.customer) === uid || String(order.deliveryPerson || '') === uid;
      if (!isParticipant) return;
      
      // Save message to database
      const ChatMessage = require('./models/ChatMessage');
      const recipient = String(order.customer) === uid ? order.deliveryPerson : order.customer;
      
      if (recipient) {
        const message = await ChatMessage.create({
          orderId,
          from: socket.data.user._id,
          to: recipient,
          text: String(text).slice(0, 2000),
          tempId: tempId || null
        });
        
        // Populate user details
        await message.populate('from', 'firstName lastName');
        await message.populate('to', 'firstName lastName');
        
        io.to(`order_${orderId}`).emit('orderMessage', message);
      }
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });


});

// Connect DB
connectDB();

// Middlewares
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions))
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Serve uploaded files statically
const path = require('path');
app.use('/uplod', express.static(path.join(__dirname, 'uplod')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic rate limiter (JSON responses + relaxed limit)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  handler: (req, res /*, next, options*/) => {
    res.status(429).json({ success: false, message: 'Too many requests, please try again later.' })
  }
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/utils', utilityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/location', locationRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Initialize realtime service
const { setRealtime } = require('./services/realtime');
setRealtime(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API running on port ${PORT}`));

// Server-level error and close logging
server.on('error', (err) => {
  console.error('HTTP server error:', err);
});

server.on('close', () => {
  console.warn('HTTP server closed');
});

// Graceful shutdown and process-level error handlers
const gracefulShutdown = async (signal) => {
  try {
    console.warn(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    // Force exit if close hangs
    setTimeout(() => {
      console.error('Force exiting after shutdown timeout.');
      process.exit(1);
    }, 10000).unref();
  } catch (e) {
    console.error('Error during graceful shutdown:', e);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = { app, server, io };


