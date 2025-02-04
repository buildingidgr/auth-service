import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectRedis } from './utils/redis';
import { tokenRouter } from './routes/token';
import { errorHandler } from './middleware/errorHandler';
import { validateRequest } from './middleware/validateRequest';
import { SessionEventConsumer } from './consumers/sessionEventConsumer';

const app = express();
const port = process.env.PORT || 3000;

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

// Initialize async resources
async function initializeApp() {
  console.log('🚀 Starting application initialization...');
  
  try {
    // Connect to Redis
    console.log('📦 Connecting to Redis...');
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Initialize and start RabbitMQ consumer
    console.log('🐰 Connecting to RabbitMQ...');
    const consumer = new SessionEventConsumer(process.env.RABBITMQ_URL!);
    await consumer.connect();
    await consumer.consume();
    console.log('✅ RabbitMQ consumer started successfully');

    // Express middleware setup
    app.use(express.json());
    app.use(validateRequest);
    
    // CORS setup (using existing configuration)
    console.log('🔒 Setting up CORS...');
    app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 600
    }));

    // Routes
    console.log('🛣️ Setting up routes...');
    app.use('/v1/token', tokenRouter);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Error handling
    app.use(errorHandler);

    // Add graceful shutdown for the consumer
    process.on('SIGTERM', async () => {
      console.log('📤 Shutting down RabbitMQ consumer...');
      await consumer.shutdown();
      process.exit(0);
    });

    // Start server
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('🔗 Allowed origins:', allowedOrigins);
    });

  } catch (error) {
    console.error('💥 Failed to initialize application:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  process.exit(1);
});

// Initialize the application
initializeApp().catch((error) => {
  console.error('💥 Fatal error during initialization:', error);
  process.exit(1);
});

export { allowedOrigins };