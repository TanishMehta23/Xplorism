
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

      for (let day = 1; day <= daysCount; day++) {
        itineraries.push({
          day,
          time: "09:00 AM",
          activity: `Morning walk around the historic monuments and local landmarks of ${city}.`,
          location: `${city} Town Center`,
          estimatedCost: Math.round(dailyBudget * 0.15)
        });
        itineraries.push({
          day,
          time: "02:00 PM",
          activity: `Afternoon tour focused on ${interestList[day % interestList.length]} with regional tastings.`,
          location: `${city} Cultural District`,
          estimatedCost: Math.round(dailyBudget * 0.25)
        });
        itineraries.push({
          day,
          time: "06:30 PM",
          activity: `Evening sunset viewpoint visit followed by a traditional dinner.`,
          location: `${city} Plaza`,
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
  }
};

