# Auth Service

This is an authentication service built with Express.js and TypeScript, designed to work with Railway deployment.

## Features

- API key exchange for JWT
- Token refresh
- Token validation
- Rate limiting
- CORS configuration
- Health check endpoint

## Deployment

This service is configured for deployment on Railway. Follow these steps to deploy:

1. Ensure you have a Railway account and the Railway CLI installed.
2. Initialize a new Railway project: `railway init`
3. Add a Redis plugin to your Railway project: `railway add`
4. Set up environment variables on Railway:

## Environment Variables

- `NEXT_PUBLIC_APP_URL`: Your frontend application URL (e.g., https://app.example.com)
- `NEXT_PUBLIC_API_URL`: Your API URL (e.g., https://api.example.com)
- `JWT_SECRET`: Secret key for JWT signing
- `REDIS_URL`: Redis connection URL
- `RABBITMQ_URL`: RabbitMQ connection URL
- `PORT`: (Optional) Port number for the service (default: 3000)

