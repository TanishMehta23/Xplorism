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

export async function searchHotels(city) {
  // Simulates hotel search matching the city
  return [
    { name: `Grand Plaza Hotel ${city}`, price: '$120/night', rating: '4.7/5', location: 'City Center' },
    { name: `Starlight Luxury Resort ${city}`, price: '$250/night', rating: '4.9/5', location: 'Beachfront/Scenic view' },
    { name: `Cozy Travelers Inn ${city}`, price: '$60/night', rating: '4.2/5', location: 'Near Station' }
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
