import { query } from '../config/db.js';

// Get user preferences
export const getPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await query('SELECT preferences FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preferences = result.rows[0].preferences || {};

    res.status(200).json({
      status: 200,
      message: 'Preferences retrieved successfully',
      data: preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Failed to retrieve preferences' });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      preferredTravelStyle,
      preferredCurrency,
      timezone,
      dateFormat,
      temperatureUnit,
      emailNotifications,
      weeklyDigest,
      favoriteThemes
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Build preferences object
    const preferences = {
      preferredTravelStyle: preferredTravelStyle || 'Balanced Mix',
      preferredCurrency: preferredCurrency || 'USD ($)',
      locale: {
        timezone: timezone || 'IST (GMT+5:30)',
        dateFormat: dateFormat || 'DD/MM/YYYY'
      },
      display: {
        temperatureUnit: temperatureUnit || 'C',
        theme: 'auto'
      },
      notifications: {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        weeklyDigest: weeklyDigest !== undefined ? weeklyDigest : false
      },
      favoriteThemes: favoriteThemes || ['Nature', 'History', 'Food', 'Shopping']
    };

    // Update preferences in database
    const result = await query(
      'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING id, preferences',
      [JSON.stringify(preferences), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      status: 200,
      message: 'Preferences updated successfully',
      data: result.rows[0].preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Partial update preferences (merge with existing)
export const partialUpdatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get current preferences
    const currentResult = await query('SELECT preferences FROM users WHERE id = $1', [userId]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Merge with existing preferences
    const currentPreferences = currentResult.rows[0].preferences || {};
    const mergedPreferences = {
      preferredTravelStyle: updates.preferredTravelStyle || currentPreferences.preferredTravelStyle || 'Balanced Mix',
      preferredCurrency: updates.preferredCurrency || currentPreferences.preferredCurrency || 'USD ($)',
      locale: {
        timezone: updates.timezone || currentPreferences.locale?.timezone || 'IST (GMT+5:30)',
        dateFormat: updates.dateFormat || currentPreferences.locale?.dateFormat || 'DD/MM/YYYY'
      },
      display: {
        temperatureUnit: updates.temperatureUnit || currentPreferences.display?.temperatureUnit || 'C',
        theme: currentPreferences.display?.theme || 'auto'
      },
      notifications: {
        emailNotifications: updates.emailNotifications !== undefined ? updates.emailNotifications : (currentPreferences.notifications?.emailNotifications ?? true),
        weeklyDigest: updates.weeklyDigest !== undefined ? updates.weeklyDigest : (currentPreferences.notifications?.weeklyDigest ?? false)
      },
      favoriteThemes: updates.favoriteThemes || currentPreferences.favoriteThemes || ['Nature', 'History', 'Food', 'Shopping']
    };

    // Update preferences in database
    const result = await query(
      'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING id, preferences',
      [JSON.stringify(mergedPreferences), userId]
    );

    res.status(200).json({
      status: 200,
      message: 'Preferences updated successfully',
      data: result.rows[0].preferences
    });
  } catch (error) {
    console.error('Partial update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};
