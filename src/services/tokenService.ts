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
      console.log('Validating refresh token:', token);
      console.log('Token length:', token.length);
      console.log('Token parts:', token.split('.').length);

      const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      console.log('Decoded token:', decoded);
      
      if (decoded.type !== 'refresh') {
        console.log('Token type is not refresh');
        return null;
      }
      
      // Check if refresh token is in Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.sub}`);
      console.log('Stored token in Redis:', storedToken);
      
      if (!storedToken || storedToken !== token) {
        console.log('Token not found in Redis or does not match');
        return null;
      }

      console.log('Refresh token is valid');
      return { id: decoded.sub };
    } catch (error) {
      console.error('Error validating refresh token:', error);
      return null;
    }
  }

  async getTokenExpiration(token: string): Promise<number> {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (decoded && decoded.exp) {
        return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return 0;
  }
}

