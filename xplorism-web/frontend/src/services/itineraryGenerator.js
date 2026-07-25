// Sequential mirrors to query Overpass API safely
const fetchOverpassWithFallback = async (queryPart) => {
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/cgi/interpreter'
  ];

  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const url = `${endpoint}?data=${encodeURIComponent(queryPart)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      clearTimeout(timeoutId);
    }
  }
  throw new Error('All Overpass API endpoints failed or timed out.');
};

// Wikipedia Geosearch global API fallback
const fetchWikipediaAttractions = async (lat, lon) => {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=5000&gscoord=${lat}|${lon}&gslimit=15&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.query && data.query.geosearch) {
      return data.query.geosearch.map(item => ({
        name: item.title,
        type: 'Historic Landmark'
      }));
    }
    return [];
  } catch (err) {
    console.error('Wikipedia fallback failed:', err);
    return [];
  }
};

/**
 * Generate a personalized itinerary using real attractions from OSM & Wikipedia.
 */
export const generateItinerary = async ({
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
  const diffTime = Math.abs(end - start);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let lat = null;
  let lon = null;
  let resolvedName = destination;

  // Step 1: Geocode the destination
  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`;
    const geoRes = await fetch(geocodeUrl, {
      headers: { 'Accept-Language': 'en' }
    });
    const geoData = await geoRes.json();
    if (geoData && geoData.length > 0) {
      lat = parseFloat(geoData[0].lat);
      lon = parseFloat(geoData[0].lon);
      resolvedName = geoData[0].display_name.split(',')[0];
    }
  } catch (err) {
    console.error('Geocoding failed, falling back to text destination:', err);
  }

  // Step 2: Fetch attractions
  let attractions = [];
  if (lat && lon) {
    try {
      // Query sights, monuments, historical spots
      const queryPart = `[out:json][timeout:15];(nwr["historic"~"monument|castle|ruins|memorial"](around:5000,${lat},${lon});nwr["tourism"~"attraction|museum|viewpoint"](around:5000,${lat},${lon}););out center;`;
      const data = await fetchOverpassWithFallback(queryPart);
      if (data && data.elements) {
        attractions = data.elements
          .filter(el => el.tags && el.tags.name)
          .map(el => ({
            name: el.tags.name,
            type: el.tags.historic || el.tags.tourism || 'Attraction'
          }));
      }
    } catch (e) {
      console.warn('Overpass failed, trying Wikipedia attractions...');
      attractions = await fetchWikipediaAttractions(lat, lon);
    }
  }

  // Fallback if no attractions found
  if (attractions.length === 0) {
    attractions = [
      { name: 'City Center & Historic Square', type: 'Sightseeing' },
      { name: 'National Museum & Gallery', type: 'Culture' },
      { name: 'Scenic Local Park & Botanics', type: 'Nature' },
      { name: 'Popular Shopping District', type: 'Leisure' },
      { name: 'Famous Cultural Landmark', type: 'Heritage' },
      { name: 'Local Dining & Food Market', type: 'Culinary' },
      { name: 'Sunset Viewpoint & River Walk', type: 'Relaxation' }
    ];
  }

  // Step 3: Distribute attractions and curate activities
  const itinerary = [];
  const dailyBudget = budget / (totalDays * travelers || 1);

  // Activity descriptions based on style/interests
  const stylesInfo = {
    Adventure: { verb: 'Explore and hike around', timeScale: 1.2 },
    Luxury: { verb: 'Premium guided private tour of', timeScale: 1.8 },
    Budget: { verb: 'Self-guided discovery walking tour of', timeScale: 0.5 },
    Cultural: { verb: 'Immersive cultural and historical visit to', timeScale: 1.0 },
    Romantic: { verb: 'Relaxing stroll and scenery appreciation at', timeScale: 1.3 },
    Relaxing: { verb: 'Leisurely visit and coffee break near', timeScale: 0.9 }
  };

  const selectedStyle = stylesInfo[travelStyle] || { verb: 'Visit and explore', timeScale: 1.0 };
  let attractionIndex = 0;

  for (let day = 1; day <= totalDays; day++) {
    // 3 slots per day: Morning, Afternoon, Evening
    const slots = [
      { time: '09:30 AM', segment: 'Morning' },
      { time: '02:00 PM', segment: 'Afternoon' },
      { time: '07:00 PM', segment: 'Evening' }
    ];

    for (const slot of slots) {
      const attraction = attractions[attractionIndex % attractions.length];
      attractionIndex++;

      let activityText = '';
      let estimatedCost = 0;

      if (slot.segment === 'Evening') {
        // Evening is usually food or leisure
        const hasFoodInterest = interests.includes('Food');
        const hasNightlife = interests.includes('Nightlife');
        
        if (hasNightlife) {
          activityText = `Enjoy live music and local nightlife near ${attraction.name}`;
          estimatedCost = dailyBudget * 0.25 * selectedStyle.timeScale;
        } else if (hasFoodInterest) {
          activityText = `Indulge in a local culinary tasting menu and traditional dinner near ${attraction.name}`;
          estimatedCost = dailyBudget * 0.35 * selectedStyle.timeScale;
        } else {
          activityText = `Leisurely evening walk and local dinner surrounding ${attraction.name}`;
          estimatedCost = dailyBudget * 0.2 * selectedStyle.timeScale;
        }
      } else {
        // Morning/Afternoon are sightseeing/interests
        activityText = `${selectedStyle.verb} ${attraction.name}`;
        
        // Add interest modifiers
        if (interests.length > 0) {
          const matchedInterest = interests[attractionIndex % interests.length];
          activityText += ` - focusing on local ${matchedInterest.toLowerCase()} elements`;
        }
        
        estimatedCost = dailyBudget * 0.15 * selectedStyle.timeScale;
      }

      itinerary.push({
        day,
        activity: activityText,
        time: slot.time,
        location: attraction.name,
        estimatedCost: parseFloat(estimatedCost.toFixed(2))
      });
    }
  }

  return {
    itinerary,
    resolvedName
  };
};
