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

    const trips = tripsResult.rows;
    const notifications = [];

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

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
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

    await sendTripReminderEmail(user.email, {
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelers: trip.travelers,
      budget: trip.budget
    }, emailAlerts, user.name);

    res.json({ success: true, message: 'Reminder email sent successfully!' });
  } catch (error) {
    console.error('Send email reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
