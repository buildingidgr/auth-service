import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

export class TokenService {
  private redis = createClient({ url: process.env.REDIS_URL });

  async generateAccessToken(user: any): Promise<string> {
    return jwt.sign({ sub: user.id, type: 'access' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  }

  async generateRefreshToken(user: any): Promise<string> {
    return jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  }

  async validateAccessToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return typeof decoded !== 'string' && decoded.type === 'access';
    } catch {
      return false;
    }
  }

  async validateRefreshToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      if (typeof decoded === 'string' || decoded.type !== 'refresh') {
        return null;
      }
      
      // Check if refresh token is in Redis
      const storedToken = await this.redis.get(`refresh_token:${decoded.sub}`);
      if (!storedToken || storedToken !== token) {
        return null;
      }

      return { id: decoded.sub };
    } catch {
      return null;
    }
  }
}

