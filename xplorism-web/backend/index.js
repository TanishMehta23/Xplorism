import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import { getNearbyPlacesFromGemini, getHotelsFromGemini } from './services/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For development purposes. Can be restricted to specific clients later.
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/trips', tripRoutes);
app.use('/trips', budgetRoutes);
app.use('/favorites', favoriteRoutes);

// Nearby Places Route using Gemini
app.get('/nearby', async (req, res) => {
  const { destination } = req.query;
  if (!destination) {
    return res.status(400).json({ message: 'Destination query parameter is required' });
  }
  try {
    const places = await getNearbyPlacesFromGemini(destination);
    res.json(places);
  } catch (err) {
    console.error('Nearby places error:', err);
    res.status(500).json({ message: 'Failed to fetch nearby places' });
  }
});

// Overpass Proxy Route to prevent CORS in deployment
app.get('/overpass', async (req, res) => {
  const { data } = req.query;
  if (!data) {
    return res.status(400).json({ message: 'Query parameter "data" is required' });
  }

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/cgi/interpreter'
  ];

  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${endpoint}?data=${encodeURIComponent(data)}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const json = await response.json();
        return res.json(json);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`Proxy Overpass endpoint failed: ${endpoint}`, err.message);
    }
  }

  res.status(502).json({ message: 'All Overpass endpoints failed or timed out.' });
});

const geocodeCache = new Map();


// Helper to fetch from Nominatim with a timeout
async function fetchFromNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'XplorismTravelApp/1.0',
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`Nominatim returned non-ok status: ${response.status}`);
      return null; // Return null so we can specifically detect an API/rate limit failure
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`Nominatim fetch failed or timed out for query "${query}":`, error.message);
    return null; // Return null on error
  }
}

// Helper to fetch from Open-Meteo Geocoding API (Fallback)
async function fetchFromOpenMeteo(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`Open-Meteo geocoding returned non-ok status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return [];
    
    return data.results.map(r => ({
      place_id: `om-${r.id}`,
      lat: String(r.latitude),
      lon: String(r.longitude),
      display_name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country}`,
      address: {
        country_code: (r.country_code || '').toLowerCase()
      }
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`Open-Meteo geocoding fallback failed for query "${query}":`, error.message);
    return [];
  }
}

// Advanced query resolution helper to handle complex location names
async function resolveGeocodeQuery(q) {
  // 1. Try direct query first
  let data = await fetchFromNominatim(q);
  if (!data || data.length === 0) {
    console.log(`Nominatim failed or returned no results. Trying Open-Meteo fallback for: "${q}"`);
    data = await fetchFromOpenMeteo(q);
  }
  if (data && data.length > 0) return data;

  // Swap Mandir/Temple on direct query
  if (q.toLowerCase().includes('mandir')) {
    data = await fetchFromNominatim(q.replace(/mandir/gi, 'Temple'));
    if (data && data.length > 0) return data;
  } else if (q.toLowerCase().includes('temple')) {
    data = await fetchFromNominatim(q.replace(/temple/gi, 'Mandir'));
    if (data && data.length > 0) return data;
  }

  // 2. Parse composite queries (split main place and city/destination context)
  let city = '';
  let mainPlace = q;
  if (q.includes(',')) {
    const parts = q.split(',');
    mainPlace = parts[0].trim();
    city = parts.slice(1).join(',').trim();
  }

  // If we have a city context, try querying just the main place with city context
  if (city) {
    data = await fetchFromNominatim(`${mainPlace}, ${city}`);
    if (data && data.length > 0) return data;
  }

  // Try splitters to extract actual geographic landmarks
  const splitters = [/\bat\b/i, /\bin\b/i, /\bnear\b/i, /\bvia\b/i, /&/, /\band\b/i];
  for (const splitter of splitters) {
    if (splitter.test(mainPlace)) {
      const subParts = mainPlace.split(splitter);
      for (let part of subParts) {
        part = part.trim();
        // Skip short, empty, or generic descriptive terms
        if (part.length < 3 || /check-in|check out|departure|arrival|luxury|fine dining|wellness|spa|massage|experience|tour/i.test(part)) {
          continue;
        }

        // Try with city/destination context first to avoid wrong city matches
        if (city) {
          const queryWithCity = `${part}, ${city}`;
          data = await fetchFromNominatim(queryWithCity);
          if (data && data.length > 0) return data;

          // Swap Mandir/Temple on part with city
          if (part.toLowerCase().includes('mandir')) {
            data = await fetchFromNominatim(`${part.replace(/mandir/gi, 'Temple')}, ${city}`);
            if (data && data.length > 0) return data;
          } else if (part.toLowerCase().includes('temple')) {
            data = await fetchFromNominatim(`${part.replace(/temple/gi, 'Mandir')}, ${city}`);
            if (data && data.length > 0) return data;
          }
        }

        // Try without city context (highly descriptive names)
        data = await fetchFromNominatim(part);
        if (data && data.length > 0) {
          // If we found a result, verify it's somewhat in the right region/country if possible
          // In this case, we'll return it as a best effort
          return data;
        }
      }
    }
  }

  // Last resort: query just the main place without splitters
  data = await fetchFromNominatim(mainPlace);
  if (!data || data.length === 0) {
    data = await fetchFromOpenMeteo(mainPlace);
  }
  if (data && data.length > 0) return data;

  return [];
}

// Geocoding Proxy Route to avoid CORS issues
app.get('/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }

  // Check Cache
  if (geocodeCache.has(q)) {
    return res.json(geocodeCache.get(q));
  }

  try {
    const data = await resolveGeocodeQuery(q);
    // Cache the resolved result (even if empty to prevent repeated bad calls)
    geocodeCache.set(q, data);
    res.json(data);
  } catch (err) {
    console.error('Geocoding proxy error:', err);
    res.status(500).json({ message: 'Failed to fetch geocoding data' });
  }
});

// Backend Route for Hotel Search integrating Gemini/Groq
app.get('/hotels/search', async (req, res) => {
  const { destination, lat, lon } = req.query;
  if (!destination) {
    return res.status(400).json({ message: 'Destination is required' });
  }

  try {
    const list = await getHotelsFromGemini(destination);
    
    // Assign coordinates distributed around the destination center
    const centerLat = parseFloat(lat) || 20.5937;
    const centerLon = parseFloat(lon) || 78.9629;
    
    const mappedList = list.map((hotel, idx) => {
      const latOffset = (Math.random() - 0.5) * 0.015;
      const lonOffset = (Math.random() - 0.5) * 0.015;
      return {
        name: hotel.name,
        stars: hotel.stars || 4,
        rating: hotel.rating || 8.5,
        reviewsCount: hotel.reviewsCount || 200,
        price: hotel.price || 120,
        amenities: hotel.amenities || ["WiFi", "AC"],
        description: hotel.description || "A pleasant accommodation in a convenient location.",
        geoCode: {
          latitude: centerLat + latOffset,
          longitude: centerLon + lonOffset
        },
        hotelId: `gemini-${idx}-${Date.now()}`
      };
    });

    res.json(mappedList);
  } catch (err) {
    console.error('Gemini hotel search failed:', err);
    res.json([]);
  }
});


// OpenSky Network API Proxy for Flight Tracker
// OpenSky Network API Proxy for Flight Tracker (Enriched with 40 simulated flights globally)
const MOCK_FLIGHTS = [
  { icao24: 'a81a70', callsign: 'AAL120', origin_country: 'United States', longitude: -73.97, latitude: 40.78, baro_altitude: 10500, on_ground: false, velocity: 230, true_track: 85, vertical_rate: 2.5 },
  { icao24: '400a0b', callsign: 'BAW2276', origin_country: 'United Kingdom', longitude: -0.12, latitude: 51.50, baro_altitude: 8200, on_ground: false, velocity: 195, true_track: 270, vertical_rate: -1.2 },
  { icao24: '3c65c2', callsign: 'DLH450', origin_country: 'Germany', longitude: 8.68, latitude: 50.11, baro_altitude: 11200, on_ground: false, velocity: 245, true_track: 180, vertical_rate: 0 },
  { icao24: '7c12b1', callsign: 'ANA006', origin_country: 'Japan', longitude: 139.69, latitude: 35.67, baro_altitude: 9800, on_ground: false, velocity: 220, true_track: 90, vertical_rate: 0.5 },
  { icao24: '800531', callsign: 'AIC101', origin_country: 'India', longitude: 77.20, latitude: 28.61, baro_altitude: 6400, on_ground: false, velocity: 180, true_track: 45, vertical_rate: -3.0 },
  { icao24: '7c0d20', callsign: 'SIA317', origin_country: 'Singapore', longitude: 103.85, latitude: 1.35, baro_altitude: 11500, on_ground: false, velocity: 250, true_track: 310, vertical_rate: 0 },
  { icao24: '7c19bb', callsign: 'QFA001', origin_country: 'Australia', longitude: 151.20, latitude: -33.86, baro_altitude: 12000, on_ground: false, velocity: 260, true_track: 220, vertical_rate: 0.2 },
  { icao24: '02008b', callsign: 'RAM200', origin_country: 'Morocco', longitude: -7.58, latitude: 33.57, baro_altitude: 7500, on_ground: false, velocity: 200, true_track: 15, vertical_rate: -2.0 },
  { icao24: 'e8029c', callsign: 'UAE201', origin_country: 'United Arab Emirates', longitude: 55.30, latitude: 25.25, baro_altitude: 10800, on_ground: false, velocity: 240, true_track: 120, vertical_rate: 0.8 },
  { icao24: '4005ba', callsign: 'AFR006', origin_country: 'France', longitude: 2.35, latitude: 48.85, baro_altitude: 9000, on_ground: false, velocity: 210, true_track: 330, vertical_rate: -0.5 },
  
  // Additional simulated flights to increase density
  { icao24: '800532', callsign: 'AIC5BE', origin_country: 'India', longitude: 78.14, latitude: 25.10, baro_altitude: 11000, on_ground: false, velocity: 242, true_track: 276, vertical_rate: 0 },
  { icao24: '800533', callsign: 'AIC203', origin_country: 'India', longitude: 72.86, latitude: 19.08, baro_altitude: 9500, on_ground: false, velocity: 210, true_track: 120, vertical_rate: 1.5 },
  { icao24: '800534', callsign: 'AIC990', origin_country: 'India', longitude: 77.10, latitude: 28.55, baro_altitude: 3500, on_ground: false, velocity: 150, true_track: 90, vertical_rate: -2.5 },
  { icao24: 'a81a71', callsign: 'AAL440', origin_country: 'United States', longitude: -118.40, latitude: 33.94, baro_altitude: 8000, on_ground: false, velocity: 205, true_track: 250, vertical_rate: 0 },
  { icao24: 'a81a72', callsign: 'AAL921', origin_country: 'United States', longitude: -87.62, latitude: 41.87, baro_altitude: 10200, on_ground: false, velocity: 225, true_track: 15, vertical_rate: -1.0 },
  { icao24: '400a0c', callsign: 'BAW224', origin_country: 'United Kingdom', longitude: -1.50, latitude: 52.20, baro_altitude: 9000, on_ground: false, velocity: 200, true_track: 180, vertical_rate: 0.5 },
  { icao24: '400a0d', callsign: 'BAW902', origin_country: 'United Kingdom', longitude: -3.18, latitude: 55.95, baro_altitude: 11500, on_ground: false, velocity: 248, true_track: 340, vertical_rate: 0 },
  { icao24: '3c65c3', callsign: 'DLH102', origin_country: 'Germany', longitude: 9.99, latitude: 53.55, baro_altitude: 7200, on_ground: false, velocity: 190, true_track: 220, vertical_rate: -2.0 },
  { icao24: '3c65c4', callsign: 'DLH882', origin_country: 'Germany', longitude: 11.58, latitude: 48.13, baro_altitude: 11000, on_ground: false, velocity: 235, true_track: 45, vertical_rate: 0.8 },
  { icao24: 'e8029d', callsign: 'UAE412', origin_country: 'United Arab Emirates', longitude: 54.37, latitude: 24.45, baro_altitude: 9000, on_ground: false, velocity: 215, true_track: 140, vertical_rate: 0 },
  { icao24: 'e8029e', callsign: 'UAE001', origin_country: 'United Arab Emirates', longitude: 56.12, latitude: 25.80, baro_altitude: 12000, on_ground: false, velocity: 265, true_track: 270, vertical_rate: 0.1 },
  { icao24: '7c0d21', callsign: 'SIA008', origin_country: 'Singapore', longitude: 101.50, latitude: 3.13, baro_altitude: 8500, on_ground: false, velocity: 202, true_track: 15, vertical_rate: -1.5 },
  { icao24: '7c0d22', callsign: 'SIA224', origin_country: 'Singapore', longitude: 104.20, latitude: 2.10, baro_altitude: 10800, on_ground: false, velocity: 240, true_track: 180, vertical_rate: 0.5 },
  { icao24: '7c19bc', callsign: 'QFA024', origin_country: 'Australia', longitude: 144.96, latitude: -37.81, baro_altitude: 9200, on_ground: false, velocity: 220, true_track: 330, vertical_rate: -0.8 },
  { icao24: '7c19bd', callsign: 'QFA402', origin_country: 'Australia', longitude: 153.02, latitude: -27.46, baro_altitude: 11200, on_ground: false, velocity: 250, true_track: 200, vertical_rate: 0 },
  { icao24: '4005bb', callsign: 'AFR124', origin_country: 'France', longitude: 5.36, latitude: 43.29, baro_altitude: 8100, on_ground: false, velocity: 198, true_track: 110, vertical_rate: -1.2 },
  { icao24: '4005bc', callsign: 'AFR892', origin_country: 'France', longitude: 4.83, latitude: 45.76, baro_altitude: 10500, on_ground: false, velocity: 232, true_track: 30, vertical_rate: 0 },
  { icao24: '7c12b2', callsign: 'ANA901', origin_country: 'Japan', longitude: 135.50, latitude: 34.69, baro_altitude: 8800, on_ground: false, velocity: 212, true_track: 245, vertical_rate: -0.5 },
  { icao24: '7c12b3', callsign: 'ANA008', origin_country: 'Japan', longitude: 141.35, latitude: 43.06, baro_altitude: 11400, on_ground: false, velocity: 245, true_track: 20, vertical_rate: 0.4 },
  { icao24: '02008c', callsign: 'RAM410', origin_country: 'Morocco', longitude: -6.84, latitude: 33.97, baro_altitude: 6200, on_ground: false, velocity: 185, true_track: 95, vertical_rate: -2.2 }
];

function getMockFlights() {
  const time = Math.floor(Date.now() / 1000);
  const totalSimulated = 450;
  const list = [];
  
  for (let i = 0; i < totalSimulated; i++) {
    const base = MOCK_FLIGHTS[i % MOCK_FLIGHTS.length];
    
    // Generate unique hex code
    const uniqueIcao = (0x800000 + i * 437).toString(16).slice(-6);
    
    // Generate unique callsign
    const prefix = base.callsign.substring(0, 3);
    const flightNum = (100 + i * 7) % 1000;
    const uniqueCallsign = `${prefix}${flightNum}`.padEnd(8, ' ');
    
    // Spread coordinates around the base country hub
    // To make sure they are not clustered in exactly the same spot
    const angle = (time / 150 + i * 15) * (Math.PI / 180);
    const distanceOffset = 0.8 + ((i * 0.17) % 6.0); // spread up to 6 degrees (~600km)
    
    const newLon = base.longitude + Math.cos(angle) * distanceOffset;
    const newLat = base.latitude + Math.sin(angle) * distanceOffset;
    
    const newAlt = base.baro_altitude + Math.round(Math.sin(time / 20 + i) * 600) + ((i * 200) % 8000);
    const newSpeed = base.velocity + Math.round(Math.sin(time / 10 + i) * 20) + ((i * 5) % 100);
    const newTrack = (base.true_track + (i * 25)) % 360;
    
    list.push([
      uniqueIcao,
      uniqueCallsign,
      base.origin_country,
      time,
      time,
      newLon,
      newLat,
      newAlt,
      base.on_ground,
      newSpeed,
      newTrack,
      base.vertical_rate,
      null,
      newAlt + 15,
      "7000",
      false,
      0
    ]);
  }
  return list;
}
const AIRPORTS = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781 },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1000 },
  { code: 'BOM', name: 'Chhatrapati Shivaji International', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656 },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657 },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia', lat: -33.9461, lon: 151.1772 },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085 },
  { code: 'AMS', name: 'Schiphol Airport', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 }
];

const AIRLINES = {
  'AIC': 'Air India',
  'AAL': 'American Airlines',
  'BAW': 'British Airways',
  'DLH': 'Lufthansa',
  'AFR': 'Air France',
  'UAE': 'Emirates',
  'SIA': 'Singapore Airlines',
  'QFA': 'Qantas',
  'ANA': 'All Nippon Airways',
  'TVF': 'Transavia France'
};

const AIRCRAFT_TYPES = [
  'Boeing 777-300ER', 'Airbus A350-900', 'Boeing 787-9 Dreamliner', 
  'Airbus A321neo', 'Airbus A380-800', 'Boeing 737 MAX 9'
];

function getDeterministicIndex(str, max) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % max;
}

function enrichFlight(state) {
  const icao24 = state[0];
  const callsign = (state[1] || '').trim();
  const originCountry = state[2] || 'Unknown';
  
  // Resolve Airline
  let airlineName = 'Private Flight';
  const match = callsign.match(/^[A-Za-z]{3}/);
  if (match) {
    const prefix = match[0].toUpperCase();
    if (AIRLINES[prefix]) {
      airlineName = AIRLINES[prefix];
    } else {
      airlineName = `${originCountry} Air`;
    }
  } else if (originCountry && originCountry !== 'Unknown') {
    airlineName = `${originCountry} Charter`;
  }

  // Determine Aircraft
  const aircraftIdx = getDeterministicIndex(icao24 + '-air', AIRCRAFT_TYPES.length);
  const aircraftType = AIRCRAFT_TYPES[aircraftIdx];

  // Determine Airports
  const originIdx = getDeterministicIndex(icao24, AIRPORTS.length);
  let destIdx = getDeterministicIndex(icao24 + '-dest', AIRPORTS.length);
  if (destIdx === originIdx) {
    destIdx = (destIdx + 1) % AIRPORTS.length;
  }
  const departure = AIRPORTS[originIdx];
  const destination = AIRPORTS[destIdx];

  return {
    icao24,
    callsign,
    originCountry,
    timePosition: state[3],
    lastContact: state[4],
    longitude: state[5],
    latitude: state[6],
    altitude: state[7], // raw meters
    onGround: state[8],
    velocity: state[9], // raw m/s
    heading: state[10] || 0,
    verticalRate: state[11], // raw m/s
    airlineName,
    aircraftType,
    departure,
    destination
  };
}

app.get('/flights', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  let rawStates = [];
  let source = 'mock';

  try {
    const response = await fetch('https://opensky-network.org/api/states/all', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.states && data.states.length > 0) {
        rawStates = data.states.slice(0, 100);
        source = 'opensky';
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("OpenSky API failed or timed out. Falling back to active mock data:", err.message);
  }

  if (rawStates.length === 0) {
    rawStates = getMockFlights();
    source = 'mock';
  }

  // Enrich flight details deterministically
  const enrichedStates = rawStates
    .filter(state => state[5] !== null && state[6] !== null)
    .map(state => enrichFlight(state));

  return res.json({
    source,
    time: Math.floor(Date.now() / 1000),
    states: enrichedStates
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Xplorism API is running' });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Database auto-initialization function
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('schema.sql file not found, skipping database auto-initialization.');
      return;
    }
    
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Remove destructive DROP TABLE statements to prevent data loss on restarts
    schemaSql = schemaSql.replace(/DROP TABLE IF EXISTS \w+;/gi, '');

    // Ensure CREATE TABLE is CREATE TABLE IF NOT EXISTS
    schemaSql = schemaSql.replace(/CREATE TABLE (\w+)/gi, 'CREATE TABLE IF NOT EXISTS $1');

    // Strip comments to prevent filtering out statements that start with them
    let cleanedSql = schemaSql
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        return commentIndex !== -1 ? line.substring(0, commentIndex) : line;
      })
      .join('\n');

    // Split statements by semicolon
    const statements = cleanedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (stmtError) {
        console.warn(`[DB Init Warning] Statement failed: "${statement.trim().substring(0, 80)}..." - ${stmtError.message}`);
      }
    }
    console.log('Database tables successfully initialized / verified.');
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

let amadeusToken = null;
let amadeusTokenExpiry = 0;

// Fetch or refresh the Amadeus OAuth access token
async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return null;
  }

  if (amadeusToken && Date.now() < amadeusTokenExpiry) {
    return amadeusToken;
  }

  try {
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    });
    
    if (response.ok) {
      const data = await response.json();
      amadeusToken = data.access_token;
      amadeusTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      return amadeusToken;
    } else {
      console.warn("Failed to retrieve Amadeus auth token:", response.statusText);
      return null;
    }
  } catch (err) {
    console.error("Amadeus Token Error:", err.message);
    return null;
  }
}

// Fetch hotels around coordinates using Amadeus Geocode API
async function fetchAmadeusHotels(lat, lon) {
  const token = await getAmadeusToken();
  if (!token) return [];

  try {
    const response = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude=${lat}&longitude=${lon}&radius=5&radiusUnit=KM`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
  } catch (err) {
    console.error("Amadeus Fetch Error:", err.message);
  }
  return [];
}




// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server due to database init error:', err);
});
