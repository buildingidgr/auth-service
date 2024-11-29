import { redisClient } from '../utils/redis';
import { TokenService } from './tokenService';

interface ClerkSessionEvent {
  data: {
    id: string;
    user_id: string;
    status: 'active' | 'ended' | 'removed' | 'revoked';
    expire_at: number;
    abandon_at: number;
    last_active_at: number;
    client_id: string;
  };
  type: 'session.created' | 'session.ended' | 'session.removed' | 'session.revoked';
}

export class SessionService {
  private tokenService: TokenService;

  constructor() {
    this.tokenService = new TokenService();
  }

  async handleSessionEvent(event: ClerkSessionEvent): Promise<void> {
    const sessionKey = `clerk_session:${event.data.id}`;
    const userSessionsKey = `user_sessions:${event.data.user_id}`;

    switch (event.type) {
      case 'session.created':
        await this.handleSessionCreated(sessionKey, userSessionsKey, event);
        break;
      case 'session.ended':
      case 'session.removed':
      case 'session.revoked':
        await this.handleSessionTermination(sessionKey, userSessionsKey, event);
        break;
    }
  }

  private async handleSessionCreated(sessionKey: string, userSessionsKey: string, event: ClerkSessionEvent): Promise<void> {
    const ttl = Math.floor((event.data.expire_at - Date.now()) / 1000);
    
    await Promise.all([
      redisClient.set(sessionKey, JSON.stringify({
        userId: event.data.user_id,
        status: event.data.status,
        clientId: event.data.client_id,
        lastActiveAt: event.data.last_active_at
      }), { EX: ttl }),
      redisClient.sAdd(userSessionsKey, event.data.id)
    ]);
  }

  private async handleSessionTermination(sessionKey: string, userSessionsKey: string, event: ClerkSessionEvent): Promise<void> {
    await Promise.all([
      redisClient.del(sessionKey),
      redisClient.sRem(userSessionsKey, event.data.id),
      this.invalidateTokens(event.data.user_id, event.data.id)
    ]);
  }

  private async invalidateTokens(userId: string, sessionId: string): Promise<void> {
    await Promise.all([
      redisClient.del(`access_token:${sessionId}`),
      redisClient.del(`refresh_token:${sessionId}`),
      redisClient.del(`access_token:${userId}`),
      redisClient.del(`refresh_token:${userId}`)
    ]);
  }
} 