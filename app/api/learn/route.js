// app/api/learn/route.js

import OpenAI from 'openai';
import { getAuth } from '@clerk/nextjs/server';
import { redis } from '../../../lib/redis'; // Ensure this file exists

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY, // Use your Nvidia API key from .env.local
  baseURL: 'https://integrate.api.nvidia.com/v1', // Nvidia's base API URL
});

export async function POST(req) {
  try {
    // Authenticate the user
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Parse the topic from the request body
    const { topic } = await req.json();
    console.log("Received topic:", topic); // Log for debugging

    // Make the request to the Nvidia API without streaming
    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.2-3b-instruct",
      messages: [{ "role": "user", "content": `Create a learning plan for: ${topic}` }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 2048,
    });

    // Handle the response as a single JSON object (non-streaming)
    const planContent = completion.choices[0]?.message?.content || "No plan generated.";

    // Generate a unique plan ID
    const planId = `plan:${Date.now()}`;

    // Save the plan to Redis
    await redis.hset(`user:${userId}:plans`, {
      [planId]: JSON.stringify({
        id: planId,
        topic,
        content: planContent,
        progress: {}, // Initialize empty progress
      }),
    });

    // Return the generated learning plan and plan ID
    return new Response(JSON.stringify({ plan: planContent, planId }), { status: 200 });

  } catch (error) {
    console.error("Error in POST request:", error); // Log any errors
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

