import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithStructuredOutput } from '@/lib/anthropic';
import {
  createAnalysis,
  saveSession,
  getSession,
  updateAnalysis,
  addMessage,
  mergeAnalysisUpdate,
} from '@/lib/storage';
import type { AnalyzeRequest, AnalysisSession } from '@/types';

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
      // Continue existing session
      const existingSession = getSession(analysisId);
      if (!existingSession) {
        return NextResponse.json(
          { error: 'Analysis session not found' },
          { status: 404 }
        );
      }
      session = existingSession;
    } else {
      // Create new session
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

    // Call the AI
    const response = await analyzeWithStructuredOutput(
      {
        userInput: userInput || '',
        action,
        additionalContext,
        existingAnalysis: session.analysis,
      },
      session.messages
    );

    // Add assistant message
    addMessage(session.analysis.id, {
      role: 'assistant',
      content: response.content,
    });

    // Merge structured analysis if available
    if (response.structuredAnalysis) {
      const updatedAnalysis = mergeAnalysisUpdate(
        session.analysis,
        response.structuredAnalysis
      );
      updateAnalysis(session.analysis.id, updatedAnalysis);
      session.analysis = updatedAnalysis;
    }

    // Update status to completed
    updateAnalysis(session.analysis.id, { status: 'completed' });

    // Refresh session from storage
    const updatedSession = getSession(session.analysis.id);

    return NextResponse.json({
      analysis: updatedSession?.analysis,
      message: response.content,
      structuredAnalysis: response.structuredAnalysis,
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
