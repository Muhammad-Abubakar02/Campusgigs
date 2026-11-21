// Vercel serverless entry point: wraps the Express app so the API can run on Vercel's free plan.
// (Locally and on classic hosts the API still starts from index.js.)
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // fixes querySrv ECONNREFUSED for Atlas on some networks

require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../app');

// Reuse one MongoDB connection between requests while the function stays warm
let connecting = null;
function connect() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  return connecting;
}

module.exports = async (req, res) => {
  const skipDb = req.url === '/' || req.url.startsWith('/api/health');
  if (!skipDb) {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server is missing MONGO_URI or JWT_SECRET' });
    }
    try {
      await connect();
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      return res.status(503).json({ message: 'Database unavailable, please try again' });
    }
  }
  return app(req, res);
};
