# Vercel AI SDK - Implementation Guide for Clarifying Questions Feature

## Project Context
Building a clarifying questions feature for a feature request system using Vercel AI SDK. The feature will:
- Generate clarifying questions from AI analysis of feature requests
- Stream AI reasoning/thinking to the UI
- Collect user answers via radio buttons + custom text input
- Display loading state with streaming analysis
- Persist Q&A to database

---

## Core Technologies & Versions

- **Vercel AI SDK**: v5+ / v6 (latest, as of Jan 2026)
- **React Hooks**: `useChat`, `useCompletion` (from `@ai-sdk/react`)
- **Streaming Protocol**: Server-Sent Events (SSE) standard
- **Framework Support**: React, Next.js, Vue, Svelte, Angular all supported equally

---

## Part 1: Streaming Text & UI Fundamentals

### 1.1 Server-Side Text Streaming with `streamText`

**Documentation**: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text

The `streamText` function streams text generation from any language model:

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    // Add provider-specific options below
  });

  return result.toDataStreamResponse();
}
```

**Key Properties:**
- `result.textStream` - async iterable of text chunks
- `result.fullStream` - all stream parts including tool calls
- `result.text` - promise that resolves to full text when done
- `result.usage` - token usage (input/output tokens)
- `result.finishReason` - why generation stopped ('stop', 'length', 'tool-calls', 'error', etc.)

**Return Type**: Automatically converts to SSE format with `.toDataStreamResponse()` for browser compatibility.

---

### 1.2 Client-Side Streaming with `useChat` Hook

**Documentation**: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

The `useChat` hook manages chat state and automatically handles streaming from your API route:

```typescript
// app/page.tsx
'use client';
import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    // Optional: lifecycle callbacks
    onFinish(message) {
      console.log('Stream finished:', message);
    },
  });

  return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input 
          value={input} 
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

**Key Properties:**
- `messages` - array of all messages (auto-updated as stream arrives)
- `input` - current input value
- `handleInputChange(e)` - event handler for input changes
- `handleSubmit(e)` - handles form submission, sends to API
- `isLoading` - true while streaming
- `stop()` - abort current stream
- `reload()` - resend last message

**Lifecycle Callbacks** (optional):
```typescript
const { messages, input, handleInputChange, handleSubmit } = useChat({
  onFinish: (message) => { /* called when stream ends */ },
  onError: (error) => { /* called on error */ },
});
```

---

### 1.3 Real-Time Text Streaming to UI

Simply rendering the `messages` array automatically displays streaming text as it arrives:

```typescript
{messages.map(msg => (
  <div key={msg.id}>
    <strong>{msg.role}:</strong> 
    <span>{msg.content}</span>  {/* Updates in real-time */}
  </div>
))}
```

**For Custom Streaming Display** (e.g., typewriter effect):

```typescript
// components/StreamingText.tsx
'use client';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <div className="streaming-text">
      {content}
      {isStreaming && <span className="cursor">|</span>}
    </div>
  );
}

// Usage
const lastMessage = messages[messages.length - 1];
<StreamingText 
  content={lastMessage?.content || ''} 
  isStreaming={isLoading}
/>
```

---

## Part 2: Extended Thinking / Reasoning Streams

### 2.1 Enable Extended Thinking (Claude & Gemini)

**For Claude** (Anthropic):

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 8192,  // max thinking tokens
          includeThoughts: true, // expose thinking to client
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

**For Google Gemini**:

```typescript
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

const result = streamText({
  model: google('gemini-2.5-flash'),
  messages,
  providerOptions: {
    google: {
      thinkingConfig: {
        type: 'enabled',
        thinkingBudget: 8192,  // thinking tokens
        includeThoughts: true,
      },
    },
  },
});
```

**Documentation**:
- Claude thinking: https://platform.claude.com/docs/en/guides/extended-thinking
- Gemini thinking: https://ai.google.dev/gemini-2/docs/thinking-experimental

---

### 2.2 Stream Reasoning to Client

The thinking/reasoning appears in the text stream as a separate `MessagePart` object:

```typescript
// Type structure (automatic from AI SDK)
{
  type: 'thinking',  // or 'text'
  text: 'The user is asking for clarification...'
}
```

Access reasoning in your client component:

```typescript
'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ChatWithReasoning() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const [expandedReasoningId, setExpandedReasoningId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Auto-expand reasoning for the current streaming message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && isLoading) {
      setExpandedReasoningId(prev => ({
        ...prev,
        [lastMessage.id]: true,
      }));
    }
  }, [messages, isLoading]);

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {/* Handle thinking parts */}
          {Array.isArray(message.content) && message.content.map((part, idx) => {
            if (typeof part === 'object' && part.type === 'thinking') {
              return (
                <div key={idx} className="reasoning-block">
                  <button
                    onClick={() => setExpandedReasoningId(prev => ({
                      ...prev,
                      [message.id]: !prev[message.id],
                    }))}
                  >
                    {expandedReasoningId[message.id] ? '▼' : '▶'} Thinking
                  </button>
                  {expandedReasoningId[message.id] && (
                    <div className="reasoning-content">{part.text}</div>
                  )}
                </div>
              );
            }
            // Handle text parts
            if (typeof part === 'object' && part.type === 'text') {
              return <p key={idx}>{part.text}</p>;
            }
            return <p key={idx}>{part}</p>;
          })}
          
          {/* Fallback for string content */}
          {typeof message.content === 'string' && (
            <p>{message.content}</p>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input 
          value={input} 
          onChange={handleInputChange}
          placeholder="Your message..."
        />
        <button disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

---

## Part 3: Tool Calling for Interactive Questions

### 3.1 Define Tools for Generating & Asking Questions

**Documentation**: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

Create a tool that the AI can call to generate clarifying questions:

```typescript
// lib/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const clarifyingQuestionsTool = tool({
  description: 'Generate clarifying questions to better understand a feature request',
  inputSchema: z.object({
    questions: z.array(
      z.object({
        id: z.string(),
        question: z.string().describe('The full question text'),
        options: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          })
        ).describe('Pre-suggested options for the user'),
        allowCustom: z.boolean().optional().describe('Allow user to provide custom answer'),
      })
    ),
  }),
  execute: async ({ questions }) => {
    // This is called when the AI invokes the tool
    // Return structured data for storage
    return {
      success: true,
      questionsGenerated: questions.length,
      timestamp: new Date(),
    };
  },
});
```

---

### 3.2 Configure Model to Use Tools

**Server-side API route**:

```typescript
// app/api/clarify/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { clarifyingQuestionsTool } from '@/lib/tools';

export async function POST(req: Request) {
  const { featureRequest } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [
      {
        role: 'user',
        content: `Analyze this feature request and generate clarifying questions:

${featureRequest}

Generate 2-4 specific clarifying questions with 2-3 suggested options each to help understand the requirements better.`,
      },
    ],
    tools: {
      generateClarifyingQuestions: clarifyingQuestionsTool,
    },
    // Force the model to generate questions via tool
    toolChoice: 'required',
  });

  return result.toDataStreamResponse();
}
```

---

### 3.3 Handle Tool Calls on Client

```typescript
'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ClarifyRequest() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/clarify',
    onToolCall: async ({ toolName, toolCallId, args }) => {
      if (toolName === 'generateClarifyingQuestions') {
        // Handle the tool call
        console.log('AI generated questions:', args.questions);
        // Display questions in UI
        setQuestions(args.questions);
      }
    },
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return (
    <div>
      {/* Display generated questions */}
      {questions.map(q => (
        <div key={q.id}>
          <h3>{q.question}</h3>
          {q.options.map(opt => (
            <label key={opt.value}>
              <input
                type="radio"
                name={q.id}
                value={opt.value}
                checked={answers[q.id] === opt.value}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              />
              {opt.label}
            </label>
          ))}
          {q.allowCustom && (
            <input
              type="text"
              placeholder="Other answer..."
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
      
      <button onClick={() => submitAnswers()}>Save & Continue</button>
    </div>
  );
}
```

---

## Part 4: Multiple Models & Provider Configuration

### 4.1 Model Selector Dropdown

Support multiple AI providers:

```typescript
// lib/models.ts
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { mistral } from '@ai-sdk/mistral';

export const models = {
  'claude-3.5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  'claude-4': anthropic('claude-4-20250514'),
  'gemini-2.5-flash': google('gemini-2.5-flash'),
  'gpt-4o': openai('gpt-4o'),
  'mistral-large': mistral('mistral-large-latest'),
} as const;

export type ModelId = keyof typeof models;
```

**API Route with Model Selection**:

```typescript
// app/api/clarify/route.ts
import { models, type ModelId } from '@/lib/models';

export async function POST(req: Request) {
  const { featureRequest, selectedModel } = await req.json();

  // Get model from selector
  const model = models[selectedModel as ModelId];

  const result = streamText({
    model,
    messages: [{ /* ... */ }],
    tools: { /* ... */ },
  });

  return result.toDataStreamResponse();
}
```

---

### 4.2 Provider-Specific Options

Each provider has unique options. Examples:

**Anthropic (Claude)**:
```typescript
providerOptions: {
  anthropic: {
    thinking: { type: 'enabled', budgetTokens: 8192 },
    cacheControl: { type: 'ephemeral' }, // Prompt caching
  },
}
```

**Google (Gemini)**:
```typescript
providerOptions: {
  google: {
    thinkingConfig: { type: 'enabled', thinkingBudget: 8192 },
  },
}
```

**OpenAI**:
```typescript
providerOptions: {
  openai: {
    reasoningEffort: 'medium', // 'low', 'medium', 'high'
  },
}
```

---

## Part 5: Custom Streaming Analysis Display

### 5.1 Show Loading State with Streaming Analysis

Create a custom prompt that makes the AI show its analysis step-by-step:

```typescript
// app/api/analyze/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { featureRequest } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [
      {
        role: 'user',
        content: `Please analyze this feature request step by step:

${featureRequest}

Show your analysis process:
1. Initial understanding of the request
2. Files/components that would be affected (list them as you think)
3. Ambiguities or missing details found
4. Confidence score (1-5) on request clarity
5. Recommended clarifying questions

Format each section with a clear heading.`,
      },
    ],
    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 10000,
          includeThoughts: true,
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

**Display on Client**:

```typescript
'use client';
import { useChat } from '@ai-sdk/react';

export default function AnalysisLoader() {
  const { messages, isLoading } = useChat({ api: '/api/analyze' });

  const lastMessage = messages[messages.length - 1];
  const analysis = lastMessage?.content || '';

  return (
    <div className="analysis-container">
      {isLoading && <div className="loading-spinner">Analyzing...</div>}
      <div className="analysis-content">
        {analysis}
      </div>
    </div>
  );
}
```

---

## Part 6: Database Persistence

### 6.1 Schema for Clarification Q&A

```typescript
// lib/db-schema.ts (example with Prisma)
model FeatureRequest {
  id                String    @id @default(cuid())
  title             String
  description       String
  createdAt         DateTime  @default(now())
  
  // Clarification fields
  clarificationStatus  String?  // 'pending' | 'completed' | 'skipped'
  clarificationModel   String?  // which model was used
  clarificationAnalysis Json?   // AI's analysis findings
  clarificationQuestions Json?  // array of questions generated
  clarificationAnswers  Json?   // user's answers
  
  // Other fields...
}
```

### 6.2 Save Answers to Database

```typescript
// app/api/save-answers/route.ts
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const { featureRequestId, answers, model, analysis } = await req.json();

  const updated = await db.featureRequest.update({
    where: { id: featureRequestId },
    data: {
      clarificationAnswers: answers,
      clarificationModel: model,
      clarificationAnalysis: analysis,
      clarificationStatus: 'completed',
    },
  });

  return Response.json({ success: true, data: updated });
}
```

---

## Part 7: Advanced Features

### 7.1 Auto-Skip if Request is Detailed Enough

```typescript
// Helper to calculate request clarity score
function calculateClarityScore(request: string): number {
  let score = 0;
  
  // Check for acceptance criteria
  if (request.match(/acceptance criteri|should|must/i)) score += 1;
  
  // Check for context
  if (request.length > 500) score += 1;
  
  // Check for specific requirements
  if (request.match(/user flow|api|database|schema/i)) score += 1;
  
  // Check for priority
  if (request.match(/priority|important|urgent/i)) score += 1;
  
  // Check for acceptance/definition of done
  if (request.match(/done|complete|finished|success/i)) score += 1;
  
  return Math.min(score, 5);
}

// In your API route
const clarityScore = calculateClarityScore(featureRequest);
if (clarityScore >= 4) {
  return Response.json({
    status: 'skipped',
    message: 'Request is detailed enough',
    score: clarityScore,
  });
}
```

### 7.2 Re-run Clarification (Overwrite Previous)

```typescript
// app/api/clarify/route.ts
export async function POST(req: Request) {
  const { featureRequestId, featureRequest, selectedModel } = await req.json();

  // Previous answers/questions get overwritten
  const result = streamText({
    // ... configuration
  });

  return result.toDataStreamResponse();
}
```

---

## Key Documentation Links for Your AI Agent

**Core APIs:**
- https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

**Thinking/Reasoning:**
- https://ai-sdk.dev/docs/guides/extended-thinking
- https://platform.claude.com/docs/en/guides/extended-thinking
- https://ai.google.dev/gemini-2/docs/thinking-experimental

**Providers:**
- Anthropic: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- Google: https://ai-sdk.dev/providers/ai-sdk-providers/google
- OpenAI: https://ai-sdk.dev/providers/ai-sdk-providers/openai
- Mistral: https://ai-sdk.dev/providers/ai-sdk-providers/mistral

**Advanced:**
- Agents: https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk
- Tool Calling: https://vercel.com/academy/ai-sdk/tool-use
- Streaming Responses: https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/

**Troubleshooting:**
- Community: https://community.vercel.com
- GitHub Issues: https://github.com/vercel/ai/issues

---

## Implementation Checklist for Your AI Agent

- [ ] Set up `streamText` API route for basic text generation
- [ ] Add `useChat` hook to React component for client-side streaming
- [ ] Enable extended thinking/reasoning for your chosen model(s)
- [ ] Add tool for clarifying questions generation
- [ ] Implement question display with radio buttons + custom input
- [ ] Add model selector dropdown with environment variables
- [ ] Implement database schema for Q&A persistence
- [ ] Add clarity scoring for auto-skip logic
- [ ] Create collapsible reasoning display
- [ ] Add "Save & Continue" button to persist answers
- [ ] Test with all supported models (Claude, Gemini, GPT-4o)
- [ ] Set up error handling and edge cases
- [ ] Deploy to Vercel with environment variables

---

## Example Environment Variables

```bash
# .env.local

# Anthropic
ANTHROPIC_API_KEY=sk_ant_...

# Google
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# OpenAI
OPENAI_API_KEY=sk_...

# Mistral
MISTRAL_API_KEY=...

# Your app database
DATABASE_URL=postgresql://...
```

---

**Last Updated**: January 18, 2026  
**Vercel AI SDK Version**: v5+ / v6  
**Status**: Production-Ready Implementation Guide
