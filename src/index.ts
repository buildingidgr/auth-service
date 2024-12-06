import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Get allowed origins from environment variables and filter out undefined values
const allowedOrigins = [
  'http://localhost:3000',                                         // Local development
  'https://auth-service-production-16ee.up.railway.app',          // Railway production URL
  process.env.NEXT_PUBLIC_APP_URL,                                // Frontend production URL
  process.env.NEXT_PUBLIC_API_URL                                 // API production URL
].filter((origin): origin is string => !!origin);

// Simplified CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600
}));

// Debug middleware to log CORS-related information
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  console.log('Allowed Origins:', allowedOrigins);
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
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
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
      allowedOrigins
    });
  }
  next(err);
});

export { allowedOrigins };