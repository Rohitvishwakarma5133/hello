import { NextRequest, NextResponse } from 'next/server';
import { getTextStats, humanizeText } from '@/lib/textUtils';
import { HumanizeRequest, HumanizeResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: HumanizeRequest = await request.json();
    
    if (!body.text || body.text.trim() === '') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const originalStats = getTextStats(body.text);
    const intensity = body.options?.intensity || 'medium';
    
    const { humanizedText, improvements } = humanizeText(body.text, intensity);
    const humanizedStats = getTextStats(humanizedText);

    const response: HumanizeResponse = {
      originalText: body.text,
      humanizedText,
      stats: {
        original: originalStats,
        humanized: humanizedStats,
      },
      improvements,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error humanizing text:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}