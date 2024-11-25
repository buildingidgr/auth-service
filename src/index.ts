import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createClient } from 'redis';
import { tokenRouter } from './routes/token';
import { errorHandler } from './middleware/errorHandler';
import { validateRequest } from './middleware/validateRequest';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client for caching
const redis = createClient({
  url: process.env.REDIS_URL
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.NEXT_PUBLIC_APP_URL!,
    process.env.NEXT_PUBLIC_API_URL!
  ],
  credentials: true
}));
app.use(express.json());
app.use(validateRequest);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/v1/token', tokenRouter);

// Error handling
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

async function startServer() {
  try {
    await redis.connect();
    app.listen(port, () => {
      console.log(`Auth service listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

