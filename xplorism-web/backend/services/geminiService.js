
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
};

/**
 * Calls Gemini API to generate a packing list
 */
export const askGeminiForPackingList = async ({
  destination,
  daysCount,
  weatherTemp,
  weatherCondition,
  travelStyle,
  interests
}) => {
  const prompt = `You are a professional packing assistant. Generate a highly personalized packing list for a trip to ${destination}.
Key Details:
- Duration: ${daysCount} days
- Climate/Weather: ${weatherTemp}°C, ${weatherCondition}
- Travel Style: ${travelStyle}
- Interests: ${interests.join(', ')}

Please categorize the packing list into logical groups, such as "Clothing", "Toiletries", "Electronics", "Documents", and "Miscellaneous". Add specific items based on the weather (e.g. umbrella/raincoat for rainy weather, warm jacket for cold, sunscreen/sunglasses for sunny, etc.) and interests (e.g. hiking shoes for adventure, camera for sightseeing, formal wear for luxury, etc.).

For each item, specify a recommended quantity and a brief reason why it's needed.

You must return a JSON array of categories conforming exactly to this schema:
[
  {
    "category": "Clothing",
    "items": [
      { "name": "T-shirts", "quantity": "5", "reason": "Basic layering for warm days" },
      { "name": "Light jacket", "quantity": "1", "reason": "For cool evenings" }
    ]
  },
  {
    "category": "Toiletries",
    "items": [
      { "name": "Toothbrush & paste", "quantity": "1", "reason": "Personal hygiene" }
    ]
  }
]

Only return the raw JSON array. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  let packingResult = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const models = getGeminiModels();
    for (const model of models) {
      try {
        console.log(`Attempting packing list generation with Gemini model: ${model}`);
        const textResponse = await callGeminiAPI(model, prompt, apiKey);
        
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        packingResult = JSON.parse(jsonStr);
        console.log(`Successfully generated packing list using Gemini model: ${model}`);
        break;
      } catch (err) {
        console.warn(`Gemini packing list call failed for model ${model}: ${err.message}`);
      }
    }
  }

  if (!packingResult) {
    packingResult = [
      {
        category: "Clothing",
        items: [
          { name: "Daily Outfits", quantity: `${daysCount}`, reason: "Outfits matching trip duration" },
          { name: "Comfortable Walking Shoes", quantity: "1 pair", reason: "For daily sightseeing" },
          { name: "Undergarments & Socks", quantity: `${daysCount + 1}`, reason: "Daily essentials" },
          ...(weatherTemp < 15 ? [{ name: "Warm Jacket/Sweater", quantity: "1-2", reason: "Cold climate protection" }] : []),
          ...(weatherCondition.toLowerCase().includes('rain') ? [{ name: "Umbrella / Raincoat", quantity: "1", reason: "Rainy weather" }] : [])
        ]
      },
      {
        category: "Toiletries",
        items: [
          { name: "Toothbrush & Toothpaste", quantity: "1", reason: "Daily hygiene" },
          { name: "Deodorant", quantity: "1", reason: "Stay fresh" },
          { name: "Sunscreen", quantity: "1", reason: "Sun protection" }
        ]
      },
      {
        category: "Electronics",
        items: [
          { name: "Phone Charger", quantity: "1", reason: "Device charging" },
          { name: "Universal Travel Adapter", quantity: "1", reason: "Socket compatibility" },
          { name: "Power Bank", quantity: "1", reason: "Charging on the go" }
        ]
      },
      {
        category: "Documents",
        items: [
          { name: "Passport / ID Card", quantity: "1", reason: "Identity verification" },
          { name: "Trip Itinerary Printout", quantity: "1", reason: "Offline navigation" },
          { name: "Cash / Forex Card", quantity: "As needed", reason: "Local transactions" }
        ]
      }
    ];
  }

  return packingResult;
};

/**
 * Calls Gemini / fallback APIs to generate actual real-world hotels for a city
 */
export const getHotelsFromGemini = async (destination) => {
  const prompt = `You are an expert hotel booking assistant. For the destination city "${destination}", list 20 famous real hotels that actually exist in this city.
For each hotel, provide:
- name: The actual name of the hotel (e.g. "Amatra By The Ganges", "Hotel Ritz Paris").
- stars: A rating number (3, 4, or 5).
- rating: A customer rating decimal between 7.5 and 9.8.
- reviewsCount: Number of reviews (e.g., 420).
- price: Average cost per night in USD (e.g., 180).
- amenities: Array containing some of "WiFi", "Pool", "Gym", "Spa", "Breakfast", "AC".
- description: A short, 1-sentence highlight of the hotel.

You must return a JSON array conforming exactly to this schema:
[
  {
    "name": "Hotel Name",
    "stars": 5,
    "rating": 9.4,
    "reviewsCount": 420,
    "price": 180,
    "amenities": ["WiFi", "Pool", "Spa", "AC"],
    "description": "A luxury wellness sanctuary offering Ganges views and organic dining."
  }
]

Only return the raw JSON array. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  let hotelResult = null;

  // 1. Try Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const models = getGeminiModels();
    for (const model of models) {
      try {
        console.log(`Attempting real hotel generation with Gemini model: ${model}`);
        const textResponse = await callGeminiAPI(model, prompt, apiKey);
        
        let jsonStr = textResponse.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        hotelResult = JSON.parse(jsonStr);
        console.log(`Successfully generated real hotels using Gemini model: ${model}`);
        break;
      } catch (err) {
        console.warn(`Gemini hotel generation failed for model ${model}: ${err.message}`);
      }
    }
  }

  // 2. Try Groq
  if (!hotelResult && process.env.GROQ_API_KEY) {
    console.log('Gemini failed or missing. Trying Groq for real hotels...');
    const groqModels = ['qwen-2.5-coder-32k', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const model of groqModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          })
        });
        if (response.ok) {
          const raw = await response.json();
          let jsonStr = raw.choices[0].message.content.trim();
          const firstBrace = jsonStr.indexOf('[');
          const lastBrace = jsonStr.lastIndexOf(']');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
          }
          hotelResult = JSON.parse(jsonStr);
          console.log(`Successfully generated real hotels using Groq model: ${model}`);
          break;
        }
      } catch (err) {
        console.warn(`Groq hotel call failed for model ${model}: ${err.message}`);
      }
    }
  }

  // 3. Try Ollama (Local fallback)
  if (!hotelResult) {
    console.warn(`Cloud APIs failed. Falling back to local Ollama for real hotels.`);
    try {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'llama3';
      const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json'
        })
      });
      if (response.ok) {
        const raw = await response.json();
        let jsonStr = raw.response.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        hotelResult = JSON.parse(jsonStr);
        console.log(`Successfully generated real hotels using Ollama model: ${model}`);
      }
    } catch (err) {
      console.warn(`Ollama local hotel generation failed:`, err.message);
    }
  }

  return hotelResult || [];
};

/**
 * Generates AI-powered cost-saving tips for a travel budget and logged expenses
 */
export const getBudgetInsightsFromGemini = async (trip, budgetData, expenses) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [
      "AI Tip: Establish a transport reserve to handle sudden taxi or local rideshare fare hikes.",
      "AI Tip: Pre-book tourist attractions and tours online to skip ticket window surcharges.",
      "AI Tip: Consider dining away from major landmarks; restaurants a block away are often 30% cheaper."
    ];
  }

  const prompt = `You are a travel financial advisor. Analyze this travel budget and expenses:
Destination: ${trip.destination}
Travelers: ${trip.travelers}
Total Budget: ${trip.budget}
Planned Category Breakdown: ${JSON.stringify(budgetData.categories)}
Logged Expenses: ${JSON.stringify(expenses)}

Provide 3 brief, actionable, and specific travel-saving tips or budget insights (max 20 words each) for this trip.
Return a JSON array of strings conforming exactly to this schema:
[
  "First specific cost-saving tip...",
  "Second specific cost-saving tip...",
  "Third specific cost-saving tip..."
]
Do not include markdown code block formatting or additional conversational text.`;

  const models = getGeminiModels();
  for (const model of models) {
    try {
      const textResponse = await callGeminiAPI(model, prompt, apiKey);
      let jsonStr = textResponse.trim();
      const firstBrace = jsonStr.indexOf('[');
      const lastBrace = jsonStr.lastIndexOf(']');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(jsonStr);
    } catch (err) {
      console.warn(`Gemini budget insights failed for model ${model}: ${err.message}`);
    }
  }

  return [
    "AI Tip: Search local coupons and city passes for tourist attraction entrance discount tickets.",
    "AI Tip: Buy lunch essentials at neighborhood supermarkets to reduce daily restaurant bills.",
    "AI Tip: Check if transit apps offer multi-ride tourist cards to minimize single ticket fares."
  ];
};

/**
 * Performs multimodal OCR on a base64 receipt file using Gemini
 */
export const scanReceiptWithGemini = async (base64Image, fileName) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return mockOcr(fileName);
  }

  const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return mockOcr(fileName);
  }
  const mimeType = match[1];
  const data = match[2];

  const prompt = `You are an expert travel receipt parser. Extract the following details from this receipt image:
1. Item Name: A brief name describing the item or merchant.
2. Category: Must be exactly one of "Food", "Accommodation", "Transport", "Activities", "Shopping", or "Other".
3. Actual Amount: The total cost/amount paid as a decimal number.

Return a JSON object conforming exactly to this schema:
{
  "itemName": "Merchant / Item Name",
  "category": "Food",
  "actualAmount": 45.50
}
Only return the raw JSON object. Do not include markdown code block formatting or extra text.`;

  const models = getGeminiModels();
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates[0].content.parts[0].text.trim();
        let jsonStr = text;
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(jsonStr);
      } else {
        const errTxt = await response.text();
        throw new Error(errTxt);
      }
    } catch (e) {
      lastError = e;
      console.warn(`multimodal ocr model ${model} failed: ${e.message}`);
    }
  }

  return mockOcr(fileName);
};

function mockOcr(fileName) {
  const lower = (fileName || '').toLowerCase();
  let itemName = 'Travel Expense Receipt';
  let category = 'Other';
  let actualAmount = 25.00;

  if (lower.includes('taxi') || lower.includes('uber') || lower.includes('cab') || lower.includes('transit') || lower.includes('metro') || lower.includes('train')) {
    itemName = 'Transit / Taxi Ride';
    category = 'Transport';
    actualAmount = 35.00;
  } else if (lower.includes('food') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('starbucks') || lower.includes('restaurant') || lower.includes('cafe')) {
    itemName = 'Dining / Restaurant';
    category = 'Food';
    actualAmount = 48.20;
  } else if (lower.includes('hotel') || lower.includes('airbnb') || lower.includes('stay') || lower.includes('hostel')) {
    itemName = 'Accommodation Stay';
    category = 'Accommodation';
    actualAmount = 120.00;
  } else if (lower.includes('museum') || lower.includes('tour') || lower.includes('ticket') || lower.includes('entry')) {
    itemName = 'Sightseeing Tour';
    category = 'Activities';
    actualAmount = 15.00;
  } else if (lower.includes('shop') || lower.includes('mall') || lower.includes('gift') || lower.includes('souvenir')) {
    itemName = 'Gift Shop / Souvenirs';
    category = 'Shopping';
    actualAmount = 22.50;
  }

  return { itemName, category, actualAmount };
}

/**
 * Calls Gemini API to retrieve real-world flight details for a callsign
 */
export const getFlightDetailsFromGemini = async (callsign) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a flight tracker database. For the flight callsign "${callsign}", search your knowledge base for the actual, real-world route of this flight (even if it's currently not flying or was flying recently).
Provide the:
- Operator/Airline Name
- Aircraft Type
- Departure Airport (code, name, city, country, lat, lon)
- Destination Airport (code, name, city, country, lat, lon)

You must return a JSON object conforming exactly to this schema:
{
  "airlineName": "Airline Name (e.g. IndiGo)",
  "aircraftType": "Aircraft Type (e.g. Airbus A321)",
  "originCountry": "Country of registration/origin",
  "departure": {
    "code": "Origin Airport Code (e.g. DEL)",
    "name": "Origin Airport Name (e.g. Indira Gandhi International)",
    "city": "Origin City (e.g. Delhi)",
    "country": "Origin Country (e.g. India)",
    "lat": 28.5562,
    "lon": 77.1000
  },
  "destination": {
    "code": "Destination Airport Code (e.g. VNS)",
    "name": "Destination Airport Name (e.g. Varanasi Airport)",
    "city": "Destination City (e.g. Varanasi)",
    "country": "Destination Country (e.g. India)",
    "lat": 25.4496,
    "lon": 82.8596
  }
}

Only return the raw JSON object conforming to the schema above. Do not include markdown code block formatting (like \`\`\`json) or additional conversational text.`;

  const models = getGeminiModels();
  for (const model of models) {
    try {
      console.log(`Querying Gemini model ${model} for flight details: ${callsign}`);
      const textResponse = await callGeminiAPI(model, prompt, apiKey);
      let jsonStr = textResponse.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(jsonStr);
    } catch (err) {
      console.warn(`Gemini flight details query failed for model ${model}:`, err.message);
    }
  }
  return null;
};

