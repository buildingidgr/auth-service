import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const validateApiSecret = (req: Request, res: Response, next: NextFunction): void => {
  const apiSecret = req.headers['x-api-secret'];

  if (!apiSecret || apiSecret !== config.API_SECRET) {
    res.status(401).json({ error: 'Invalid or missing API secret' });
    return;
  }

  next();
}; 