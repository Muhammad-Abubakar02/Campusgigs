const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // fixes querySrv ECONNREFUSED on some ISPs

require('dotenv').config();

// Fail fast with a clear message instead of a confusing crash later
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variable(s): ${missing.join(', ')}. Check your .env file or hosting settings.`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 16) {
  console.error('JWT_SECRET is too short for production. Use a long random string.');
  process.exit(1);
}

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
