import connect, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { SessionService } from '../services/sessionService';

export class SessionEventConsumer {
  private channel: Channel | null = null;
  private connection: Connection | null = null;
  private sessionService: SessionService;

  constructor(private readonly rabbitmqUrl: string) {
    this.sessionService = new SessionService();
  }

  async connect(): Promise<void> {
    try {
      this.connection = await connect(this.rabbitmqUrl);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      await this.channel.assertQueue('session-events', {
        durable: true,
        arguments: {
          'x-queue-type': 'classic'
        }
      });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async consume(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.prefetch(1);

    console.log('Starting to consume session events from queue: session-events');

    this.channel.consume('session-events', async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        console.log('Raw message:', msg.content.toString());
        const envelope = JSON.parse(msg.content.toString());
        
        // Extract the actual Clerk event from the envelope
        const event = {
          type: envelope.eventType,
          data: envelope.data.data
        };

        console.log('Processed event:', {
          type: event.type,
          sessionId: event.data.id,
          userId: event.data.user_id,
          status: event.data.status
        });
        
        await this.sessionService.handleSessionEvent(event);
        console.log('Successfully processed session event');
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Error processing session event:', error);
        // Don't requeue parse errors
        this.channel?.reject(msg, false);
      }
    }, { noAck: false });
  }

  async shutdown(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      console.error('Error shutting down consumer:', error);
    }
  }
} 