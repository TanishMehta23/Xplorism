import { query } from '../../config/db.js';

export async function searchDestinations(searchQuery) {
  try {
    // Search distinct destinations from existing trips or return curated options
    const dbResult = await query(
      `SELECT DISTINCT destination 
       FROM trips 
       WHERE destination ILIKE $1 
       LIMIT 5`,
      [`%${searchQuery}%`]
    );
    
    if (dbResult.rows.length > 0) {
      return dbResult.rows.map(r => r.destination);
    }
    
    // Curated fallbacks if no trips match
    const curated = [
      'Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK',
      'Manali, India', 'Goa, India', 'Kashmir, India', 'Rome, Italy'
    ];
    return curated.filter(dest => dest.toLowerCase().includes(searchQuery.toLowerCase()));
  } catch (error) {
    console.error('[Tool Service] searchDestinations error:', error);
    return [];
  }
}

export async function getWeather(city) {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherJson = await weatherRes.json();
      if (weatherJson.current_weather) {
        return {
          location: `${name}, ${country}`,
          temperature: `${Math.round(weatherJson.current_weather.temperature)}°C`,
          windspeed: `${weatherJson.current_weather.windspeed} km/h`,
          conditionCode: weatherJson.current_weather.weathercode
        };
      }
    }
    return { error: `Could not retrieve weather for "${city}".` };
  } catch (error) {
    console.error('[Tool Service] getWeather error:', error);
    return { error: 'Weather API currently unavailable.' };
  }
}

export function getDestinationCurrency(destination = '') {
  const d = (destination || '').toLowerCase();
  if (
    d.includes('india') || d.includes('ayodhya') || d.includes('goa') || d.includes('delhi') ||
    d.includes('mumbai') || d.includes('manali') || d.includes('jaipur') || d.includes('varanasi') ||
    d.includes('kashmir') || d.includes('agra') || d.includes('bangalore') || d.includes('chennai') ||
    d.includes('kolkata') || d.includes('kerala') || d.includes('hyderabad') || d.includes('pune') ||
    d.includes('amritsar') || d.includes('rishikesh') || d.includes('udaipur') || d.includes('shimla') ||
    d.includes('ladakh') || d.includes('darjeeling') || d.includes('lucknow')
  ) {
    return { code: 'INR', symbol: '₹', budgetPrice: '₹1,200/night', midPrice: '₹3,500/night', luxuryPrice: '₹8,500/night' };
  }
  if (d.includes('japan') || d.includes('tokyo') || d.includes('kyoto') || d.includes('osaka') || d.includes('sapporo')) {
    return { code: 'JPY', symbol: '¥', budgetPrice: '¥7,500/night', midPrice: '¥18,000/night', luxuryPrice: '¥45,000/night' };
  }
  if (d.includes('uk') || d.includes('united kingdom') || d.includes('london') || d.includes('edinburgh') || d.includes('manchester')) {
    return { code: 'GBP', symbol: '£', budgetPrice: '£65/night', midPrice: '£140/night', luxuryPrice: '£300/night' };
  }
  if (
    d.includes('france') || d.includes('paris') || d.includes('italy') || d.includes('rome') ||
    d.includes('venice') || d.includes('spain') || d.includes('barcelona') || d.includes('madrid') ||
    d.includes('germany') || d.includes('berlin') || d.includes('amsterdam') || d.includes('netherlands') ||
    d.includes('greece') || d.includes('athens') || d.includes('vienna') || d.includes('austria') || d.includes('europe')
  ) {
    return { code: 'EUR', symbol: '€', budgetPrice: '€60/night', midPrice: '€140/night', luxuryPrice: '€320/night' };
  }
  if (d.includes('uae') || d.includes('dubai') || d.includes('abu dhabi')) {
    return { code: 'AED', symbol: 'AED', budgetPrice: 'AED 250/night', midPrice: 'AED 600/night', luxuryPrice: 'AED 1,600/night' };
  }
  if (d.includes('thailand') || d.includes('bangkok') || d.includes('phuket') || d.includes('chiang mai') || d.includes('pattaya')) {
    return { code: 'THB', symbol: '฿', budgetPrice: '฿1,000/night', midPrice: '฿2,500/night', luxuryPrice: '฿6,000/night' };
  }
  if (d.includes('singapore')) {
    return { code: 'SGD', symbol: 'S$', budgetPrice: 'S$100/night', midPrice: 'S$230/night', luxuryPrice: 'S$520/night' };
  }
  if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne')) {
    return { code: 'AUD', symbol: 'A$', budgetPrice: 'A$110/night', midPrice: 'A$230/night', luxuryPrice: 'A$480/night' };
  }
  if (d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal')) {
    return { code: 'CAD', symbol: 'C$', budgetPrice: 'C$110/night', midPrice: 'C$220/night', luxuryPrice: 'C$450/night' };
  }
  if (d.includes('switzerland') || d.includes('zurich') || d.includes('geneva')) {
    return { code: 'CHF', symbol: 'CHF', budgetPrice: 'CHF 100/night', midPrice: 'CHF 220/night', luxuryPrice: 'CHF 460/night' };
  }
  return { code: 'USD', symbol: '$', budgetPrice: '$60/night', midPrice: '$150/night', luxuryPrice: '$320/night' };
}

export async function searchHotels(city) {
  const cur = getDestinationCurrency(city);
  return [
    { name: `Cozy Travelers Inn ${city}`, price: cur.budgetPrice, tier: 'Budget', rating: '4.2/5', location: 'Near Station/Center', currency: cur.code },
    { name: `Grand Plaza Hotel ${city}`, price: cur.midPrice, tier: 'Mid-range', rating: '4.7/5', location: 'City Center', currency: cur.code },
    { name: `Starlight Luxury Resort ${city}`, price: cur.luxuryPrice, tier: 'Luxury', rating: '4.9/5', location: 'Prime Scenic Area', currency: cur.code }
  ];
}

export async function getUserPreferences(userId) {
  try {
    const result = await query(`SELECT preferences FROM users WHERE id = $1`, [userId]);
    if (result.rows.length > 0) {
      return result.rows[0].preferences || { budget: 'medium', interests: [], travelStyle: 'cultural' };
    }
    return { budget: 'medium', interests: [], travelStyle: 'cultural' };
  } catch (error) {
    console.error('[Tool Service] getUserPreferences error:', error);
    return { error: 'Failed to retrieve user preferences.' };
  }
}

export async function getUserTrips(userId) {
  try {
    const result = await query(
      `SELECT id, destination, start_date as "startDate", end_date as "endDate", budget, travelers
       FROM trips 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('[Tool Service] getUserTrips error:', error);
    return { error: 'Failed to retrieve user trips.' };
  }
}

export async function saveTrip(userId, tripDetails) {
  try {
    const { destination, startDate, endDate, budget, travelers, travelStyle, itinerary } = tripDetails;

    // Start a transaction
    await query('BEGIN');

    const tripResult = await query(
      `INSERT INTO trips (user_id, destination, start_date, end_date, budget, travelers, travel_style)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, destination, startDate, endDate, budget || 1000, travelers || 1, travelStyle || 'explorer']
    );

    const tripId = tripResult.rows[0].id;

    for (const item of itinerary) {
      await query(
        `INSERT INTO itinerary (trip_id, day, time, activity, location, estimated_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tripId, item.day, item.time, item.activity, item.location, 0]
      );
    }

    await query('COMMIT');
    return { success: true, tripId, message: `Trip to ${destination} successfully saved!` };
  } catch (error) {
    await query('ROLLBACK');
    console.error('[Tool Service] saveTrip error:', error);
    return { error: 'Failed to save trip to database.' };
  }
}
