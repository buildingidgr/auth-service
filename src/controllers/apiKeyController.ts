import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/apiKeyService';

export class ApiKeyController {
  private apiKeyService: ApiKeyService;

  constructor() {
    this.apiKeyService = new ApiKeyService();
  }

  async storeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiKey, userId } = req.body;

      if (!apiKey || !userId) {
        res.status(400).json({ error: 'API key and user ID are required' });
        return;
      }

      await this.apiKeyService.storeApiKey(apiKey, userId);
      res.status(201).json({ message: 'API key stored successfully' });
    } catch (error) {
      next(error);
    }
  }
} 