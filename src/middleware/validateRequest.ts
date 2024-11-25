import { Request, Response, NextFunction } from 'express';

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).json({
      error: 'Content-Type must be application/json'
    });
  }
  next();
}

