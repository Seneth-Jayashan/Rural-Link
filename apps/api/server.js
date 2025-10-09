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

// --- Realtime: Auth + Presence + Chat + Calls ---
// In-memory maps (consider Redis for production scale)
const userSockets = new Map(); // userId -> Set<socketId>
const socketUser = new Map(); // socketId -> user object { id, name? }

// Socket.IO auth using JWT. Clients must pass token via handshake auth.
io.use((socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '') || socket.handshake.query?.token;
    // Fallback: parse cookie header for `token=` if present
    if (!token && socket.handshake.headers?.cookie) {
      const cookieHeader = socket.handshake.headers.cookie;
      const match = cookieHeader.split(';').map(s=>s.trim()).find(c=>c.startsWith('token='));
      if (match) token = decodeURIComponent(match.split('=')[1]);
    }
    if (!token) return next(new Error('Unauthorized: missing token'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize user object (expecting payload.sub or payload.id)
    const user = { id: payload.sub || payload.id || payload._id, name: payload.name || payload.email || 'user' };
    if (!user.id) return next(new Error('Unauthorized: invalid token'));
    socket.user = user;
    return next();
  } catch (err) {
    return next(new Error('Unauthorized: invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  // Track connections per user
  if (!userSockets.has(user.id)) userSockets.set(user.id, new Set());
  userSockets.get(user.id).add(socket.id);
  socketUser.set(socket.id, user);

  // Join a stable personal room for direct messaging/calling
  const userRoom = `user_${user.id}`;
  socket.join(userRoom);

  // Presence broadcast
  io.to(userRoom).emit('presence:state', { userId: user.id, online: true });

  // Existing order tracking room join remains available
  socket.on('joinOrderRoom', (orderId) => {
    socket.join(`order_${orderId}`);
  });

  // ----- Chat events -----
  // Send message: { to, messageId, text, meta }
  socket.on('chat:send', (payload = {}, ack) => {
    const { to, messageId, text, meta } = payload;
    if (!to || !messageId || typeof text !== 'string') return typeof ack === 'function' && ack({ ok: false, error: 'invalid_payload' });
    const msg = { from: user.id, to, messageId, text, meta: meta || {}, ts: Date.now() };
    io.to(`user_${to}`).emit('chat:deliver', msg);
    typeof ack === 'function' && ack({ ok: true, delivered: true, ts: msg.ts });
  });

  // Typing indicator: { to, isTyping }
  socket.on('chat:typing', ({ to, isTyping }) => {
    if (!to) return;
    io.to(`user_${to}`).emit('chat:typing', { from: user.id, isTyping: !!isTyping });
  });

  // Receipt: { to, messageId, status: 'seen' | 'delivered' }
  socket.on('chat:receipt', ({ to, messageId, status }) => {
    if (!to || !messageId) return;
    io.to(`user_${to}`).emit('chat:receipt', { from: user.id, messageId, status: status || 'seen', ts: Date.now() });
  });

  // ----- Call signaling events -----
  // Initiate call: { to, type: 'audio'|'video' }
  socket.on('call:init', ({ to, type }) => {
    if (!to) return;
    io.to(`user_${to}`).emit('call:ring', { from: user.id, type: type || 'audio', ts: Date.now() });
  });

  // Accept/Reject
  socket.on('call:accept', ({ to }) => {
    if (!to) return;
    io.to(`user_${to}`).emit('call:accept', { from: user.id });
  });
  socket.on('call:reject', ({ to, reason }) => {
    if (!to) return;
    io.to(`user_${to}`).emit('call:reject', { from: user.id, reason: reason || 'rejected' });
  });

  // WebRTC SDP and ICE
  socket.on('call:offer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    io.to(`user_${to}`).emit('call:offer', { from: user.id, sdp });
  });
  socket.on('call:answer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    io.to(`user_${to}`).emit('call:answer', { from: user.id, sdp });
  });
  socket.on('call:ice', ({ to, candidate }) => {
    if (!to || !candidate) return;
    io.to(`user_${to}`).emit('call:ice', { from: user.id, candidate });
  });

  // End call
  socket.on('call:end', ({ to, reason }) => {
    if (!to) return;
    io.to(`user_${to}`).emit('call:end', { from: user.id, reason: reason || 'ended' });
  });

  socket.on('disconnect', () => {
    // Cleanup user socket maps
    const set = userSockets.get(user.id);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) userSockets.delete(user.id);
    }
    socketUser.delete(socket.id);
    io.to(userRoom).emit('presence:state', { userId: user.id, online: userSockets.has(user.id) });
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

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API running on port ${PORT}`));

module.exports = { app, server, io };


