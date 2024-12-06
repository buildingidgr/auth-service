import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_API_URL,
      // Add localhost for development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ].filter(Boolean);

    console.log('Incoming origin:', origin);
    console.log('Allowed origins:', allowedOrigins);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],
  credentials: true,
  maxAge: 600, // 10 minutes cache for preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Apply Helmet after CORS to prevent Helmet from interfering with CORS headers
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
app.options('*', cors(corsOptions));

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

export { corsOptions };