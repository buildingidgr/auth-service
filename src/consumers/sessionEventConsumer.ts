import amqplib, { Channel, Connection, ConsumeMessage } from 'amqplib';
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
      this.connection = await amqplib.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

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
        const event = JSON.parse(msg.content.toString());
        console.log('Received session event:', {
          type: event.type,
          sessionId: event.data.id,
          userId: event.data.user_id
        });
        
        await this.sessionService.handleSessionEvent(event);
        console.log('Successfully processed session event');
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Error processing session event:', error);
        this.channel?.nack(msg, false, true);
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