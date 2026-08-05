import { query } from '../config/db.js';

/**
 * GET /posts
 * Retrieve all community posts
 */
export const getPosts = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error retrieving feed' });
  }
};

/**
 * POST /posts
 * Create a new travel experience post
 */
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, tripDestination, photoContent } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Get user's name
    const userResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0]?.name || 'Traveler';

    const result = await query(
      `INSERT INTO posts (user_id, username, trip_destination, title, content, photo_content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, username, tripDestination || null, title, content, photoContent || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating experience' });
  }
};

/**
 * POST /posts/:id/like
 * Toggle like status on a post
 */
export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const postResult = await query('SELECT * FROM posts WHERE id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = postResult.rows[0];
    const likedBy = post.liked_by || [];
    const isLiked = likedBy.includes(userId);

    let updatedLikedBy;
    let newLikesCount;

    if (isLiked) {
      // Unlike
      updatedLikedBy = likedBy.filter(uid => uid !== userId);
      newLikesCount = Math.max(0, post.likes - 1);
    } else {
      // Like
      updatedLikedBy = [...likedBy, userId];
      newLikesCount = post.likes + 1;
    }

    const result = await query(
      `UPDATE posts 
       SET likes = $1, liked_by = $2 
       WHERE id = $3 RETURNING *`,
      [newLikesCount, updatedLikedBy, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

/**
 * PUT /posts/:id
 * Edit an existing post
 */
export const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, tripDestination, photoContent } = req.body;

    const postResult = await query('SELECT * FROM posts WHERE id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = postResult.rows[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this post' });
    }

    const result = await query(
      `UPDATE posts 
       SET title = $1, content = $2, trip_destination = $3, photo_content = $4
       WHERE id = $5 RETURNING *`,
      [title || post.title, content || post.content, tripDestination, photoContent, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error updating post' });
  }
};

/**
 * DELETE /posts/:id
 * Remove a post
 */
export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const postResult = await query('SELECT * FROM posts WHERE id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = postResult.rows[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post successfully deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};
