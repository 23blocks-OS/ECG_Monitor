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
    const { message, context, conversationHistory, userType } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build system prompt for medical professionals
    let systemPrompt = `You are a clinical decision support AI assistant specializing in ECG (electrocardiogram) analysis for healthcare professionals. You provide:

- ECG waveform interpretation and analysis
- Heart rate (HR) and heart rate variability (HRV) assessment
- Alert pattern recognition and clinical significance
- Signal quality evaluation
- Trend analysis and clinical insights
- Educational information on cardiac conditions

IMPORTANT GUIDELINES FOR CLINICAL USE:
1. You are a clinical decision support tool, not a replacement for professional medical judgment
2. Provide evidence-based insights and interpretations
3. Highlight potentially concerning patterns that may warrant clinical attention
4. Use appropriate medical terminology while remaining clear
5. When suggesting clinical actions, frame them as considerations rather than directives
6. Always emphasize the importance of clinical correlation with patient presentation
7. Do not provide definitive diagnoses - support clinical decision-making

DISCLAIMER: All AI-generated insights should be reviewed by qualified healthcare professionals in the context of the complete clinical picture.

`;

    // Add context information if available
    if (context) {
      systemPrompt += '\n\nCURRENT PATIENT CONTEXT:\n';

      if (context.patient) {
        const { name, age, gender, medical_history, user_id, device_id, connection_status, last_heart_rate } = context.patient;
        systemPrompt += `
Patient: ${name}
Patient ID: ${user_id}
${age ? `Age: ${age}` : ''}
${gender ? `Gender: ${gender}` : ''}
Device ID: ${device_id}
Connection Status: ${connection_status}
${last_heart_rate ? `Last HR: ${last_heart_rate} BPM` : ''}
${medical_history ? `\nMedical History: ${medical_history}` : ''}
`;
      }

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
        context.alerts.slice(0, 10).forEach((alert: any) => {
          systemPrompt += `- [${alert.severity.toUpperCase()}] ${alert.summary} (${new Date(alert.timestamp).toLocaleString()})\n`;
        });
      }

      if (context.analysisRecords && context.analysisRecords.length > 0) {
        systemPrompt += '\n\nRECENT ANALYSIS RECORDS:\n';
        context.analysisRecords.slice(0, 5).forEach((record: any) => {
          systemPrompt += `- ${new Date(record.analysis_timestamp).toLocaleString()}: HR ${record.metrics.heart_rate_bpm} BPM, HRV ${record.metrics.hrv_rmssd} ms, Quality ${record.metrics.signal_quality_score}%, Severity: ${record.analysis.severity}\n`;
        });
      }
    }

    systemPrompt += '\n\nProvide clinical insights based on this context. Focus on actionable information that supports patient care and clinical decision-making.';

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

    // Call Claude API with higher token limit for clinical use
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
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
