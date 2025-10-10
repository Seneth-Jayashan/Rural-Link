const express = require('express');
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

const app = express();
const server = http.createServer(app);

// Socket.io for real-time order tracking
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3001')
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
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Basic rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
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

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API running on port ${PORT}`));

module.exports = { app, server, io };


