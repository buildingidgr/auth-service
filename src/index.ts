import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Get allowed origins from environment variables
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600
}));

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Apply Helmet after CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
}));

// Additional middleware for CORS debugging
app.use((req, res, next) => {
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  console.log('Request origin:', req.get('origin'));
  next();
});

// Preflight request handler
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600
}));

// Error handling middleware specifically for CORS errors
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message.includes('CORS')) {
    console.error('CORS Error:', {
      error: err.message,
      origin: req.get('origin'),
      method: req.method,
      path: req.path
    });
    
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_API_URL
      ].filter(Boolean)
    });
  }
  next(err);
});

export { allowedOrigins };