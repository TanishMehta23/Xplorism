import { query } from '../config/db.js';
import { askGeminiForItinerary } from '../services/geminiService.js';

// Get all trips for the authenticated user
export const getTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all trips for user
    const tripsResult = await query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const trips = tripsResult.rows;

    // Fetch itineraries for each trip and map them
    const tripsWithItineraries = await Promise.all(
      trips.map(async (trip) => {
        const itineraryResult = await query(
          'SELECT * FROM itinerary WHERE trip_id = $1 ORDER BY day ASC',
          [trip.id]
        );
        
        // Map database fields to camelCase for the client
        return {
          id: trip.id,
          userId: trip.user_id,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          budget: trip.budget,
          travelers: trip.travelers,
          travelStyle: trip.travel_style,
          interests: trip.interests,
          createdAt: trip.created_at,
          itineraries: itineraryResult.rows.map(item => ({
            id: item.id,
            tripId: item.trip_id,
            day: item.day,
            activity: item.activity,
            time: item.time,
            location: item.location,
            estimatedCost: item.estimated_cost
          }))
        };
      })
    );

    res.json(tripsWithItineraries);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new trip
export const createTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      travelStyle,
      interests,
      itinerary,
    } = req.body;

    if (!destination || !startDate || !endDate || budget === undefined || !travelers || !travelStyle) {
      return res.status(400).json({ message: 'Missing required trip details' });
    }

    // Insert trip
    const tripResult = await query(
      `INSERT INTO trips (user_id, destination, start_date, end_date, budget, travelers, travel_style, interests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        destination,
        new Date(startDate),
        new Date(endDate),
        parseFloat(budget),
        parseInt(travelers),
        travelStyle,
        interests || []
      ]
    );

    const trip = tripResult.rows[0];

    // If itineraries exist, insert them
    let insertedItineraries = [];
    if (itinerary && itinerary.length > 0) {
      for (const item of itinerary) {
        const itemResult = await query(
          `INSERT INTO itinerary (trip_id, day, activity, time, location, estimated_cost)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            trip.id,
            parseInt(item.day),
            item.activity,
            item.time || '',
            item.location || '',
            parseFloat(item.estimatedCost || 0)
          ]
        );
        insertedItineraries.push(itemResult.rows[0]);
      }
    }

    // Map output to match original payload format
    res.status(201).json({
      id: trip.id,
      userId: trip.user_id,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      budget: trip.budget,
      travelers: trip.travelers,
      travelStyle: trip.travel_style,
      interests: trip.interests,
      createdAt: trip.created_at,
      itineraries: insertedItineraries.map(item => ({
        id: item.id,
        tripId: item.trip_id,
        day: item.day,
        activity: item.activity,
        time: item.time,
        location: item.location,
        estimatedCost: item.estimated_cost
      }))
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing trip
export const updateTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      travelStyle,
      interests,
      itinerary,
    } = req.body;

    // Check if trip exists and belongs to user
    const checkTrip = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (checkTrip.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const trip = checkTrip.rows[0];
    if (trip.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }

    // Prepare update parameters (falling back to current values if undefined)
    const newDestination = destination !== undefined ? destination : trip.destination;
    const newStartDate = startDate !== undefined ? new Date(startDate) : trip.start_date;
    const newEndDate = endDate !== undefined ? new Date(endDate) : trip.end_date;
    const newBudget = budget !== undefined ? parseFloat(budget) : trip.budget;
    const newTravelers = travelers !== undefined ? parseInt(travelers) : trip.travelers;
    const newTravelStyle = travelStyle !== undefined ? travelStyle : trip.travel_style;
    const newInterests = interests !== undefined ? interests : trip.interests;

    // Perform trip update
    const updatedResult = await query(
      `UPDATE trips 
       SET destination = $1, start_date = $2, end_date = $3, budget = $4, travelers = $5, travel_style = $6, interests = $7
       WHERE id = $8 RETURNING *`,
      [newDestination, newStartDate, newEndDate, newBudget, newTravelers, newTravelStyle, newInterests, id]
    );

    const updatedTrip = updatedResult.rows[0];

    // If itinerary was sent, delete old ones and insert new ones
    let insertedItineraries = [];
    if (itinerary) {
      await query('DELETE FROM itinerary WHERE trip_id = $1', [id]);

      for (const item of itinerary) {
        const itemResult = await query(
          `INSERT INTO itinerary (trip_id, day, activity, time, location, estimated_cost)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            id,
            parseInt(item.day),
            item.activity,
            item.time || '',
            item.location || '',
            parseFloat(item.estimatedCost || 0)
          ]
        );
        insertedItineraries.push(itemResult.rows[0]);
      }
    } else {
      // Just fetch existing itineraries if not updated
      const existingItin = await query('SELECT * FROM itinerary WHERE trip_id = $1 ORDER BY day ASC', [id]);
      insertedItineraries = existingItin.rows;
    }

    res.json({
      id: updatedTrip.id,
      userId: updatedTrip.user_id,
      destination: updatedTrip.destination,
      startDate: updatedTrip.start_date,
      endDate: updatedTrip.end_date,
      budget: updatedTrip.budget,
      travelers: updatedTrip.travelers,
      travelStyle: updatedTrip.travel_style,
      interests: updatedTrip.interests,
      createdAt: updatedTrip.created_at,
      itineraries: insertedItineraries.map(item => ({
        id: item.id,
        tripId: item.trip_id,
        day: item.day,
        activity: item.activity,
        time: item.time,
        location: item.location,
        estimatedCost: item.estimated_cost
      }))
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a trip
export const deleteTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const checkTrip = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (checkTrip.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const trip = checkTrip.rows[0];
    if (trip.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this trip' });
    }

    await query('DELETE FROM trips WHERE id = $1', [id]);

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate custom itinerary using Gemini AI
export const generateItinerary = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      travelStyle,
      interests
    } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ message: 'Destination, start date, and end date are required.' });
    }

    const result = await askGeminiForItinerary({
      destination,
      startDate,
      endDate,
      budget: budget || 50000,
      travelers: travelers || 1,
      travelStyle: travelStyle || 'Adventure',
      interests: interests || []
    });

    res.json(result);
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(550).json({ message: error.message || 'Failed to generate itinerary using Gemini.' });
  }
};

