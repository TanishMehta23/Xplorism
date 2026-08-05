import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middleware/auth.js';
import { encryptFile, decryptFile } from '../services/encryptionService.js';
import { saveEncryptedFile, getEncryptedFile, deleteEncryptedFile } from '../services/storageService.js';
import crypto from 'crypto';

const router = express.Router();

// Get all documents for logged in user (Metadata only!)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, title, type, file_name, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err.message);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

// Securely download/retrieve decrypted file content
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership and fetch encryption metadata
    const result = await pool.query(
      'SELECT id, file_name, encrypted_file_key, iv, auth_tag FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found or unauthorized' });
    }

    const doc = result.rows[0];
    if (!doc.encrypted_file_key || !doc.iv || !doc.auth_tag) {
      return res.status(400).json({ message: 'This document was not stored securely' });
    }

    // Read the encrypted file from vault storage
    const encryptedData = getEncryptedFile(doc.id);

    // Decrypt the file data in memory
    const decryptedBuffer = decryptFile(encryptedData, doc.encrypted_file_key, doc.iv, doc.auth_tag);
    
    // Return decrypted content (as base64 string/data URL)
    res.json({
      file_content: decryptedBuffer.toString('utf8'),
      file_name: doc.file_name
    });
  } catch (err) {
    console.error('Error downloading document:', err.message);
    res.status(500).json({ message: 'Server error downloading document' });
  }
});

// Create a new document with AES-256-GCM encryption
router.post('/', authMiddleware, async (req, res) => {
  const { title, type, file_name, file_content } = req.body;
  if (!title || !type) {
    return res.status(400).json({ message: 'Title and type are required' });
  }
  try {
    const userId = req.user.id;
    const docId = crypto.randomUUID();

    let wrappedKey = null;
    let iv = null;
    let authTag = null;

    if (file_content) {
      // Validate file size (10MB limit)
      const base64Data = file_content.includes('base64,') ? file_content.split('base64,')[1] : file_content;
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > MAX_SIZE) {
        return res.status(400).json({ message: 'File size exceeds the 10MB limit' });
      }

      // Encrypt the file content string using AES-256-GCM
      const encryption = encryptFile(file_content);
      wrappedKey = encryption.wrappedKey;
      iv = encryption.iv;
      authTag = encryption.authTag;

      // Save encrypted file to vault storage
      saveEncryptedFile(docId, encryption.encryptedData);
    }

    const result = await pool.query(
      'INSERT INTO documents (id, user_id, title, type, file_name, encrypted_file_key, iv, auth_tag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, title, type, file_name, created_at',
      [docId, userId, title, type, file_name, wrappedKey, iv, authTag]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating document:', err.message);
    res.status(500).json({ message: 'DB Error: ' + err.message });
  }
});

// Update an existing document
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, type, file_name, file_content } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ message: 'Title and type are required' });
  }
  
  try {
    const userId = req.user.id;
    // Verify ownership
    const checkOwnership = await pool.query(
      'SELECT id, encrypted_file_key, iv, auth_tag FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found or unauthorized' });
    }

    const existingDoc = checkOwnership.rows[0];
    let wrappedKey = existingDoc.encrypted_file_key;
    let iv = existingDoc.iv;
    let authTag = existingDoc.auth_tag;

    // If new file content is provided, encrypt it and overwrite the stored file
    if (file_content && !file_content.startsWith('data:') && file_content.length < 100 && file_content === existingDoc.file_name) {
      // No file change (frontend might pass the filename as placeholder if file didn't change)
    } else if (file_content) {
      // Validate file size (10MB limit)
      const base64Data = file_content.includes('base64,') ? file_content.split('base64,')[1] : file_content;
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > MAX_SIZE) {
        return res.status(400).json({ message: 'File size exceeds the 10MB limit' });
      }

      const encryption = encryptFile(file_content);
      wrappedKey = encryption.wrappedKey;
      iv = encryption.iv;
      authTag = encryption.authTag;

      // Overwrite the encrypted file
      saveEncryptedFile(id, encryption.encryptedData);
    }
    
    const result = await pool.query(
      `UPDATE documents 
       SET title = $1, type = $2, file_name = $3, encrypted_file_key = $4, iv = $5, auth_tag = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, title, type, file_name, created_at`,
      [title, type, file_name, wrappedKey, iv, authTag, id, userId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating document:', err.message);
    res.status(500).json({ message: 'DB Error: ' + err.message });
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
    
    // Delete encrypted file from storage
    deleteEncryptedFile(id);

    // Delete metadata from database
    await pool.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err.message);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

export default router;
