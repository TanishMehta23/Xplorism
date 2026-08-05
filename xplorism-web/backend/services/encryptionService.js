import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Deriving the Master Key (32 bytes) from VAULT_MASTER_KEY or JWT_SECRET
const getMasterKey = () => {
  const secret = process.env.VAULT_MASTER_KEY || process.env.JWT_SECRET || 'fallback-secure-master-key-xplorism';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts a plaintext string/buffer using AES-256-GCM.
 * Generates a unique file key, encrypts the file key using the master key (Key Wrapping),
 * and encrypts the file.
 * 
 * @param {Buffer|string} data 
 * @returns {Object} { encryptedData, wrappedKey, iv, authTag }
 */
export function encryptFile(data) {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  
  // 1. Generate unique key for this file (AES-256-GCM)
  const fileKey = crypto.randomBytes(32);
  const fileIv = crypto.randomBytes(12);
  
  // 2. Encrypt the file data
  const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, fileIv);
  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const fileAuthTag = cipher.getAuthTag();
  
  // 3. Wrap/Encrypt the fileKey using the Master Key
  const masterKey = getMasterKey();
  const wrapperIv = crypto.randomBytes(12);
  const keyCipher = crypto.createCipheriv('aes-256-gcm', masterKey, wrapperIv);
  const encryptedKey = Buffer.concat([keyCipher.update(fileKey), keyCipher.final()]);
  const keyAuthTag = keyCipher.getAuthTag();
  
  // Format wrappedKey as wrapperIv:keyAuthTag:encryptedKey
  const wrappedKey = `${wrapperIv.toString('hex')}:${keyAuthTag.toString('hex')}:${encryptedKey.toString('hex')}`;
  
  return {
    encryptedData,
    wrappedKey,
    iv: fileIv.toString('hex'),
    authTag: fileAuthTag.toString('hex')
  };
}

/**
 * Decrypts encrypted file data using the wrapped key, IV, and auth tag.
 * Unwraps the file key using the master key, then decrypts the file data.
 * 
 * @param {Buffer} encryptedData 
 * @param {string} wrappedKey 
 * @param {string} iv 
 * @param {string} authTag 
 * @returns {Buffer} decrypted plaintext buffer
 */
export function decryptFile(encryptedData, wrappedKey, iv, authTag) {
  const [wrapperIvHex, keyAuthTagHex, encryptedKeyHex] = wrappedKey.split(':');
  if (!wrapperIvHex || !keyAuthTagHex || !encryptedKeyHex) {
    throw new Error('Invalid wrapped key format');
  }
  
  const masterKey = getMasterKey();
  
  // 1. Unwrap the file key
  const wrapperIv = Buffer.from(wrapperIvHex, 'hex');
  const keyAuthTag = Buffer.from(keyAuthTagHex, 'hex');
  const encryptedKey = Buffer.from(encryptedKeyHex, 'hex');
  
  const keyDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, wrapperIv);
  keyDecipher.setAuthTag(keyAuthTag);
  const fileKey = Buffer.concat([keyDecipher.update(encryptedKey), keyDecipher.final()]);
  
  // 2. Decrypt the file data
  const fileIv = Buffer.from(iv, 'hex');
  const fileAuthTag = Buffer.from(authTag, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', fileKey, fileIv);
  decipher.setAuthTag(fileAuthTag);
  
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}
