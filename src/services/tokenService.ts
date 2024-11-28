import jwt from 'jsonwebtoken';
import { redisClient } from '../utils/redis';

export class TokenService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
  }

  async generateAccessToken(user: any): Promise<string> {
    return jwt.sign({ sub: user.id, type: 'access' }, this.jwtSecret, { expiresIn: '1h' });
  }

  async generateRefreshToken(user: any): Promise<string> {
    return jwt.sign({ sub: user.id, type: 'refresh' }, this.jwtSecret, { expiresIn: '7d' });
  }

  async validateAccessToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return typeof decoded !== 'string' && decoded.type === 'access';
    } catch {
      return false;
    }
  }

  async validateRefreshToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      if (decoded.type !== 'refresh') {
        return null;
      }
      
      // Check if refresh token is in Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.sub}`);
      if (!storedToken || storedToken !== token) {
        return null;
      }

      return { id: decoded.sub };
    } catch {
      return null;
    }
  }
}

