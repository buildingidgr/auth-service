import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../utils/redis';
import { ApiKeyService } from '../services/apiKeyService';
import { TokenService } from '../services/tokenService';

export class TokenController {
  private apiKeyService: ApiKeyService;
  private tokenService: TokenService;

  constructor() {
    this.apiKeyService = new ApiKeyService();
    this.tokenService = new TokenService();
  }

  async exchangeApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }

      // Validate API key
      const user = await this.apiKeyService.validateApiKey(apiKey);
      if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Check if we already have a valid access token for this user
      const existingToken = await redisClient.get(`access_token:${user.id}`);
      if (existingToken) {
        // Verify the existing token
        try {
          jwt.verify(existingToken, process.env.JWT_SECRET!);
          // If verification succeeds, return the existing token
          return res.json({
            access_token: existingToken,
            token_type: 'Bearer',
            expires_in: await this.tokenService.getTokenExpiration(existingToken)
          });
        } catch (error) {
          // If verification fails (e.g., token expired), continue to generate new tokens
        }
      }

      // Generate new tokens
      const accessToken = await this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(user);

      // Cache tokens
      await redisClient.set(`access_token:${user.id}`, accessToken, { EX: 3600 }); // 1 hour
      await redisClient.set(`refresh_token:${user.id}`, refreshToken, { EX: 60 * 60 * 24 * 7 }); // 7 days

      res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 3600 // 1 hour
      });
    } catch (error) {
      console.error('Error in exchangeApiKey:', error);
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      console.log('Received refresh token:', refresh_token);

      const user = await this.tokenService.validateRefreshToken(refresh_token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const newAccessToken = await this.tokenService.generateAccessToken(user);
      const newRefreshToken = await this.tokenService.generateRefreshToken(user);

      // Update cached refresh token
      await redisClient.set(
        `refresh_token:${user.id}`,
        newRefreshToken,
        { EX: 60 * 60 * 24 * 7 } // 7 days
      );

      res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: 3600 // 1 hour
      });
    } catch (error) {
      console.error('Error in refreshToken:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      next(error);
    }
  }

  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const isValid = await this.tokenService.validateAccessToken(token);
      res.json({ isValid });
    } catch (error) {
      console.error('Error in validateToken:', error);
      next(error);
    }
  }
}

