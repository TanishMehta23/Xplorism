import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY || '';
const isValidGeminiKey = geminiKey.startsWith('AIza');
const genAI = isValidGeminiKey ? new GoogleGenerativeAI(geminiKey) : null;

let rawModelName = process.env.AI_MODEL || 'gemini-1.5-flash';
let modelName = rawModelName.startsWith('gemini/') ? rawModelName.substring(7) : rawModelName;
if (modelName === 'gemini-3.5-flash') {
  modelName = 'gemini-1.5-flash';
}

export const SYSTEM_PROMPT = `You are Xplorism AI, an intelligent, helpful travel assistant for the Xplorism platform.
Help users discover destinations, plan trips, explore attractions, and estimate travel budgets with clean markdown formatting.

CRITICAL CURRENCY INSTRUCTION:
Always state all budgets, prices, hotel rates, meals, transport, and overall costs in the LOCAL / NATIVE CURRENCY of the destination place asked by the user:
- For India destinations (e.g. Ayodhya, Goa, Manali, Kashmir, Delhi, Mumbai, Varanasi, Jaipur, Kerala, Agra, etc.): Always use Indian Rupee (₹ / INR). (e.g. ₹1,500/day, ₹3,500/night). Never use USD ($) as the primary currency for Indian domestic destinations.
- For Japan (Tokyo, Kyoto, Osaka, etc.): Use Japanese Yen (¥ / JPY).
- For Eurozone destinations (Paris, Rome, Barcelona, Madrid, Berlin, Amsterdam, Vienna, etc.): Use Euro (€ / EUR).
- For UK destinations (London, Edinburgh, Manchester, etc.): Use British Pound (£ / GBP).
- For UAE (Dubai, Abu Dhabi, etc.): Use UAE Dirham (AED).
- For Thailand (Bangkok, Phuket, Chiang Mai, etc.): Use Thai Baht (฿ / THB).
- For Singapore: Use Singapore Dollar (S$ / SGD).
- For USA: Use US Dollar ($ / USD).
- For Canada: Use Canadian Dollar (C$ / CAD).
- For Australia: Use Australian Dollar (A$ / AUD).
- For Switzerland: Use Swiss Franc (CHF).
You may optionally add approximate USD equivalent in parentheses (e.g. "₹3,500 (~$42 USD)"), but the PRIMARY numbers, headers, and tables must always match the destination's native local currency.

CRITICAL SCOPE RESTRICTION: You are strictly limited to travel-related inquiries, trip planning, destinations, weather, hotels, attractions, itineraries, budgets, and Xplorism platform features/data.
If a user asks about anything unrelated (e.g. general programming, math, science, politics, unrelated general definitions), politely decline.

Use Xplorism's retrieved knowledge (RAG context) whenever available.
Keep responses concise, conversational, and nicely organized with markdown tables and bullet points.`;

const chatModel = genAI ? genAI.getGenerativeModel({ 
  model: modelName,
  systemInstruction: SYSTEM_PROMPT
}) : null;

const embeddingModel = genAI ? genAI.getGenerativeModel({ model: 'text-embedding-004' }) : null;

// Define tools function declarations for Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: 'searchDestinations',
        description: 'Search for travel destinations in Xplorism. Returns matching destinations.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Keyword or city name' }
          },
          required: ['query']
        }
      },
      {
        name: 'getWeather',
        description: 'Get current live weather forecast for a destination.',
        parameters: {
          type: 'OBJECT',
          properties: {
            city: { type: 'STRING', description: 'City/destination name' }
          },
          required: ['city']
        }
      },
      {
        name: 'searchHotels',
        description: 'Find hotel recommendations in a specific city with local currency pricing.',
        parameters: {
          type: 'OBJECT',
          properties: {
            city: { type: 'STRING', description: 'City name' }
          },
          required: ['city']
        }
      },
      {
        name: 'getUserPreferences',
        description: 'Fetch the active profile preferences for the traveler (budget, interests, style).',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'getUserTrips',
        description: 'Retrieve the active user\'s list of planned or saved trips.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'saveTrip',
        description: 'Save a planned trip to the user\'s profile.',
        parameters: {
          type: 'OBJECT',
          properties: {
            destination: { type: 'STRING', description: 'Trip destination' },
            startDate: { type: 'STRING', description: 'Start date in YYYY-MM-DD' },
            endDate: { type: 'STRING', description: 'End date in YYYY-MM-DD' },
            budget: { type: 'NUMBER', description: 'Estimated budget value' },
            travelers: { type: 'INTEGER', description: 'Number of travelers' },
            travelStyle: { type: 'STRING', description: 'Style (e.g. adventure, luxury, budget)' },
            itinerary: {
              type: 'ARRAY',
              description: 'Array of activities',
              items: {
                type: 'OBJECT',
                properties: {
                  day: { type: 'INTEGER' },
                  time: { type: 'STRING' },
                  activity: { type: 'STRING' },
                  location: { type: 'STRING' }
                },
                required: ['day', 'time', 'activity', 'location']
              }
            }
          },
          required: ['destination', 'startDate', 'endDate', 'budget', 'travelers', 'travelStyle', 'itinerary']
        }
      }
    ]
  }
];

export async function generateTextEmbedding(text) {
  if (embeddingModel) {
    try {
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.warn('[Gemini Service] Error generating embedding via Gemini:', error.message);
    }
  }
  // Fast 768-dim deterministic fallback embedding
  const vector = new Array(768).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vector[i % 768] = (vector[i % 768] + (code / 255.0)) % 1.0;
  }
  return vector;
}

export async function callGroqChat(history, currentMessage, ragContext = '', modelOverride = null) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const groqModels = [
    modelOverride || (process.env.GROQ_MODEL && !process.env.GROQ_MODEL.startsWith('openai/') ? process.env.GROQ_MODEL : 'qwen/qwen3.6-27b'),
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ];

  const messages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  let promptText = currentMessage;
  if (ragContext) {
    promptText = `[Context Data]:\n${ragContext}\n\n[User Message]:\n${currentMessage}`;
  }

  messages.push({
    role: 'user',
    content: promptText
  });

  for (const model of groqModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: SYSTEM_PROMPT
            },
            ...messages
          ]
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (content) {
          return {
            message: content,
            functionCalls: null
          };
        }
      }
    } catch (e) {
      console.warn(`[Groq Chat] Attempt with model ${model} failed:`, e.message);
    }
  }

  throw new Error('All Groq models failed');
}

export async function callOpenRouterChat(history, currentMessage, ragContext = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const models = [
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat',
    'openrouter/free'
  ];

  const messages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  let promptText = currentMessage;
  if (ragContext) {
    promptText = `[Context Data]:\n${ragContext}\n\n[User Message]:\n${currentMessage}`;
  }

  messages.push({
    role: 'user',
    content: promptText
  });

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: SYSTEM_PROMPT
            },
            ...messages
          ]
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (content) {
          return {
            message: content,
            functionCalls: null
          };
        }
      }
    } catch (e) {
      console.warn(`[OpenRouter Chat] Attempt with model ${model} failed:`, e.message);
    }
  }

  throw new Error('All OpenRouter models failed');
}

export async function callOllamaChat(history, currentMessage, ragContext = '') {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const modelName = process.env.OLLAMA_MODEL || 'qwen2.5';

  const messages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  let promptText = currentMessage;
  if (ragContext) {
    promptText = `[Context Data]:\n${ragContext}\n\n[User Message]:\n${currentMessage}`;
  }

  messages.push({
    role: 'user',
    content: promptText
  });

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      stream: false
    }),
    signal: AbortSignal.timeout(1500)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error: status ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return {
    message: data.message?.content || '',
    functionCalls: null
  };
}

export async function callGeminiChat(history, currentMessage, ragContext = '') {
  // If valid Gemini client is available, try it
  if (chatModel) {
    try {
      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      let promptText = currentMessage;
      if (ragContext) {
        promptText = `[RAG Context / Verified Xplorism Data]:\n${ragContext}\n\n[User Message]:\n${currentMessage}`;
      }

      contents.push({
        role: 'user',
        parts: [{ text: promptText }]
      });

      const result = await chatModel.generateContent({
        contents,
        tools
      });

      const response = result.response;
      const functionCalls = response.functionCalls();
      
      return {
        message: response.text() || '',
        functionCalls: functionCalls || null,
        rawContent: response.candidates?.[0]?.content || null
      };
    } catch (error) {
      console.warn('[Gemini Service] Gemini chat failed. Falling back to Groq/OpenRouter:', error.message);
    }
  }

  // Fast Cloud Provider: Groq (ultra-fast sub-second latency)
  try {
    return await callGroqChat(history, currentMessage, ragContext);
  } catch (groqError) {
    console.warn('[Gemini Service] Groq fallback failed. Falling back to OpenRouter:', groqError.message);
    try {
      return await callOpenRouterChat(history, currentMessage, ragContext);
    } catch (openRouterError) {
      console.warn('[Gemini Service] OpenRouter fallback failed. Falling back to Ollama:', openRouterError.message);
      try {
        return await callOllamaChat(history, currentMessage, ragContext);
      } catch (ollamaError) {
        console.error('[Gemini Service] All AI engines failed:', ollamaError.message);
        
        let fallbackMessage = "I apologize, but all AI services are currently experiencing high demand. Please check your internet connection or try again in a moment.";
        if (ragContext) {
          fallbackMessage = `I'm currently operating in offline/fallback mode. Based on my knowledge base, here is some relevant information:\n\n${ragContext}`;
        }
        
        return {
          message: fallbackMessage,
          functionCalls: null,
          rawContent: null
        };
      }
    }
  }
}

/**
 * Single-pass synthesis of tool results into a friendly final response with local currency enforcement
 */
export async function sendToolResponses(history, currentMessage, modelRawContent, executedTools = []) {
  if (chatModel && modelRawContent && executedTools.length > 0) {
    try {
      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      contents.push({
        role: 'user',
        parts: [{ text: currentMessage }]
      });

      contents.push(modelRawContent);

      const functionResponseParts = executedTools.map(t => ({
        functionResponse: {
          name: t.name,
          response: { result: t.result || t.error || 'Done' }
        }
      }));

      contents.push({
        role: 'user',
        parts: functionResponseParts
      });

      const result = await chatModel.generateContent({
        contents,
        tools
      });

      const text = result.response.text();
      if (text) {
        return { message: text };
      }
    } catch (geminiToolErr) {
      console.warn('[Gemini Service] Multi-tool Gemini response failed, falling back to fast cloud synthesis:', geminiToolErr.message);
    }
  }

  // Fast Cloud synthesis via Groq / OpenRouter
  const toolSummary = executedTools.map(t => `Tool "${t.name}" result:\n${JSON.stringify(t.result || t.error, null, 2)}`).join('\n\n');
  const context = `[Live System Data / Tool Results]:\n${toolSummary}\n\nUsing the above real-time data, provide a friendly, structured response. Reminder: Quote all prices and budget breakdowns in the local destination currency (e.g. ₹ INR for Indian destinations like Ayodhya, Goa, Manali; ¥ JPY for Japan; € EUR for Europe, etc.).`;

  try {
    return await callGroqChat(history, currentMessage, context);
  } catch (groqErr) {
    try {
      return await callOpenRouterChat(history, currentMessage, context);
    } catch (orErr) {
      return {
        message: `Here is the requested travel information:\n\n` + executedTools.map(t => `**${t.name}**:\n${JSON.stringify(t.result || t.error, null, 2)}`).join('\n\n')
      };
    }
  }
}

export async function sendToolResponse(history, currentMessage, modelRawContent, toolName, toolResult) {
  return await sendToolResponses(history, currentMessage, modelRawContent, [{ name: toolName, result: toolResult }]);
}
