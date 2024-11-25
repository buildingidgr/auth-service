import crypto from 'crypto';
import { createClient } from 'redis';

export class ApiKeyService {
  private redis = createClient({ url: process.env.REDIS_URL });

  async validateApiKey(apiKey: string): Promise<any> {
    // In a real implementation, this would check against your database
    // For now, we'll use Redis as a simple store
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    const userId = await this.redis.get(`api_key:${hashedKey}`);
    if (!userId) {
      return null;
    }

    return { id: userId };
  }
}

