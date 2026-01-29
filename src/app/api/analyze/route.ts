import { NextRequest, NextResponse } from 'next/server';
import { streamAnalysis } from '@/lib/anthropic';
import {
  createAnalysis,
  saveSession,
  getSession,
  updateAnalysis,
  addMessage,
  mergeAnalysisUpdate,
} from '@/lib/storage';
import { parseProgressiveSections } from '@/lib/progressive-parser';
import type { AnalyzeRequest, AnalysisSession, Analysis } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest & { analysisId?: string } = await request.json();
    const { userInput, action, additionalContext, analysisId } = body;

    if (!userInput && action === 'new') {
      return NextResponse.json(
        { error: 'userInput is required for new analysis' },
        { status: 400 }
      );
    }

    let session: AnalysisSession;

    if (analysisId && action !== 'new') {
      const existingSession = getSession(analysisId);
      if (!existingSession) {
        return NextResponse.json(
          { error: 'Analysis session not found' },
          { status: 404 }
        );
      }
      session = existingSession;
    } else {
      const analysis = createAnalysis(userInput);
      session = {
        analysis,
        messages: [],
      };
      saveSession(session);
    }

    // Add user message
    addMessage(session.analysis.id, {
      role: 'user',
      content: userInput || additionalContext || '',
    });

    // Update status to in_progress
    updateAnalysis(session.analysis.id, { status: 'in_progress' });

    const encoder = new TextEncoder();
    let accumulated = '';
    const completedSections = new Set<string>();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the analysis ID immediately so the client can redirect
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ analysisId: session.analysis.id })}\n\n`)
          );

          await streamAnalysis(
            {
              userInput: userInput || '',
              action,
              additionalContext,
              existingAnalysis: session.analysis,
            },
            session.messages,
            (chunk) => {
              accumulated += chunk;

              // Send raw chunk for "thinking" display
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              );

              // Try to parse completed sections
              const parseResult = parseProgressiveSections(accumulated, completedSections);
              if (parseResult.newSections.length > 0) {
                for (const sectionKey of parseResult.newSections) {
                  completedSections.add(sectionKey);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        section: sectionKey,
                        data: parseResult.completedSections[sectionKey],
                      })}\n\n`
                    )
                  );
                }

                // Progressively merge into storage
                const partialUpdate: Partial<Analysis> = {};
                for (const key of parseResult.newSections) {
                  (partialUpdate as Record<string, unknown>)[key] = parseResult.completedSections[key];
                }
                const updated = mergeAnalysisUpdate(session.analysis, partialUpdate);
                updateAnalysis(session.analysis.id, updated);
                session.analysis = updated;
              }
            },
            { useStructuredOutput: action === 'new' }
          );

          // Add assistant message
          addMessage(session.analysis.id, {
            role: 'assistant',
            content: accumulated,
          });

          // Final parse to catch any remaining sections
          const finalParse = parseProgressiveSections(accumulated, completedSections);
          if (finalParse.newSections.length > 0) {
            for (const sectionKey of finalParse.newSections) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    section: sectionKey,
                    data: finalParse.completedSections[sectionKey],
                  })}\n\n`
                )
              );
            }
            const partialUpdate: Partial<Analysis> = {};
            for (const key of finalParse.newSections) {
              (partialUpdate as Record<string, unknown>)[key] = finalParse.completedSections[key];
            }
            const updated = mergeAnalysisUpdate(session.analysis, partialUpdate);
            updateAnalysis(session.analysis.id, updated);
          }

          // Update status to completed
          updateAnalysis(session.analysis.id, { status: 'completed' });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error('Streaming analysis error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Analysis streaming failed' })}\n\n`)
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
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to process analysis request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Analysis ID is required' },
      { status: 400 }
    );
  }

  const session = getSession(id);

  if (!session) {
    return NextResponse.json(
      { error: 'Analysis not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(session);
}
