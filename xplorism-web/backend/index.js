import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import { getNearbyPlacesFromGemini } from './services/geminiService.js';

dotenv.config();

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

const geocodeCache = new Map();


// Helper to fetch from Nominatim
async function fetchFromNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'XplorismTravelApp/1.0',
      'Accept-Language': 'en'
    }
  });
  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }
  return await response.json();
}

// Advanced query resolution helper to handle complex location names
async function resolveGeocodeQuery(q) {
  // 1. Try direct query first
  let data = await fetchFromNominatim(q);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
