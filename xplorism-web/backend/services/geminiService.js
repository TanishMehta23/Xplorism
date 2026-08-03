
/**
 * Calls Ollama API to generate structured itinerary JSON (Fallback)
 */
export const askOllamaForItinerary = async ({
  destination,
  startDate,
  endDate,
  budget,
  travelers,
  travelStyle,
  interests
}) => {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const primaryModel = process.env.OLLAMA_MODEL || 'llama3';
  
  const modelsToTry = [...new Set([
    primaryModel,
    'qwen3',
    'qwen2.5',
    'qwen',
    'llama3'
  ])];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

  const prompt = `You are an expert travel planner. Create a highly detailed and optimized travel itinerary for ${destination}.
Key Details:
- Duration: ${totalDays} days (from ${startDate} to ${endDate})
- Budget: ${budget} (per person or total, adapt appropriately for travel style)
- Travelers: ${travelers}
- Travel Style: ${travelStyle}
- Interests: ${interests.join(', ')}

For each day, suggest a realistic number of activities (typically between 3 to 6) depending on how much time each activity/attraction takes, so travelers can optimize their day and cover more tourist places if some stops are quick. Assign each activity to a 'time' category ("Morning", "Afternoon", or "Evening") depending on when it should be visited, and order them logically.
Provide realistic and famous local attractions or hidden gems fitting the travel style and interests.
Provide a rich description of the activity/location in the 'activity' field.

CRITICAL: Do not repeat the same attraction, place, landmark, or location on different days of the itinerary. Every day of the itinerary must feature completely unique places to visit.

You must return a JSON object conforming exactly to this schema:
{
  "resolvedName": "Cleaned Destination Name (e.g. Paris, France)",
  "itinerary": [
    {
      "day": 1,
      "time": "Morning", 
      "location": "Name of Attraction",
      "activity": "A detailed and engaging description of what to see or do there, along with relevant tips.",
      "estimatedCost": 150.00
    },
    {
      "day": 1,
      "time": "Afternoon",
      "location": "Name of Attraction",
      "activity": "...",
      "estimatedCost": 50.00
    },
    {
      "day": 1,
      "time": "Evening",
      "location": "Name of Attraction",
      "activity": "...",
      "estimatedCost": 200.00
    }
  ]
}

Only return the raw JSON object conforming to the schema above. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  const url = `${ollamaBaseUrl}/api/generate`;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (process.env.OLLAMA_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      console.log(`Attempting Ollama itinerary generation with model: ${model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let textResponse = data.response;
      let jsonStr = textResponse.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      
      const parsed = JSON.parse(jsonStr);
      console.log(`Successfully generated itinerary using Ollama model: ${model}`);
      return parsed;
    } catch (err) {
      console.warn(`Ollama itinerary generation failed for model ${model}: ${err.message}`);
      lastError = err;
    }
  }
  
  throw new Error(`Ollama itinerary generation failed on all models: ${lastError.message}`);
};

/**
 * Helper to call Gemini API with a specific model
 */
const callGeminiAPI = async (model, prompt, apiKey) => {
  const apiVersions = ['v1beta', 'v1'];
  let lastError = null;

  for (const apiVer of apiVersions) {
    try {
      const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
        throw new Error(`Invalid response structure`);
      }
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      lastError = e;
      console.log(`Failed querying Gemini model "${model}" with API version ${apiVer}: ${e.message}`);
    }
  }
  throw new Error(`Gemini API Error for model ${model}: ${lastError.message}`);
};

/**
 * Helper to call OpenAI-compatible APIs (Groq, OpenRouter)
 */
const callOpenAICompatibleAPI = async (endpoint, apiKey, model, prompt, isJson) => {
  const payload = {
    model: model,
    messages: [{ role: 'user', content: prompt }]
  };
  if (isJson) {
    payload.response_format = { type: 'json_object' };
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    throw new Error(`Invalid response structure`);
  }
  return data.choices[0].message.content;
};

/**
 * Get ordered unique list of Gemini models to try (primary + backups)
 */
const getGeminiModels = () => {
  const envModel = process.env.AI_MODEL ? process.env.AI_MODEL.split('/').pop() : null;
  const models = [];
  if (envModel) models.push(envModel);
  // Add 2-3 backup Gemini models
  models.push('gemini-2.0-flash');
  models.push('gemini-1.5-flash');
  models.push('gemini-1.5-pro');
  return [...new Set(models)];
};

/**
 * Calls Gemini API to generate structured itinerary JSON
 */
export const askGeminiForItinerary = async ({
  destination,
  startDate,
  endDate,
  budget,
  travelers,
  travelStyle,
  interests
}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

  const prompt = `You are an expert travel planner. Create a highly detailed and optimized travel itinerary for ${destination}.
Key Details:
- Duration: ${totalDays} days (from ${startDate} to ${endDate})
- Budget: ${budget} (per person or total, adapt appropriately for travel style)
- Travelers: ${travelers}
- Travel Style: ${travelStyle}
- Interests: ${interests.join(', ')}

For each day, suggest a realistic number of activities (typically between 3 to 6) depending on how much time each activity/attraction takes, so travelers can optimize their day and cover more tourist places if some stops are quick. Assign each activity to a 'time' category ("Morning", "Afternoon", or "Evening") depending on when it should be visited, and order them logically.
Provide realistic and famous local attractions or hidden gems fitting the travel style and interests.
Provide a rich description of the activity/location in the 'activity' field.

CRITICAL: Do not repeat the same attraction, place, landmark, or location on different days of the itinerary. Every day of the itinerary must feature completely unique places to visit.

You must return a JSON object conforming exactly to this schema:
{
  "resolvedName": "Cleaned Destination Name (e.g. Paris, France)",
  "itinerary": [
    {
      "day": 1,
      "time": "Morning", 
      "location": "Name of Attraction",
      "activity": "A detailed and engaging description of what to see or do there, along with relevant tips.",
      "estimatedCost": 150.00
    },
    {
      "day": 1,
      "time": "Afternoon",
      "location": "Name of Attraction",
      "activity": "...",
      "estimatedCost": 50.00
    },
    {
      "day": 1,
      "time": "Evening",
      "location": "Name of Attraction",
      "activity": "...",
      "estimatedCost": 200.00
    }
  ]
}

Only return the raw JSON object conforming to the schema above. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  let itineraryResult = null;

  // 1. Try Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const models = getGeminiModels();
    for (const model of models) {
      try {
        console.log(`Attempting itinerary generation with Gemini model: ${model}`);
        const textResponse = await callGeminiAPI(model, prompt, apiKey);
        
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        itineraryResult = JSON.parse(jsonStr);
        console.log(`Successfully generated itinerary using Gemini model: ${model}`);
        break; // Exit the model loop on success
      } catch (err) {
        console.warn(`Gemini itinerary generation failed for model ${model}: ${err.message}`);
      }
    }
  }

  // 2. Try Groq
  if (!itineraryResult && process.env.GROQ_API_KEY) {
    console.log('Gemini failed or missing. Attempting Groq cloud fallback...');
    const groqModels = ['qwen-2.5-coder-32k', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const model of groqModels) {
      try {
        console.log(`Attempting Groq itinerary generation with model: ${model}`);
        const textResponse = await callOpenAICompatibleAPI(
          'https://api.groq.com/openai/v1/chat/completions',
          process.env.GROQ_API_KEY,
          model,
          prompt,
          true
        );
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        itineraryResult = JSON.parse(jsonStr);
        console.log(`Successfully generated itinerary using Groq model: ${model}`);
        break;
      } catch (err) {
        console.warn(`Groq itinerary generation failed for model ${model}: ${err.message}`);
      }
    }
  }

  // 3. Try OpenRouter
  if (!itineraryResult && process.env.OPENROUTER_API_KEY) {
    console.log('Gemini and Groq failed or missing. Attempting OpenRouter cloud fallback...');
    const orModels = ['openrouter/free'];
    for (const model of orModels) {
      try {
        console.log(`Attempting OpenRouter itinerary generation with model: ${model}`);
        const textResponse = await callOpenAICompatibleAPI(
          'https://openrouter.ai/api/v1/chat/completions',
          process.env.OPENROUTER_API_KEY,
          model,
          prompt,
          true
        );
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        itineraryResult = JSON.parse(jsonStr);
        console.log(`Successfully generated itinerary using OpenRouter model: ${model}`);
        break;
      } catch (err) {
        console.warn(`OpenRouter itinerary generation failed for model ${model}: ${err.message}`);
      }
    }
  }

  if (itineraryResult) {
    return itineraryResult;
  }

  // Fallback to Ollama
  console.warn(`Gemini, Groq, and OpenRouter failed. Trying Ollama fallback.`);
  try {
    return await askOllamaForItinerary({
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      travelStyle,
      interests
    });
  } catch (ollamaErr) {
    console.warn(`Ollama fallback failed too (Error: ${ollamaErr.message}). Generating static itinerary for offline stability.`);
    const city = (destination || '').split(',')[0].trim();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const daysCount = Math.min(Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1), 30);
    
    const itineraries = [];
    const interestList = (interests && interests.length > 0) ? interests : ['Sightseeing', 'Local Food', 'Historical Architecture'];
    const dailyBudget = Math.round((budget || 50000) / daysCount);

    const morningLocs = [
      "Historic Old Town", "Central Botanical Gardens", "National Museum", "Imperial Palace Grounds",
      "Scenic Lakefront", "Heritage Cathedral", "Ancient Citadel", "Memorial Archway"
    ];
    const afternoonLocs = [
      "Cultural Center & Gallery", "Bustling Local Market", "Scenic Waterfront Harbor", "Shopping Boulevard",
      "Historic Fort Ruins", "Science Discovery Museum", "Traditional Food Street", "Modern Art District"
    ];
    const eveningLocs = [
      "Sunset Observation Deck", "Riverfront Promenade", "Central Plaza", "Grand Theatre District",
      "Night Food Street Market", "Skyline Observation Tower", "Celebration Square", "Cozy Coastal Walkway"
    ];

    const morningActs = [
      "Enjoy a quiet morning stroll observing historic architectural landmarks.",
      "Explore lush botanical exhibits and serene walking pathways.",
      "Discover ancient relics, historical exhibits, and localized archives.",
      "Walk through the beautifully landscaped royal palace grounds.",
      "Enjoy the serene morning breeze next to the scenic lake.",
      "Admire the exquisite stone carvings and architecture of the heritage cathedral.",
      "Hike up to the ancient stone fort and explore its history.",
      "Visit the iconic memorial archway and capture morning photos."
    ];
    const afternoonActs = [
      "Take an informative guided walk through the cultural museum.",
      "Engage with local merchants and sample regional street food favorites.",
      "Enjoy a pleasant harbor boat ride and watch ships sail by.",
      "Browse unique boutiques and pick up souvenirs and local goods.",
      "Wander around the ancient stone ruins and learn about their defensive history.",
      "Engage with interactive science exhibits and modern displays.",
      "Sample a variety of traditional regional dishes on a guided food tour.",
      "Appreciate contemporary art murals and street performances."
    ];
    const eveningActs = [
      "Watch the stunning golden sunset from the highest observation decks.",
      "Stroll along the riverfront while lights start reflecting on the water.",
      "Relax at a central cafe, listening to street musicians and local vibes.",
      "Attend a live cultural performance or local theater production.",
      "Indulge in a curated dinner menu highlighting local seasonal flavors.",
      "Behold the city skyline illuminated under the stars.",
      "Join the lively local evening festival and community dances.",
      "Enjoy a quiet, relaxing walk by the coast with soothing wave sounds."
    ];

    for (let day = 1; day <= daysCount; day++) {
      const idx = (day - 1) % 8;
      
      itineraries.push({
        day,
        time: "09:00 AM",
        activity: morningActs[idx],
        location: `${city} ${morningLocs[idx]}`,
        estimatedCost: Math.round(dailyBudget * 0.15)
      });
      
      const matchedInterest = interestList[day % interestList.length];
      itineraries.push({
        day,
        time: "02:00 PM",
        activity: `${afternoonActs[idx]} (Focusing on ${matchedInterest} interests).`,
        location: `${city} ${afternoonLocs[idx]}`,
        estimatedCost: Math.round(dailyBudget * 0.25)
      });
      
      itineraries.push({
        day,
        time: "06:30 PM",
        activity: eveningActs[idx],
        location: `${city} ${eveningLocs[idx]}`,
        estimatedCost: Math.round(dailyBudget * 0.20)
      });
    }

    return {
      destination,
      startDate,
      endDate,
      budget: budget || 50000,
      travelers: travelers || 1,
      travelStyle: travelStyle || 'Adventure',
      interests: interests || [],
      itinerary: itineraries
    };
  }
};;

/**
 * Calls Ollama API to get nearby places (Fallback)
 */
export const getNearbyPlacesFromOllama = async (destination) => {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const primaryModel = process.env.OLLAMA_MODEL || 'llama3';

  const modelsToTry = [...new Set([
    primaryModel,
    'qwen3',
    'qwen2.5',
    'qwen',
    'llama3'
  ])];

  const prompt = `You are an expert travel assistant. For the travel destination "${destination}", list 8 famous nearby tourist places, cities, national parks, or historic sites located within a 100 km radius.
Provide the approximate distance in kilometers and a short, engaging description for each.
You must return a JSON array conforming exactly to this schema:
[
  {
    "name": "Place Name",
    "distance": "Distance (e.g. '25 km')",
    "type": "Type of Place (e.g. 'Nature', 'Pilgrimage', 'Historical', 'Adventure')",
    "description": "Short description of what to see or do there."
  }
]

Only return the raw JSON array. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  const url = `${ollamaBaseUrl}/api/generate`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  if (process.env.OLLAMA_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      console.log(`Attempting Ollama nearby places generation with model: ${model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let textResponse = data.response;
      let jsonStr = textResponse.trim();
      const firstBrace = jsonStr.indexOf('[');
      const lastBrace = jsonStr.lastIndexOf(']');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(jsonStr);
      console.log(`Successfully generated nearby places using Ollama model: ${model}`);
      return parsed;
    } catch (err) {
      console.warn(`Ollama nearby places call failed for model ${model}: ${err.message}`);
      lastError = err;
    }
  }
  
  throw new Error(`Ollama nearby places call failed on all models: ${lastError.message}`);
};

/**
 * Calls Gemini API to get nearby places
 */
export const getNearbyPlacesFromGemini = async (destination) => {
  const prompt = `You are an expert travel assistant. For the travel destination "${destination}", list 8 famous nearby tourist places, cities, national parks, or historic sites located within a 100 km radius.
Provide the approximate distance in kilometers and a short, engaging description for each.
You must return a JSON array conforming exactly to this schema:
[
  {
    "name": "Place Name",
    "distance": "Distance (e.g. '25 km')",
    "type": "Type of Place (e.g. 'Nature', 'Pilgrimage', 'Historical', 'Adventure')",
    "description": "Short description of what to see or do there."
  }
]

Only return the raw JSON array. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  let nearbyResult = null;

  // 1. Try Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const models = getGeminiModels();
    for (const model of models) {
      try {
        console.log(`Attempting nearby places generation with Gemini model: ${model}`);
        const textResponse = await callGeminiAPI(model, prompt, apiKey);
        
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        nearbyResult = JSON.parse(jsonStr);
        console.log(`Successfully generated nearby places using Gemini model: ${model}`);
        break; // Exit the model loop on success
      } catch (err) {
        console.warn(`Gemini nearby places call failed for model ${model}: ${err.message}`);
      }
    }
  }

  // 2. Try Groq
  if (!nearbyResult && process.env.GROQ_API_KEY) {
    console.log('Gemini failed or missing. Attempting Groq cloud fallback for nearby places...');
    const groqModels = ['qwen-2.5-coder-32k', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const model of groqModels) {
      try {
        console.log(`Attempting Groq nearby places with model: ${model}`);
        const textResponse = await callOpenAICompatibleAPI(
          'https://api.groq.com/openai/v1/chat/completions',
          process.env.GROQ_API_KEY,
          model,
          prompt,
          false // nearby places returns a JSON list, we parse it as string first
        );
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        nearbyResult = JSON.parse(jsonStr);
        console.log(`Successfully generated nearby places using Groq model: ${model}`);
        break;
      } catch (err) {
        console.warn(`Groq nearby places failed for model ${model}: ${err.message}`);
      }
    }
  }

  // 3. Try OpenRouter
  if (!nearbyResult && process.env.OPENROUTER_API_KEY) {
    console.log('Gemini and Groq failed or missing. Attempting OpenRouter cloud fallback for nearby places...');
    const orModels = ['openrouter/free'];
    for (const model of orModels) {
      try {
        console.log(`Attempting OpenRouter nearby places with model: ${model}`);
        const textResponse = await callOpenAICompatibleAPI(
          'https://openrouter.ai/api/v1/chat/completions',
          process.env.OPENROUTER_API_KEY,
          model,
          prompt,
          false
        );
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        nearbyResult = JSON.parse(jsonStr);
        console.log(`Successfully generated nearby places using OpenRouter model: ${model}`);
        break;
      } catch (err) {
        console.warn(`OpenRouter nearby places failed for model ${model}: ${err.message}`);
      }
    }
  }

  if (nearbyResult) {
    return nearbyResult;
  }

  // Fallback to Ollama
  console.warn(`Gemini, Groq, and OpenRouter failed. Trying Ollama fallback.`);
  try {
    return await getNearbyPlacesFromOllama(destination);
  } catch (ollamaErr) {
    console.warn(`Ollama fallback failed too (Error: ${ollamaErr.message}). Generating mock local places for stability.`);
    const city = (destination || '').split(',')[0].trim();
    return [
      {
        name: `${city} City Center`,
        distance: "2 km",
        type: "Historical",
        description: `Explore the vibrant historical streets, architecture, and local culture of ${city}.`
      },
      {
        name: `${city} Royal Gardens`,
        distance: "5 km",
        type: "Nature",
        description: "Stunning landscaped royal gardens offering peaceful pathways, fountains, and exotic flora."
      },
      {
        name: "National Heritage Museum",
        distance: "8 km",
        type: "Historical",
        description: "An exceptional curation of traditional art, weaponry, relics, and regional history."
      },
      {
        name: "Scenic Lake Sanctuary",
        distance: "12 km",
        type: "Nature",
        description: "A serene lake sanctuary home to migratory birds, boating facilities, and scenic nature paths."
      },
      {
        name: "Adventure Hills Park",
        distance: "20 km",
        type: "Adventure",
        description: "High altitude trekking paths, zip-lining, rock climbing, and spectacular panoramic views."
      },
      {
        name: "Shri Dev Mandir",
        distance: "15 km",
        type: "Pilgrimage",
        description: "A gorgeous white-marble temple complex famous for its peaceful spirituality and evening prayers."
      },
      {
        name: "Old Fort Ruins",
        distance: "28 km",
        type: "Historical",
        description: "Ancient stone fortress ruins offering breathtaking historic stone archways and photo opportunities."
      },
      {
        name: "Grand Bazaar Market",
        distance: "3 km",
        type: "Shopping",
        description: "Vibrant traditional shopping lanes full of locally crafted artifacts, textiles, and delicious street food stalls."
      }
    ];
  }
};;

