import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build system prompt based on context
    let systemPrompt = `You are an AI health assistant specializing in ECG (electrocardiogram) data analysis and cardiac health. You help users understand their heart health data, including:

- ECG waveforms and readings
- Heart rate (HR) and heart rate variability (HRV)
- ECG alerts and their severity levels
- Signal quality and device status
- General cardiac health education

IMPORTANT GUIDELINES:
1. Always remind users that you are an AI assistant and not a replacement for professional medical advice
2. Encourage users to consult with their healthcare provider for medical decisions
3. Be clear, educational, and supportive in your responses
4. Use simple language when explaining medical terms
5. If you notice concerning patterns, gently suggest the user contact their healthcare provider
6. Do not diagnose conditions - only provide educational information

`;

    // Add context information if available
    if (context) {
      systemPrompt += '\n\nCURRENT PATIENT CONTEXT:\n';

      if (context.liveData) {
        const { metrics, status, timestamp } = context.liveData;
        systemPrompt += `
Current ECG Status: ${status}
Last Reading Time: ${new Date(timestamp).toLocaleString()}
Heart Rate: ${metrics.heart_rate_bpm} BPM
HRV (RMSSD): ${metrics.hrv_rmssd} ms
Signal Quality: ${metrics.signal_quality}%
`;
      }

      if (context.alerts && context.alerts.length > 0) {
        systemPrompt += '\n\nRECENT ALERTS:\n';
        context.alerts.slice(0, 5).forEach((alert: any) => {
          systemPrompt += `- [${alert.severity.toUpperCase()}] ${alert.summary} (${new Date(alert.timestamp).toLocaleString()})\n`;
        });
      }

      if (context.analysisRecords && context.analysisRecords.length > 0) {
        systemPrompt += '\n\nRECENT ANALYSIS RECORDS:\n';
        context.analysisRecords.slice(0, 3).forEach((record: any) => {
          systemPrompt += `- HR: ${record.metrics.heart_rate_bpm} BPM, HRV: ${record.metrics.hrv_rmssd} ms, Quality: ${record.metrics.signal_quality_score}%, Severity: ${record.analysis.severity}\n`;
        });
      }

      if (context.patientInfo) {
        systemPrompt += `\nPatient ID: ${context.patientInfo.userId}\n`;
        if (context.patientInfo.deviceId) {
          systemPrompt += `Device ID: ${context.patientInfo.deviceId}\n`;
        }
      }
    }

    systemPrompt += '\n\nProvide helpful, educational responses based on this context. Remember to always encourage professional medical consultation for any health concerns.';

    // Build conversation history
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: Message) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I apologize, but I could not generate a response.';

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
    });

  } catch (error: any) {
    console.error('AI Chat API Error:', error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please configure ANTHROPIC_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process AI request', details: error?.message },
      { status: 500 }
    );
  }
}
