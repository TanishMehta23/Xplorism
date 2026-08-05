import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The vault storage directory
const STORAGE_DIR = path.resolve(__dirname, '../vault_storage');

// Helper to ensure storage directory exists
const ensureStorageDir = () => {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
};

/**
 * Validates the file ID to prevent directory traversal.
 * Only alphanumeric characters and dashes/underscores are allowed.
 */
const validateId = (id) => {
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    throw new Error('Security Error: Invalid document storage ID');
  }
};

/**
 * Saves encrypted binary data to the vault storage.
 * @param {string} docId - The document's UUID or ID
 * @param {Buffer} encryptedBuffer - The encrypted file data
 */
export function saveEncryptedFile(docId, encryptedBuffer) {
  validateId(docId);
  ensureStorageDir();
  
  const targetPath = path.join(STORAGE_DIR, docId);
  fs.writeFileSync(targetPath, encryptedBuffer);
}

/**
 * Reads encrypted file data from the vault storage.
 * @param {string} docId - The document's UUID or ID
 * @returns {Buffer} The encrypted file data
 */
export function getEncryptedFile(docId) {
  validateId(docId);
  
  const targetPath = path.join(STORAGE_DIR, docId);
  if (!fs.existsSync(targetPath)) {
    throw new Error('Encrypted file not found in storage');
  }
  
  return fs.readFileSync(targetPath);
}

/**
 * Deletes encrypted file from the vault storage.
 * @param {string} docId - The document's UUID or ID
 */
export function deleteEncryptedFile(docId) {
  validateId(docId);
  
  const targetPath = path.join(STORAGE_DIR, docId);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
}
