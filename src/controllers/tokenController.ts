import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../utils/redis';
import { ApiKeyService } from '../services/apiKeyService';
import { TokenService } from '../services/tokenService';
import { ClerkSessionEvent } from '../types/clerk';

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

  async exchangeClerkSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, userId } = req.body;
      
      console.log('Attempting to exchange session:', { sessionId, userId });

      if (!sessionId || !userId) {
        return res.status(400).json({ error: 'Session ID and User ID are required' });
      }

      // Verify session exists in Redis
      const sessionKey = `clerk_session:${sessionId}`;
      console.log('Looking up session in Redis:', sessionKey);
      
      const sessionData = await redisClient.get(sessionKey);
      console.log('Session data from Redis:', sessionData);

      if (!sessionData) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const session = JSON.parse(sessionData);
      console.log('Parsed session data:', session);
      
      // Verify session belongs to user
      if (session.userId !== userId) {
        console.log('Session user ID mismatch:', {
          sessionUserId: session.userId,
          requestUserId: userId
        });
        return res.status(401).json({ error: 'Session does not belong to user' });
      }

      // Generate tokens
      const user = { id: userId };
      const accessToken = await this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(user);

      // Store tokens in Redis
      await Promise.all([
        redisClient.set(`access_token:${sessionId}`, accessToken, { EX: 3600 }),
        redisClient.set(`refresh_token:${sessionId}`, refreshToken, { EX: 60 * 60 * 24 * 7 })
      ]);

      console.log('Successfully exchanged session for tokens');

      res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 3600
      });
    } catch (error) {
      console.error('Error exchanging session:', error);
      next(error);
    }
  }
}

