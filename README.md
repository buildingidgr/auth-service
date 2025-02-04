# Auth Service

A secure authentication service for managing API keys and user authentication.

## Features

- API Key management
- Secure storage using Redis
- Protected endpoints with API secret authentication
- Docker support
- Railway deployment ready

## Prerequisites

- Node.js >= 18
- Redis
- Docker (optional)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
API_SECRET=your-secret-key-here
REDIS_URL=redis://localhost:6379
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

## API Endpoints

### Store API Key
- **POST** `/api-key/store`
- **Headers**: 
  - `X-API-Secret`: Your API secret
- **Body**:
```json
{
  "apiKey": "your-api-key",
  "userId": "user-id"
}
```

### Health Check
- **GET** `/health`

## Deployment to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the following environment variables in Railway:
   - `API_SECRET`
   - `REDIS_URL`
4. Deploy!

## Docker

Build the image:
```bash
docker build -t auth-service .
```

Run the container:
```bash
docker run -p 3000:3000 --env-file .env auth-service
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript code
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

