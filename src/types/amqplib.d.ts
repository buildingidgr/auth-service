declare module 'amqplib' {
  export interface Connection {
    createChannel(): Promise<Channel>;
    close(): Promise<void>;
  }

  export interface Channel {
    assertQueue(queue: string, options?: any): Promise<any>;
    prefetch(count: number): Promise<void>;
    consume(queue: string, callback: (msg: ConsumeMessage | null) => void, options?: any): Promise<any>;
    ack(message: ConsumeMessage): void;
    reject(message: ConsumeMessage, requeue?: boolean): void;
    close(): Promise<void>;
  }

  export interface ConsumeMessage {
    content: Buffer;
  }

  export default function connect(url: string): Promise<Connection>;
} 