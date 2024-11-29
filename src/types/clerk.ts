export interface ClerkSessionEvent {
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