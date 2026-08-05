import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all documents for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, title, type, doc_number, expiry_date, notes, file_name, file_content, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err.message);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

// Create a new document
router.post('/', authMiddleware, async (req, res) => {
  const { title, type, doc_number, expiry_date, notes, file_name, file_content } = req.body;
  if (!title || !type) {
    return res.status(400).json({ message: 'Title and type are required' });
  }
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'INSERT INTO documents (user_id, title, type, doc_number, expiry_date, notes, file_name, file_content) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, title, type, doc_number, expiry_date || null, notes, file_name, file_content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating document:', err.message);
    res.status(550).json({ message: 'DB Error: ' + err.message });
  }
});

// Update an existing document
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, type, doc_number, expiry_date, notes, file_name, file_content } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ message: 'Title and type are required' });
  }
  
  try {
    const userId = req.user.id;
    // Verify ownership
    const checkOwnership = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found or unauthorized' });
    }
    
    const result = await pool.query(
      `UPDATE documents 
       SET title = $1, type = $2, doc_number = $3, expiry_date = $4, notes = $5, file_name = $6, file_content = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, type, doc_number, expiry_date || null, notes, file_name, file_content, id, userId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating document:', err.message);
    res.status(550).json({ message: 'DB Error: ' + err.message });
  }
});

// Delete a document
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const userId = req.user.id;
    // Verify ownership
    const checkOwnership = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found or unauthorized' });
    }
    
    await pool.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err.message);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

export default router;
