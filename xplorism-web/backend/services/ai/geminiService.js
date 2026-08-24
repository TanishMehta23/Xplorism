import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
let rawModelName = process.env.AI_MODEL || 'gemini-3.5-flash';
let modelName = rawModelName.startsWith('gemini/') ? rawModelName.substring(7) : rawModelName;
if (modelName === 'gemini-1.5-flash' || modelName === 'gemini-2.5-flash') {
  modelName = 'gemini-3.5-flash';
}

const chatModel = genAI.getGenerativeModel({ 
  model: modelName,
  systemInstruction: `You are Xplorism AI, an intelligent travel assistant for the Xplorism platform.
Help users discover destinations, plan trips, explore attractions and make better travel decisions.

CRITICAL: You are strictly limited to travel-related inquiries, trip planning, destinations, weather, hotels, attractions, itineraries, and Xplorism platform features/data.
If a user asks about anything else (e.g. general programming, math, science, politics, general history unrelated to travel destinations, general definitions, etc.), you must decline to answer. Politely state: "I am sorry, but I am only trained to assist with travel planning, itineraries, destinations, weather, hotels, and Xplorism platform services. I cannot help with other topics."

Use Xplorism's retrieved knowledge (RAG context) whenever available.
Use tools whenever current, live, or user-specific information is required.
Never invent prices, weather conditions, hotel availability, opening hours or other dynamic information.
If information is unavailable, clearly say that it is unavailable rather than making it up.

Keep responses useful, conversational, and reasonably concise.
When creating itineraries, follow a structured format:
Day X
* Morning
* Afternoon
* Evening

Consider destination, duration, budget, interests, transportation, and user preferences when available.
When recommending places, explain briefly why they are suitable.
When information comes from an external API, treat it as current external information.
When information comes from Xplorism's knowledge base, use it as the primary source for Xplorism-specific facts.`
});

const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

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
        description: 'Find hotel recommendations in a specific city.',
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
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('[Gemini Service] Error generating embedding:', error);
    throw error;
  }
}

export async function callGroqChat(history, currentMessage, ragContext = '', modelOverride = null) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const groqModels = [modelOverride || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', 'llama-3.3-70b-versatile', 'llama3-8b-8192'];

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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: groqModels[0],
      messages: [
        { role: 'system', content: 'You are Xplorism AI, an intelligent travel assistant.' },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq error: status ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return {
    message: data.choices[0]?.message?.content || '',
    functionCalls: null
  };
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
        { role: 'system', content: 'You are Xplorism AI, an intelligent travel assistant.' },
        ...messages
      ],
      stream: false
    })
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
      rawContent: response.candidates[0].content
    };
  } catch (error) {
    console.warn('[Gemini Service] Gemini chat failed. Falling back to Groq:', error.message);
    try {
      return await callGroqChat(history, currentMessage, ragContext);
    } catch (groqError) {
      console.warn('[Gemini Service] Groq fallback failed. Falling back to Ollama:', groqError.message);
      try {
        return await callOllamaChat(history, currentMessage, ragContext);
      } catch (ollamaError) {
        console.error('[Gemini Service] All AI fallbacks failed:', ollamaError.message);
        
        const fallbackModels = ['llama-3.3-70b-versatile', 'llama3-8b-8192'];
        
        let fallbackMessage = "I apologize, but all AI services are currently unavailable. Please check your internet connection or try again later.";
        
        if (ragContext) {
          fallbackMessage = `I'm currently operating in offline/fallback mode due to high server demand. Based on my knowledge base, here is some relevant information:\n\n${ragContext}`;
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

export async function sendToolResponse(history, currentMessage, modelRawContent, toolName, toolResult) {
  try {
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: currentMessage }]
    });

    // Provide the original raw model response content (contains thought signature + function call)
    if (modelRawContent) {
      contents.push(modelRawContent);
    }

    contents.push({
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: toolName,
            response: { result: toolResult }
          }
        }
      ]
    });

    const result = await chatModel.generateContent({
      contents,
      tools
    });

    return {
      message: result.response.text() || ''
    };
  } catch (error) {
    console.error('[Gemini Service] Tool response handling failed:', error);
    console.warn('[Gemini Service] Falling back to Groq for tool response...');
    try {
      const toolContext = `[Tool Result for ${toolName}]:\n${JSON.stringify(toolResult, null, 2)}`;
      return await callGroqChat(history, currentMessage, toolContext);
    } catch (groqError) {
      console.warn('[Gemini Service] Groq tool fallback failed. Falling back to Ollama for tool response...');
      try {
        return await callOllamaChat(history, currentMessage, toolContext);
      } catch (ollamaError) {
        console.error('[Gemini Service] All AI fallbacks failed for tool response:', ollamaError.message);
        return {
          message: `I'm currently operating in offline/fallback mode. The action was successful, here are the raw results for ${toolName}:\n\n\`\`\`json\n${JSON.stringify(toolResult, null, 2)}\n\`\`\``
        };
      }
    }
  }
}
