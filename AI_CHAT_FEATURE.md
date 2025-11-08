# AI Chat Feature Documentation

## Overview

The ECG Monitor platform now includes an AI-powered chat assistant that helps users and medical professionals understand ECG data, alerts, and cardiac health information. The feature is available on both the user dashboard and the organization/medical professional dashboard.

## Features

### For Users (Patient Dashboard)
- **Context-Aware Conversations**: The AI has access to current ECG readings, alerts, and activity data
- **Health Education**: Explains ECG metrics like heart rate, HRV, and signal quality
- **Alert Interpretation**: Helps users understand what their alerts mean
- **General Cardiac Health Information**: Answers questions about heart health

### For Medical Professionals (Organization Dashboard)
- **Clinical Decision Support**: Provides evidence-based insights on patient ECG data
- **Pattern Recognition**: Helps identify potentially concerning patterns in the data
- **Patient Summary**: Can summarize a patient's current cardiac status
- **Medical Context**: Uses appropriate medical terminology while remaining clear

## Architecture

### Components

1. **AIChatSidebar Component** (`/components/AIChatSidebar.tsx`)
   - Reusable sidebar component with slide-in animation
   - Chat interface with message history
   - Responsive design (full-screen on mobile, 500px width on desktop)
   - Two variants: purple gradient (user) and blue gradient (medical professional)

2. **API Endpoint** (`/app/api/ai-chat/route.ts`)
   - POST endpoint that accepts messages and context
   - Integrates with Anthropic's Claude API
   - Context-aware prompt engineering
   - Different system prompts for users vs. medical professionals

### Data Flow

```
User Input → AIChatSidebar → /api/ai-chat → Claude API → Response → AIChatSidebar
                                  ↑
                            Context Data
                     (ECG, Alerts, Patient Info)
```

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed if you've set up the project. If not:

```bash
# User Dashboard
cd dashboard-next
npm install @anthropic-ai/sdk

# Organization Dashboard
cd dashboard-org
npm install @anthropic-ai/sdk
```

### 2. Configure API Key

1. Get your Anthropic API key from: https://console.anthropic.com/
2. Copy the environment file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

**Important**: Never commit `.env.local` to version control!

### 3. Run the Application

```bash
# User Dashboard
cd dashboard-next
npm run dev

# Organization Dashboard
cd dashboard-org
npm run dev
```

## Usage

### User Dashboard

1. Navigate to any dashboard page (main dashboard, activities, etc.)
2. Click the purple floating chat button in the bottom-right corner
3. Ask questions about your ECG data, alerts, or heart health
4. The AI has access to your current readings and recent alerts

**Example Questions:**
- "What do my current ECG readings mean?"
- "Explain my recent alerts"
- "What is HRV and why does it matter?"
- "Is my heart rate normal?"

### Organization Dashboard

1. Navigate to a patient's detail page
2. Click the blue floating chat button in the bottom-right corner
3. Ask clinical questions about the patient's data
4. The AI has access to patient info, current ECG data, and alerts

**Example Questions:**
- "Summarize this patient's current cardiac status"
- "What do the recent alerts indicate?"
- "Are there any concerning trends in the data?"
- "What should I monitor for this patient?"

## Context Provided to AI

### User Dashboard Context
- Current ECG readings (HR, HRV, signal quality)
- Recent alerts (last 5)
- Recent analysis records (last 3)
- User ID and device ID

### Organization Dashboard Context
- Patient information (name, age, medical history)
- Current ECG readings
- Recent alerts (last 10)
- Recent analysis records (last 5)
- Connection status

## Safety & Disclaimers

### User Dashboard
The AI assistant includes disclaimers that:
- It is not a replacement for professional medical advice
- Users should consult their healthcare provider for medical decisions
- It provides educational information only
- Concerning patterns should be discussed with a doctor

### Organization Dashboard
The clinical AI assistant:
- Positions itself as a clinical decision support tool
- Does not replace professional medical judgment
- Frames suggestions as considerations, not directives
- Emphasizes clinical correlation with patient presentation
- Reminds that all insights should be reviewed by qualified professionals

## Technical Details

### Model
- **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`)
- Max tokens: 1024 (users), 2048 (medical professionals)

### API Rate Limits
- Anthropic API rate limits apply
- Consider implementing client-side rate limiting for production

### Security Considerations
1. API key stored server-side only (never exposed to client)
2. API endpoint validates all inputs
3. Context data sanitized before sending to AI
4. Error handling prevents API key leakage

## Customization

### Changing the AI Model
Edit `/app/api/ai-chat/route.ts`:
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022', // Change model here
  max_tokens: 1024,
  // ...
});
```

### Modifying System Prompts
The system prompts are in `/app/api/ai-chat/route.ts`:
- User dashboard: Educational, supportive tone
- Organization dashboard: Clinical, professional tone

### Styling the Chat Button
The floating button can be styled in the page files:
- User dashboard: Purple gradient
- Organization dashboard: Blue gradient

## Troubleshooting

### "Invalid API key" Error
- Verify your API key is correctly set in `.env.local`
- Ensure the file is named exactly `.env.local` (not `.env`)
- Restart the dev server after changing environment variables

### Chat Button Not Appearing
- Check browser console for errors
- Verify the component is imported correctly
- Ensure z-index is high enough (default: 30)

### AI Not Responding
- Check API key is valid
- Verify network connectivity
- Check browser console and server logs for errors
- Ensure Anthropic API is not experiencing outages

## Files Modified/Created

### User Dashboard (`dashboard-next/`)
- `components/AIChatSidebar.tsx` - Chat sidebar component
- `app/api/ai-chat/route.ts` - API endpoint
- `app/dashboard/page.tsx` - Main dashboard integration
- `app/dashboard/activities/page.tsx` - Activities page integration
- `.env.local.example` - Environment variable template

### Organization Dashboard (`dashboard-org/`)
- `components/AIChatSidebar.tsx` - Chat sidebar component
- `app/api/ai-chat/route.ts` - API endpoint
- `app/dashboard/[patientId]/page.tsx` - Patient detail page integration
- `.env.local.example` - Environment variable template

## Future Enhancements

Potential improvements:
1. **Conversation History Persistence**: Store chat history in database
2. **Multi-language Support**: Translate responses to user's preferred language
3. **Voice Input**: Add speech-to-text for hands-free interaction
4. **Suggested Questions**: Dynamic suggestions based on current data
5. **Export Chat**: Allow users to download chat transcripts
6. **Analytics**: Track common questions and user satisfaction
7. **RAG Integration**: Add retrieval-augmented generation for medical literature
8. **Streaming Responses**: Show AI typing in real-time

## Cost Considerations

**Anthropic Pricing** (as of Nov 2025):
- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens

**Estimated Costs**:
- Average conversation: 10 messages
- Average message: ~200 tokens input, ~300 tokens output
- Cost per conversation: ~$0.006 (less than 1 cent)

For production, consider:
- Setting up usage monitoring
- Implementing rate limiting per user
- Caching common responses
- Using Claude Haiku for simpler queries to reduce costs

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Anthropic API documentation: https://docs.anthropic.com/
3. Check application logs for error details
4. Open an issue in the project repository
