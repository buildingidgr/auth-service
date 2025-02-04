import dotenv from 'dotenv';

dotenv.config();

interface Config {
  API_SECRET: string;
  // Add other configuration values as needed
}

export const config: Config = {
  API_SECRET: process.env.API_SECRET || 'your-default-secret-key',
}; 