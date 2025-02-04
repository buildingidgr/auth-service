import crypto from 'crypto';
import { redisClient } from '../utils/redis';

export class ApiKeyService {
  async validateApiKey(apiKey: string): Promise<any> {
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    const userId = await redisClient.get(`api_key:${hashedKey}`);
    if (!userId) {
      return null;
    }

    return { id: userId };
  }

  async storeApiKey(apiKey: string, userId: string): Promise<void> {
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    await redisClient.set(`api_key:${hashedKey}`, userId);
  }
}

