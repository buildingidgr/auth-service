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
}

