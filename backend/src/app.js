// Load backend/.env by absolute path so the server works whether it is started
// from backend/ (npm start) or backend/src/ (node app.js).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');  
const app        = express();


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// ── CORS origin ─────────────────────────────────────────────
// LOCAL (default). For production set CLIENT_ORIGIN in backend/.env
// to https://telugusambandham.com (or swap the commented lines below).
const ALLOWED_ORIGIN = 'http://localhost:3000';
// const ALLOWED_ORIGIN = 'https://telugusambandham.com';

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || ALLOWED_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']     
};
app.use(cors(corsOptions));
// Preflight must use the same options (credentials + exact origin)
app.options('*', cors(corsOptions));
app.use(cookieParser());
// Serve static files. Uploaded gallery images have unique, immutable filenames
// (user_<id>_<timestamp>_<size>.<ext>), so they can be cached aggressively by
// browsers/CDN for far fewer repeat requests. (#2 perf: long-lived caching)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '365d',
  immutable: true
}));

const routes = require('./routes');
// Mount the admin router BEFORE the user router. Express matches mounted routers
// in registration order (not by prefix specificity), so the more specific
// /api/adminhub prefix must come first to avoid being shadowed by /api.
app.use('/api/adminhub', require('./routes/adminRoutes'));
app.use('/api', routes);

const port = process.env.PORT || 9012;
app.listen(port,"0.0.0.0" ,() => {
  console.log(`✅ Server running on port ${port}`);
});