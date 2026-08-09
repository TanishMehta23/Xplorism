import { query } from '../config/db.js';
import { sendMessage } from '../services/kafkaService.js';
import { sendTripInvitationEmail } from '../services/emailService.js';

// Get shared trips (trips where user is a collaborator)
export const getSharedTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch trips where the user is listed in trip_collaborators OR is the owner and has collaborators
    const tripsResult = await query(
      `SELECT DISTINCT t.*, u.name as owner_name FROM trips t 
       JOIN users u ON t.user_id = u.id
       LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id 
       WHERE (tc.user_id = $1 AND tc.status = 'approved') 
          OR (t.user_id = $1 AND EXISTS (SELECT 1 FROM trip_collaborators tc2 WHERE tc2.trip_id = t.id))
       ORDER BY t.created_at DESC`,
      [userId]
    );

    const trips = tripsResult.rows;

    const tripsWithItineraries = await Promise.all(
      trips.map(async (trip) => {
        const itineraryResult = await query(
          'SELECT * FROM itinerary WHERE trip_id = $1 ORDER BY day ASC',
          [trip.id]
        );

        const collabCountResult = await query(
          "SELECT COUNT(*) FROM trip_collaborators WHERE trip_id = $1 AND status = 'approved'",
          [trip.id]
        );
        const collabCount = parseInt(collabCountResult.rows[0].count) || 0;
        
        return {
          id: trip.id,
          userId: trip.user_id,
          ownerName: trip.owner_name,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          budget: trip.budget,
          travelers: 1 + collabCount,
          travelStyle: trip.travel_style,
          interests: trip.interests,
          createdAt: trip.created_at,
          packingList: trip.packing_list,
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
    console.error('Get shared trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add collaborator to a trip by email
export const addCollaborator = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { email } = req.body;
    const currentUserId = req.user.id;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // 1. Verify that current user is the owner or already a collaborator of the trip
    const tripCheck = await query(
      `SELECT * FROM trips WHERE id = $1`,
      [tripId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    let trip = tripCheck.rows[0];
    let activeTripId = tripId;

    if (trip.user_id !== currentUserId) {
      // Check if they are a collaborator
      const collabCheck = await query(
        `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2`,
        [tripId, currentUserId]
      );
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized to add collaborators to this trip' });
      }
    }

    // 2. Clone the trip to a separate collaborative trip if it is currently personal
    if (!trip.is_collaborative) {
      console.log(`Cloning personal trip ${tripId} into a separate collaborative workspace...`);
      const clonedResult = await query(
        `INSERT INTO trips (user_id, destination, start_date, end_date, budget, travelers, travel_style, interests, packing_list, notes, is_collaborative)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) RETURNING *`,
        [
          trip.user_id,
          trip.destination,
          trip.start_date,
          trip.end_date,
          trip.budget,
          trip.travelers,
          trip.travel_style,
          trip.interests,
          trip.packing_list ? JSON.stringify(trip.packing_list) : null,
          trip.notes || ''
        ]
      );
      const clonedTrip = clonedResult.rows[0];
      activeTripId = clonedTrip.id;
      trip = clonedTrip;

      // Copy itinerary items
      const itineraries = await query('SELECT * FROM itinerary WHERE trip_id = $1', [tripId]);
      for (const item of itineraries.rows) {
        await query(
          `INSERT INTO itinerary (trip_id, day, activity, time, location, estimated_cost)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [activeTripId, item.day, item.activity, item.time, item.location, item.estimated_cost]
        );
      }

      // Copy expenses
      const expenses = await query('SELECT * FROM expenses WHERE trip_id = $1', [tripId]);
      for (const item of expenses.rows) {
        await query(
          `INSERT INTO expenses (trip_id, day, category, item_name, planned_amount, actual_amount, currency, date, notes, paid_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            activeTripId,
            item.day,
            item.category,
            item.item_name,
            item.planned_amount,
            item.actual_amount,
            item.currency,
            item.date,
            item.notes,
            item.paid_by
          ]
        );
      }
    }

    const tripOwnerId = trip.user_id;

    // 3. Find target user by email
    const userResult = await query(
      `SELECT id, name, email FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    const targetUser = userResult.rows[0];

    // 4. Prevent adding the owner
    if (targetUser.id === tripOwnerId) {
      return res.status(400).json({ message: 'Trip owner is already collaborator' });
    }

    // 5. Insert into trip_collaborators with pending status
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, status) 
       VALUES ($1, $2, 'pending') 
       ON CONFLICT (trip_id, user_id) DO NOTHING`,
      [activeTripId, targetUser.id]
    );

    // 6. Send invitation email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const hostName = req.user.name || 'A fellow traveler';
    const approveUrl = `${clientUrl}/trip-invite/respond?tripId=${activeTripId}&status=approved`;
    const declineUrl = `${clientUrl}/trip-invite/respond?tripId=${activeTripId}&status=declined`;

    sendTripInvitationEmail(targetUser.email, trip, hostName, approveUrl, declineUrl).catch(err => {
      console.error('Error sending invitation email:', err);
    });

    // 7. Emit real-time notification to the invited user's socket room
    if (global.io) {
      global.io.to(`user-${targetUser.id}`).emit('new-notification', {
        id: `invite-${activeTripId}`,
        type: 'invitation',
        title: 'Trip Invitation',
        message: `${hostName} invited you to join a trip to ${trip.destination}!`,
        tripId: activeTripId,
        date: new Date()
      });
      global.io.to(activeTripId).emit('collaborators-updated');
    }

    res.status(201).json({
      message: 'Collaborator invited successfully. An invitation email has been sent.',
      tripId: activeTripId,
      cloned: activeTripId !== tripId,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get collaborators for a trip
export const getCollaborators = async (req, res) => {
  try {
    const { id: tripId } = req.params;

    // Get owner details
    const ownerResult = await query(
      `SELECT u.id, u.name, u.email FROM users u 
       JOIN trips t ON t.user_id = u.id 
       WHERE t.id = $1`,
      [tripId]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const owner = {
      ...ownerResult.rows[0],
      role: 'owner'
    };

    // Get collaborators
    const collaboratorsResult = await query(
      `SELECT u.id, u.name, u.email, tc.status FROM users u
       JOIN trip_collaborators tc ON tc.user_id = u.id
       WHERE tc.trip_id = $1`,
      [tripId]
    );

    const collaborators = collaboratorsResult.rows.map(c => ({
      ...c,
      role: 'collaborator'
    }));

    res.json([owner, ...collaborators]);
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove collaborator from trip
export const removeCollaborator = async (req, res) => {
  try {
    const { id: tripId, userId } = req.params;
    const currentUserId = req.user.id;

    // Verify trip exists
    const tripCheck = await query(`SELECT user_id FROM trips WHERE id = $1`, [tripId]);
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const tripOwnerId = tripCheck.rows[0].user_id;

    // Only owner can remove someone, or collaborators can remove themselves
    if (currentUserId !== tripOwnerId && currentUserId !== userId) {
      return res.status(403).json({ message: 'Not authorized to remove this collaborator' });
    }

    await query(
      `DELETE FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2`,
      [tripId, userId]
    );

    if (global.io) {
      global.io.to(tripId).emit('collaborators-updated');
    }

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trip chat messages
export const getTripMessages = async (req, res) => {
  try {
    const { id: tripId } = req.params;

    const result = await query(
      `SELECT tm.id, tm.trip_id as "tripId", tm.user_id as "userId", tm.sender_name as "senderName", tm.message, tm.created_at as "createdAt"
       FROM trip_messages tm
       WHERE tm.trip_id = $1
       ORDER BY tm.created_at ASC`,
      [tripId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get trip messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Post chat message (Sends via Kafka)
export const postTripMessage = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const senderName = req.user.name;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Save to DB first for persistence
    const dbResult = await query(
      `INSERT INTO trip_messages (trip_id, user_id, sender_name, message) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, trip_id as "tripId", user_id as "userId", sender_name as "senderName", message, created_at as "createdAt"`,
      [tripId, userId, senderName, message]
    );

    const savedMessage = dbResult.rows[0];

    // Broadcast message via Kafka
    await sendMessage('trip-chat', tripId, savedMessage);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Post trip message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join trip (add current user as collaborator)
export const joinTrip = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const userId = req.user.id;

    // Verify trip exists
    const tripCheck = await query(`SELECT user_id FROM trips WHERE id = $1`, [tripId]);
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const tripOwnerId = tripCheck.rows[0].user_id;

    // If owner, they are already host
    if (tripOwnerId === userId) {
      return res.json({ message: 'You are the host of this trip', role: 'owner' });
    }

    // Add as collaborator
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, status) 
       VALUES ($1, $2, 'approved') 
       ON CONFLICT (trip_id, user_id) DO UPDATE SET status = 'approved'`,
      [tripId, userId]
    );

    res.status(200).json({ message: 'Joined trip successfully', role: 'collaborator' });
  } catch (error) {
    console.error('Join trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Respond to trip invitation (approve/decline)
export const respondToInvitation = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { status } = req.body; // 'approved' or 'declined'
    const userId = req.user.id;

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or declined.' });
    }

    // Verify collaborator entry exists for this user
    const collabCheck = await query(
      `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2`,
      [tripId, userId]
    );

    if (collabCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Invitation not found or unauthorized.' });
    }

    if (status === 'approved') {
      await query(
        `UPDATE trip_collaborators SET status = 'approved' WHERE trip_id = $1 AND user_id = $2`,
        [tripId, userId]
      );
      if (global.io) {
        global.io.to(tripId).emit('collaborators-updated');
      }
      res.json({ message: 'Invitation approved successfully' });
    } else {
      await query(
        `DELETE FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2`,
        [tripId, userId]
      );
      if (global.io) {
        global.io.to(tripId).emit('collaborators-updated');
      }
      res.json({ message: 'Invitation declined successfully' });
    }
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
