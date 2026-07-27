
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
  const model = process.env.OLLAMA_MODEL || 'llama3';

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  try {
    let textResponse = data.response;
    let jsonStr = textResponse.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.error('Failed to parse Ollama response. Raw data:', JSON.stringify(data, null, 2));
    throw new Error('Ollama API returned invalid JSON.');
  }
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
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined on the server environment.');
    }

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

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

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
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let textResponse = data.candidates[0].content.parts[0].text;
    
    // Clean up response: extract first '{' to last '}' to get clean JSON
    let jsonStr = textResponse.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.warn(`Gemini itinerary generation failed. Trying Ollama fallback. Error: ${err.message}`);
    return await askOllamaForItinerary({
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      travelStyle,
      interests
    });
  }
};

/**
 * Calls Ollama API to get nearby places (Fallback)
 */
export const getNearbyPlacesFromOllama = async (destination) => {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

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
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  try {
    let textResponse = data.response;
    let jsonStr = textResponse.trim();
    const firstBrace = jsonStr.indexOf('[');
    const lastBrace = jsonStr.lastIndexOf(']');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.error('Failed to parse Ollama response. Raw data:', JSON.stringify(data, null, 2));
    throw new Error('Ollama API returned invalid JSON for nearby places.');
  }
};

/**
 * Calls Gemini API to get nearby places
 */
export const getNearbyPlacesFromGemini = async (destination) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined on the server environment.');
    }

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

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
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
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let textResponse = data.candidates[0].content.parts[0].text;
    let jsonStr = textResponse.trim();
    const firstBrace = jsonStr.indexOf('[');
    const lastBrace = jsonStr.lastIndexOf(']');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.warn(`Gemini nearby places call failed. Trying Ollama fallback. Error: ${err.message}`);
    return await getNearbyPlacesFromOllama(destination);
  }
};

