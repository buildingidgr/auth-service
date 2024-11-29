import amqp, { Channel, Connection } from 'amqplib';
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
      this.connection = await amqp.connect(this.rabbitmqUrl);
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

    this.channel.consume('session-events', async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        await this.sessionService.handleSessionEvent(event);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Error processing session event:', error);
        // Reject and requeue if it's a temporary failure
        this.channel?.nack(msg, false, true);
      }
    }, { noAck: false });
  }

  async shutdown(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
} 