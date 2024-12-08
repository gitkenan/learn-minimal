# Learn Minimal

A streamlined learning plan generator powered by IBM's Granite AI model.

## Overview

Learn Minimal helps you create structured learning plans for any topic. Simply enter a topic, and the application will generate a concise learning plan using IBM's Granite 3.0 8B Instruct model. Each learning point can be expanded with additional AI-generated details to deepen your understanding.

## Features

- Generate learning plans for any topic
- View saved learning plans in your dashboard
- Expand any learning point with AI-generated details
- Track progress on individual learning points
- Secure authentication with Clerk
- Simple and intuitive interface

## Authentication

The app uses Clerk for secure user authentication. Clerk provides:
- Email and social login options
- Secure session management
- User profile management
- Protected API routes

## Tech Stack

- **Frontend**: Next.js 14 with React
- **Backend**: Next.js API Routes
- **Database**: Upstash Redis
- **AI Model**: IBM Granite 3.0 8B Instruct
- **Authentication**: Clerk
- **Styling**: Tailwind CSS

## Environment Variables

```
NVIDIA_API_KEY=your-api-key
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Configure Clerk authentication
   - Create a Clerk application at https://clerk.dev
   - Add authentication keys to environment variables
5. Run the development server: `npm run dev`

## Model Information

The application uses IBM's Granite 3.0 8B Instruct model via NVIDIA's API for:
- Generating initial learning plans
- Expanding individual learning points with detailed explanations
- Creating structured, concise content

## Using AI Detail Expansion

In the dashboard or plan view, you can:
1. Click on any learning point to see expansion options
2. Request AI-generated additional details
3. Save expanded explanations with your plan
