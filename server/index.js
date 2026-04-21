require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const session = require('express-session');
const path    = require('path');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');

const app = express();

// ── CORS ─────────────────────────────────────────────────────
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 100000 }));
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 4 },
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/history', uploadRoutes);
app.use('/api/upload',  require('./routes/upload'));
app.get('/api/ping',   (req, res) => res.json({ status: 'DataNova Cloud Online', port: 5002 }));
app.use('/api/connect', require('./routes/connect'));
app.use('/api/data',    require('./routes/data'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/ask',     require('./routes/ask'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status:'ok', time: new Date().toISOString() }));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`\n✅ Server → http://localhost:${PORT}\n`));