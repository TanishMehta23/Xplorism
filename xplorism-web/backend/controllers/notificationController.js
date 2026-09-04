import { query } from '../config/db.js';
import { sendTripReminderEmail } from '../services/emailService.js';

// Generate dynamic smart notifications based on user's active trips
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all trips for user
    const tripsResult = await query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date ASC',
      [userId]
    );

    // Fetch pending trip invitations
    const pendingInvitesResult = await query(
      `SELECT tc.trip_id, t.destination, u.name as host_name 
       FROM trip_collaborators tc
       JOIN trips t ON tc.trip_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE tc.user_id = $1 AND tc.status = 'pending'`,
      [userId]
    );

    const trips = tripsResult.rows;
    const notifications = [];

    // Push invitations to notifications
    pendingInvitesResult.rows.forEach((invite) => {
      notifications.push({
        id: `invite-${invite.trip_id}`,
        type: 'invitation',
        title: 'Trip Invitation',
        message: `${invite.host_name} invited you to join a trip to ${invite.destination}!`,
        tripId: invite.trip_id,
        date: new Date()
      });
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    trips.forEach((trip) => {
      const startDate = new Date(trip.start_date);
      startDate.setHours(0, 0, 0, 0);

      const diffTime = startDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 1. Upcoming Trip Reminder (starts in <= 7 days, and is in future or today)
      if (diffDays >= 0 && diffDays <= 7) {
        let msg = `Your trip to ${trip.destination} starts in ${diffDays === 0 ? 'today' : diffDays + ' days'}!`;
        notifications.push({
          id: `trip-rem-${trip.id}`,
          type: 'trip',
          title: 'Upcoming Trip Reminder',
          message: msg,
          tripId: trip.id,
          date: trip.start_date
        });
      }

      // 2. Packing Checklist Alert (starts in <= 7 days and has packing list)
      if (diffDays >= 0 && diffDays <= 7 && trip.packing_list) {
        try {
          const list = Array.isArray(trip.packing_list) ? trip.packing_list : JSON.parse(trip.packing_list || '[]');
          // Count unchecked items
          let uncheckedCount = 0;
          list.forEach(category => {
            if (category.items && Array.isArray(category.items)) {
              category.items.forEach(item => {
                if (!item.checked) {
                  uncheckedCount++;
                }
              });
            }
          });

          if (uncheckedCount > 0) {
            notifications.push({
              id: `pack-rem-${trip.id}`,
              type: 'packing',
              title: 'Packing Alert',
              message: `You still have ${uncheckedCount} items left to pack for your trip to ${trip.destination}!`,
              tripId: trip.id,
              date: trip.start_date
            });
          }
        } catch (e) {
          console.error('Error parsing packing list for notifications:', e);
        }
      }

      // 3. Weather Alert for the trip
      if (diffDays >= 0 && diffDays <= 7) {
        const dest = (trip.destination || '').toLowerCase();
        let weatherMessage = `Pleasant weather expected in ${trip.destination}. Enjoy your travel!`;

        if (dest.includes('london') || dest.includes('paris') || dest.includes('seattle')) {
          weatherMessage = `Expect light showers and chilly winds in ${trip.destination}. Carrying an umbrella is advised.`;
        } else if (dest.includes('tokyo') || dest.includes('delhi')) {
          weatherMessage = `Expect sunny weather in ${trip.destination}. Make sure to carry sunscreen and stay hydrated.`;
        } else if (dest.includes('zurich') || dest.includes('leh') || dest.includes('ladakh') || dest.includes('kashmir')) {
          weatherMessage = `Expect cold conditions in ${trip.destination}. Ensure you pack layers and thermal wear.`;
        }

        notifications.push({
          id: `weather-rem-${trip.id}`,
          type: 'weather',
          title: 'Weather Advisory',
          message: weatherMessage,
          tripId: trip.id,
          date: trip.start_date
        });
      }
    });

    // Fetch collaborative offline notifications
    const dbCollabNotifs = await query(
      `SELECT wn.*, t.destination 
       FROM workspace_notifications wn
       JOIN trips t ON wn.trip_id = t.id
       WHERE wn.user_id = $1 AND wn.is_read = FALSE
       ORDER BY wn.created_at DESC`,
      [userId]
    );

    dbCollabNotifs.rows.forEach((n) => {
      notifications.push({
        id: `collab-${n.id}`,
        type: 'collaborative',
        title: n.title,
        message: `${n.sender_name} ${n.message} (in trip to ${n.destination})`,
        tripId: n.trip_id,
        date: n.created_at
      });
    });

    // Check if user has enabled Email Notifications in Travel Preferences
    const userRes = await query('SELECT email, name, preferences FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    const userPrefs = user?.preferences || {};
    const emailNotifsEnabled = userPrefs.notifications?.emailNotifications ?? true;

    // If email notifications are enabled and there are active trip notifications, send an email summary (rate limited per day)
    if (emailNotifsEnabled && user?.email && notifications.length > 0) {
      const nowTs = Date.now();
      const lastSentTs = userPrefs._lastReminderEmailSent || 0;
      const hoursSinceLast = (nowTs - lastSentTs) / (1000 * 60 * 60);

      // Only auto-send at most once every 12 hours to avoid inbox spamming
      if (hoursSinceLast >= 12) {
        const upcomingTrips = trips.filter(t => {
          const s = new Date(t.start_date);
          s.setHours(0, 0, 0, 0);
          const diff = Math.ceil((s - now) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        });

        if (upcomingTrips.length > 0) {
          const primaryTrip = upcomingTrips[0];
          const relevantAlerts = notifications
            .filter(n => n.tripId === primaryTrip.id && n.type !== 'invitation')
            .map(n => ({ title: n.title, message: n.message }));

          if (relevantAlerts.length > 0) {
            sendTripReminderEmail(user.email, {
              destination: primaryTrip.destination,
              startDate: primaryTrip.start_date,
              endDate: primaryTrip.end_date,
              travelers: primaryTrip.travelers,
              budget: primaryTrip.budget
            }, relevantAlerts, user.name).catch(err => console.error('Error auto-sending reminder email:', err));

            // Record timestamp in user preferences
            const updatedPrefs = { ...userPrefs, _lastReminderEmailSent: nowTs };
            query('UPDATE users SET preferences = $1 WHERE id = $2', [JSON.stringify(updatedPrefs), userId]).catch(() => {});
          }
        }
      }
    }

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTripNotification = async (tripId, senderId, senderName, title, message) => {
  try {
    // 1. Get the trip owner
    const tripCheck = await query('SELECT user_id, destination FROM trips WHERE id = $1', [tripId]);
    if (tripCheck.rows.length === 0) return;
    const trip = tripCheck.rows[0];
    const ownerId = trip.user_id;

    // 2. Get all other collaborators
    const collabsResult = await query(
      `SELECT tc.user_id, u.name 
       FROM trip_collaborators tc 
       JOIN users u ON tc.user_id = u.id 
       WHERE tc.trip_id = $1 AND tc.status = 'approved'`,
      [tripId]
    );

    const targetUsers = [];
    
    // Add owner if owner is not sender
    if (ownerId !== senderId) {
      const ownerRes = await query('SELECT name FROM users WHERE id = $1', [ownerId]);
      if (ownerRes.rows.length > 0) {
        targetUsers.push({ id: ownerId, name: ownerRes.rows[0].name });
      }
    }

    // Add collaborators who are not the sender
    collabsResult.rows.forEach(c => {
      if (c.user_id !== senderId) {
        targetUsers.push({ id: c.user_id, name: c.name });
      }
    });

    // 3. Insert notification for target users who are NOT online in the socket room
    for (const target of targetUsers) {
      const isOnline = global.activeRooms?.[tripId]?.has(target.name);
      if (!isOnline) {
        const insertRes = await query(
          `INSERT INTO workspace_notifications (trip_id, user_id, sender_name, title, message)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
          [tripId, target.id, senderName, title, message]
        );
        
        if (insertRes.rows.length > 0 && global.io) {
          const { id: notifId, created_at: createdAt } = insertRes.rows[0];
          global.io.to(`user-${target.id}`).emit('new-notification', {
            id: `collab-${notifId}`,
            type: 'collaborative',
            title,
            message: `${senderName} ${message} (in trip to ${trip.destination})`,
            tripId,
            date: createdAt
          });
        }
      }
    }
  } catch (err) {
    console.error('Error creating trip notification:', err);
  }
};

// Send email summary of reminders manually or automatically
export const sendEmailReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: 'tripId is required' });
    }

    // Get user details
    const userResult = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    // Get trip details
    const tripResult = await query('SELECT * FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    const trip = tripResult.rows[0];

    // Generate alerts to include in email
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = new Date(trip.start_date);
    startDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));

    const emailAlerts = [];
    if (diffDays >= 0) {
      emailAlerts.push({
        title: 'Upcoming Trip',
        message: `Your trip to ${trip.destination} is starting in ${diffDays} days.`
      });
    }

    // Add packing alert if checklist is active
    if (trip.packing_list) {
      try {
        const list = Array.isArray(trip.packing_list) ? trip.packing_list : JSON.parse(trip.packing_list || '[]');
        let unchecked = [];
        list.forEach(category => {
          if (category.items) {
            category.items.forEach(item => {
              if (!item.checked) unchecked.push(item.name || item);
            });
          }
        });
        if (unchecked.length > 0) {
          emailAlerts.push({
            title: 'Unpacked Items',
            message: `Don't forget to pack: ${unchecked.slice(0, 5).join(', ')}${unchecked.length > 5 ? '... and more' : ''}`
          });
        }
      } catch (err) {}
    }

    // Add weather advisory
    const dest = (trip.destination || '').toLowerCase();
    let wx = `Pleasant conditions expected in ${trip.destination}.`;
    if (dest.includes('london') || dest.includes('paris')) {
      wx = `Light rain/showers expected. Don't forget your umbrella!`;
    } else if (dest.includes('zurich') || dest.includes('leh')) {
      wx = `Cold temperatures expected. Pack some warm layers.`;
    }
    emailAlerts.push({
      title: 'Weather Advisory',
      message: wx
    });

    sendTripReminderEmail(user.email, {
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelers: trip.travelers,
      budget: trip.budget
    }, emailAlerts, user.name).catch(err => {
      console.error('Error sending trip reminder email:', err);
    });

    res.json({ success: true, message: 'Reminder email sent successfully!' });
  } catch (error) {
    console.error('Send email reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
