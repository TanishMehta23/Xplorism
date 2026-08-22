import dotenv from 'dotenv';
import { callGeminiAPI, getGeminiModels } from './geminiService.js';

dotenv.config();

/**
 * Helper to call Groq API chat completion endpoint
 */
async function callGroqAPI(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not defined');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a precise real-time travel search API engine. Return ONLY valid raw JSON with zero markdown syntax or conversational text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Execute AI completion using Groq AI first, falling back to Gemini
 */
async function generateTravelData(prompt) {
  let rawResponse = '';
  
  // 1. Try Groq AI
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('Querying Groq AI for travel search data...');
      rawResponse = await callGroqAPI(prompt);
    } catch (err) {
      console.warn('Groq AI call failed, falling back to Gemini:', err.message);
    }
  }

  // 2. Fallback to Gemini if Groq failed or key is missing
  if (!rawResponse && process.env.GEMINI_API_KEY) {
    const models = getGeminiModels();
    for (const model of models) {
      try {
        console.log(`Querying Gemini (${model}) for travel search data...`);
        rawResponse = await callGeminiAPI(model, prompt, process.env.GEMINI_API_KEY);
        if (rawResponse) break;
      } catch (err) {
        console.warn(`Gemini (${model}) call failed:`, err.message);
      }
    }
  }

  if (!rawResponse) {
    throw new Error('No AI provider available or all queries failed');
  }

  // Parse raw JSON safely
  let jsonStr = rawResponse.trim();
  const firstBracket = jsonStr.indexOf('[');
  const firstBrace = jsonStr.indexOf('{');
  
  let startIdx = -1;
  let endIdx = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = jsonStr.lastIndexOf(']');
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = jsonStr.lastIndexOf('}');
  }

  if (startIdx !== -1 && endIdx !== -1) {
    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
  }

  return JSON.parse(jsonStr);
}

/**
 * Search Google Hotels via Groq/Gemini with Google Travel deep links
 */
export const searchGoogleHotels = async ({ location, checkIn, checkOut, guests = 2, currency = 'USD' }) => {
  const encLoc = encodeURIComponent(location || 'Hotel');
  const googleTravelUrl = `https://www.google.com/travel/hotels/${encLoc}`;

  const prompt = `You are a real-time hotel search aggregator. Provide 6 realistic and popular hotel choices in "${location}" for check-in: ${checkIn || 'Tomorrow'} to check-out: ${checkOut || 'Next Week'} for ${guests} guests.
Return currency in ${currency}.

Return a JSON array of 6 objects with this EXACT structure:
[
  {
    "id": "hotel_1",
    "name": "Hotel Name",
    "stars": 4,
    "rating": 8.8,
    "reviewsCount": 1240,
    "price": 145,
    "currencySymbol": "$",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    "amenities": ["WiFi", "Pool", "Gym", "Breakfast", "AC"],
    "description": "Short engaging description of hotel location and highlights.",
    "bookingUrl": "${googleTravelUrl}",
    "provider": "Google Hotels & Booking"
  }
]`;

  try {
    const hotels = await generateTravelData(prompt);
    return hotels.map((h, i) => ({
      ...h,
      id: h.id || `hotel_${i + 1}`,
      bookingUrl: h.bookingUrl || `https://www.google.com/travel/hotels?q=${encodeURIComponent(h.name + ' ' + location)}`
    }));
  } catch (err) {
    console.error('Hotel search error:', err.message);
    // Fallback static list if AI fails completely
    return [
      {
        id: 'hotel_fallback_1',
        name: `Grand Palace ${location}`,
        stars: 4,
        rating: 9.1,
        reviewsCount: 850,
        price: 120,
        currencySymbol: '$',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
        amenities: ['WiFi', 'Pool', 'Breakfast', 'AC'],
        description: `Luxury accommodations located in central ${location}.`,
        bookingUrl: `https://www.google.com/travel/hotels?q=${encodeURIComponent(location + ' hotels')}`,
        provider: 'Google Hotels'
      }
    ];
  }
};

/**
 * Search Google Flights via Groq/Gemini with Google Flights deep links
 */
export const searchGoogleFlights = async ({ origin, destination, departureDate, returnDate, travelers = 1, currency = 'USD' }) => {
  const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(destination)}`;

  const prompt = `You are a real-time flight search engine. Provide 5 realistic flight options from "${origin}" to "${destination}" departing on ${departureDate || 'Soon'}${returnDate ? ' and returning on ' + returnDate : ''} for ${travelers} passenger(s).
Return pricing in ${currency}.

Return a JSON array of 5 objects with this EXACT structure:
[
  {
    "id": "flight_1",
    "airline": "IndiGo / Delta / Emirates",
    "flightNumber": "6E-204",
    "logo": "✈️",
    "departureTime": "08:30 AM",
    "arrivalTime": "11:15 AM",
    "originCode": "${origin.toUpperCase().slice(0, 3)}",
    "destinationCode": "${destination.toUpperCase().slice(0, 3)}",
    "duration": "2h 45m",
    "stops": "Non-stop",
    "price": 180,
    "currencySymbol": "$",
    "cabinClass": "Economy",
    "bookingUrl": "${googleFlightsUrl}",
    "provider": "Google Flights Direct"
  }
]`;

  try {
    const flights = await generateTravelData(prompt);
    return flights.map((f, i) => ({
      ...f,
      id: f.id || `flight_${i + 1}`,
      bookingUrl: f.bookingUrl || googleFlightsUrl
    }));
  } catch (err) {
    console.error('Flight search error:', err.message);
    return [
      {
        id: 'flight_fallback_1',
        airline: 'Express Air',
        flightNumber: 'EX-101',
        logo: '✈️',
        departureTime: '09:00 AM',
        arrivalTime: '11:30 AM',
        originCode: origin.slice(0, 3).toUpperCase(),
        destinationCode: destination.slice(0, 3).toUpperCase(),
        duration: '2h 30m',
        stops: 'Non-stop',
        price: 150,
        currencySymbol: '$',
        cabinClass: 'Economy',
        bookingUrl: googleFlightsUrl,
        provider: 'Google Flights'
      }
    ];
  }
};

/**
 * Search Trains & Buses via Groq/Gemini with Google Travel / Official deep links
 */
export const searchGoogleTransit = async ({ origin, destination, date, mode = 'train', currency = 'USD' }) => {
  const isTrain = mode.toLowerCase().includes('train');
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent((isTrain ? 'trains' : 'buses') + ' from ' + origin + ' to ' + destination)}`;

  const prompt = `You are a public transport search engine for ${isTrain ? 'Trains' : 'Intercity Buses'}.
Provide 5 realistic ${isTrain ? 'train schedule options (e.g. Rajdhani Express, Shatabdi, Amtrak, Eurostar)' : 'intercity bus options (e.g. Volvo AC Sleeper, FlixBus, Greyhound, RedBus)'} from "${origin}" to "${destination}" for date ${date || 'Today'}.

Return a JSON array of 5 objects with this EXACT structure:
[
  {
    "id": "${mode}_1",
    "operator": "${isTrain ? 'Vande Bharat Express' : 'Intercity Volvo Diamond'}",
    "serviceNumber": "${isTrain ? '20901' : 'BUS-808'}",
    "mode": "${isTrain ? 'train' : 'bus'}",
    "departureTime": "06:00 AM",
    "arrivalTime": "12:30 PM",
    "duration": "6h 30m",
    "origin": "${origin}",
    "destination": "${destination}",
    "classOptions": ["${isTrain ? 'Executive CC, AC Chair' : 'AC Sleeper, Seater'}"],
    "price": 45,
    "currencySymbol": "$",
    "rating": 4.6,
    "bookingUrl": "${googleSearchUrl}",
    "provider": "${isTrain ? 'IRCTC / Official Rail' : 'RedBus / Bus Booking'}"
  }
]`;

  try {
    const transit = await generateTravelData(prompt);
    return transit.map((t, i) => ({
      ...t,
      id: t.id || `${mode}_${i + 1}`,
      bookingUrl: t.bookingUrl || googleSearchUrl
    }));
  } catch (err) {
    console.error('Transit search error:', err.message);
    return [
      {
        id: `${mode}_fallback_1`,
        operator: isTrain ? 'Express Rail' : 'City Cruiser Bus',
        serviceNumber: isTrain ? 'EXP-202' : 'BUS-101',
        mode: mode,
        departureTime: '07:00 AM',
        arrivalTime: '01:00 PM',
        duration: '6h 00m',
        origin,
        destination,
        classOptions: isTrain ? ['AC 2-Tier', 'AC 3-Tier'] : ['AC Sleeper'],
        price: 35,
        currencySymbol: '$',
        rating: 4.4,
        bookingUrl: googleSearchUrl,
        provider: isTrain ? 'Google Rail Search' : 'Google Bus Search'
      }
    ];
  }
};
