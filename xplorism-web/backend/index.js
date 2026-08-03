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
import { getNearbyPlacesFromGemini } from './services/geminiService.js';

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

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server due to database init error:', err);
});
