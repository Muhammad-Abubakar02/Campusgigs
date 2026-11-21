const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Behind Render's proxy: needed so rate limiting sees the real client IP
app.set('trust proxy', 1);

// Security headers (X-Content-Type-Options, HSTS, no X-Powered-By, ...)
app.use(helmet());

// CLIENT_URL can hold several origins separated by commas (local + deployed frontend)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  })
);

app.use(express.json({ limit: '10kb' })); // reject huge bodies

// Rate limiting: general API limit + a stricter one for login/register (brute-force protection)
const limiterOff = process.env.DISABLE_RATE_LIMIT === 'true';
const limiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => limiterOff,
    message: { message },
  });
app.use('/api', limiter(Number(process.env.API_RATE_LIMIT) || 600, 'Too many requests, please try again later'));
const authLimiter = limiter(
  Number(process.env.AUTH_RATE_LIMIT) || 30,
  'Too many login attempts, please try again in 15 minutes'
);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/', (req, res) => res.json({ message: 'CampusGigs API is running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()) }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gigs', require('./routes/gigs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages', require('./routes/messages'));

// 404 + error handlers
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  // malformed JSON body etc. are client errors, not server errors
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.type === 'entity.too.large' ? 'Request body too large' : 'Invalid request' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

module.exports = app;
