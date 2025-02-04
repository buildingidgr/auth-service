import amqplib, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { redisClient } from '../utils/redis';

export class ApiKeyMappingConsumer {
  private channel: Channel | null = null;
  private connection: Connection | null = null;

  constructor(private readonly rabbitmqUrl: string) {}

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue('api-key-mappings', {
        durable: true,
        arguments: {
          'x-queue-type': 'classic'
        }
      });

      console.log('Connected to RabbitMQ for api-key-mappings');
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

    console.log('Starting to consume api key mapping events from queue: api-key-mappings');

    this.channel.consume('api-key-mappings', async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = msg.content.toString();
        console.log('Received api key mapping:', content);
        
        const mapping = JSON.parse(content);
        const { hashed_api_key, clerk_user_id } = mapping;

        // Store the mapping in Redis
        const key = `api_key:${hashed_api_key}`;
        await redisClient.set(key, clerk_user_id);
        
        console.log('Successfully stored API key mapping in Redis');
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Error processing api key mapping:', error);
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