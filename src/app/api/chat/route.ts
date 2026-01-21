import { NextRequest } from 'next/server';
import { streamAnalysis } from '@/lib/anthropic';
import { getSession, addMessage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId, message, action = 'question' } = body;

    if (!analysisId || !message) {
      return new Response(
        JSON.stringify({ error: 'analysisId and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = getSession(analysisId);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Analysis session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add user message
    addMessage(analysisId, {
      role: 'user',
      content: message,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamAnalysis(
            {
              userInput: message,
              action,
            },
            session.messages,
            (chunk) => {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }
          );

          // Add assistant message after streaming completes
          addMessage(analysisId, {
            role: 'assistant',
            content: fullResponse,
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
