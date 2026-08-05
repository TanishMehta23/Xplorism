import { query } from '../config/db.js';

/**
 * GET /api/favorites
 * Get all favorites for the authenticated user
 */
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows.map(fav => ({
      id: fav.id,
      name: fav.name,
      type: fav.type,
      description: fav.description,
      location: fav.location,
      distance: fav.distance,
      category: fav.category,
      imageUrl: fav.image_url,
      destination: fav.destination,
      tripId: fav.trip_id,
      metadata: fav.metadata,
      createdAt: fav.created_at,
    })));
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/favorites
 * Add a new favorite
 */
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      type,
      description,
      location,
      distance,
      category,
      imageUrl,
      destination,
      tripId,
      metadata,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if already favorited (avoid duplicates)
    const existing = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND name = $2 AND destination = $3',
      [userId, name, destination || '']
    );
    if (existing.rows.length > 0) {
      // Toggle: remove if already exists
      await query('DELETE FROM favorites WHERE id = $1', [existing.rows[0].id]);
      return res.json({ message: 'Removed from favorites', favorited: false, id: existing.rows[0].id });
    }

    const isValidUuid = (uuidStr) => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuidStr);
    };

    const dbTripId = (tripId && isValidUuid(tripId)) ? tripId : null;

    const result = await query(
      `INSERT INTO favorites (user_id, name, type, description, location, distance, category, image_url, destination, trip_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        userId,
        name,
        type || 'attraction',
        description || '',
        location || '',
        distance || '',
        category || '',
        imageUrl || '',
        destination || '',
        dbTripId,
        metadata ? JSON.stringify(metadata) : '{}',
      ]
    );

    const fav = result.rows[0];
    res.status(201).json({
      id: fav.id,
      name: fav.name,
      type: fav.type,
      description: fav.description,
      location: fav.location,
      distance: fav.distance,
      category: fav.category,
      imageUrl: fav.image_url,
      destination: fav.destination,
      tripId: fav.trip_id,
      metadata: fav.metadata,
      createdAt: fav.created_at,
      favorited: true,
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/favorites/:id
 * Remove a favorite
 */
export const deleteFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const check = await query('SELECT * FROM favorites WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await query('DELETE FROM favorites WHERE id = $1', [id]);
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/favorites/check
 * Check if a specific item is favorited (by name + destination)
 */
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, destination } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Name query param is required' });
    }

    const result = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND name = $2 AND destination = $3',
      [userId, name, destination || '']
    );

    res.json({ favorited: result.rows.length > 0, id: result.rows[0]?.id || null });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

