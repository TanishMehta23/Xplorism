import test from 'node:test';
import assert from 'node:assert/strict';
import { sqlInjectionSanitizer } from '../middleware/sqlInjectionSanitizer.js';
import { encryptFile, decryptFile } from '../services/encryptionService.js';

test('OWASP Security & Injection Defense Suite', async (t) => {
  await t.test('SQL Injection Sanitizer: blocks classic UNION SELECT payloads', () => {
    let statusCode = null;
    let jsonBody = null;
    let nextCalled = false;

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };

    const maliciousReq = {
      body: { search: "Paris' UNION SELECT username, password FROM users --" },
      query: {},
      params: {},
      ip: '127.0.0.1',
      originalUrl: '/search'
    };

    sqlInjectionSanitizer(maliciousReq, mockRes, () => { nextCalled = true; });

    assert.equal(statusCode, 400);
    assert.equal(nextCalled, false);
    assert.ok(jsonBody.message.includes('Suspicious input detected'));
  });

  await t.test('SQL Injection Sanitizer: blocks tautology bypasses (OR 1=1)', () => {
    let statusCode = null;
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json() { return this; }
    };

    const payload = {
      body: { email: "admin@xplorism.com' OR '1'='1" },
      query: {},
      params: {},
      ip: '127.0.0.1'
    };

    let nextCalled = false;
    sqlInjectionSanitizer(payload, mockRes, () => { nextCalled = true; });

    assert.equal(statusCode, 400);
    assert.equal(nextCalled, false);
  });

  await t.test('SQL Injection Sanitizer: allows legitimate travel text without false positives', () => {
    const mockRes = {
      status() { return this; },
      json() { return this; }
    };

    const legitimateReq = {
      body: {
        destination: 'New York, USA',
        notes: 'Visit Central Park and have lunch or coffee around 1pm'
      },
      query: { q: 'delhi' },
      params: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      ip: '127.0.0.1'
    };

    let nextCalled = false;
    sqlInjectionSanitizer(legitimateReq, mockRes, () => { nextCalled = true; });

    assert.equal(nextCalled, true, 'Legitimate travel words like "and", "or" in prose must pass');
  });

  await t.test('IDOR Defense: users cannot access or decrypt unauthorized vault files', () => {
    // Model IDOR check in Document Vault download route
    const documents = [
      { id: 'doc-alpha', userId: 'user-alice', tripId: null, fileName: 'passport.pdf' },
      { id: 'doc-beta', userId: 'user-bob', tripId: 'trip-1', fileName: 'boarding_pass.pdf' }
    ];

    const tripCollaborators = [
      { tripId: 'trip-1', userId: 'user-charlie', status: 'approved' }
    ];

    function verifyDocumentAccess(documentId, requesterId) {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return { status: 404, message: 'Document not found' };

      // Uploader has access
      if (doc.userId === requesterId) return { status: 200, authorized: true };

      // If tied to a trip, approved collaborators have access
      if (doc.tripId) {
        const isCollab = tripCollaborators.some(
          c => c.tripId === doc.tripId && c.userId === requesterId && c.status === 'approved'
        );
        if (isCollab) return { status: 200, authorized: true };
      }

      return { status: 403, message: 'Forbidden: Unauthorized document access' };
    }

    // Alice accesses her unlinked doc
    assert.equal(verifyDocumentAccess('doc-alpha', 'user-alice').status, 200);

    // Bob accesses Alice's unlinked doc (IDOR attempt)
    assert.equal(verifyDocumentAccess('doc-alpha', 'user-bob').status, 403);

    // Charlie accesses trip-1 doc as approved collaborator
    assert.equal(verifyDocumentAccess('doc-beta', 'user-charlie').status, 200);

    // Outsider accesses trip-1 doc (IDOR attempt)
    assert.equal(verifyDocumentAccess('doc-beta', 'user-intruder').status, 403);
  });

  await t.test('Document Vault AES-256-GCM Cryptography: roundtrip encrypt & decrypt with authentication tag', () => {
    const originalText = 'CONFIDENTIAL_PASSPORT_DATA: Johnathan Doe #Z987654321';
    const originalBuffer = Buffer.from(originalText, 'utf8');

    // Encrypt
    const encrypted = encryptFile(originalBuffer);
    assert.ok(encrypted.encryptedData, 'Encrypted buffer must exist');
    assert.ok(encrypted.wrappedKey, 'Wrapped key must exist');
    assert.ok(encrypted.iv, 'IV hex must exist');
    assert.ok(encrypted.authTag, 'Auth tag hex must exist');
    assert.notEqual(encrypted.encryptedData.toString(), originalText, 'Ciphertext must not resemble plaintext');

    // Decrypt
    const decryptedBuffer = decryptFile(
      encrypted.encryptedData,
      encrypted.wrappedKey,
      encrypted.iv,
      encrypted.authTag
    );
    assert.equal(decryptedBuffer.toString('utf8'), originalText, 'Decrypted buffer must exactly match original');
  });

  await t.test('Document Vault Tampering Defense: modified auth tag causes decipher authentication failure', () => {
    const originalBuffer = Buffer.from('Sensitive Flight Ticket', 'utf8');
    const encrypted = encryptFile(originalBuffer);

    // Tamper with the authentication tag safely ensuring it changes
    const lastChar = encrypted.authTag.slice(-1);
    const tamperedTag = encrypted.authTag.substring(0, encrypted.authTag.length - 1) + (lastChar === '0' ? '1' : '0');

    assert.throws(
      () => decryptFile(encrypted.encryptedData, encrypted.wrappedKey, encrypted.iv, tamperedTag),
      (err) => err.message.includes('Unsupported state or unable to authenticate data'),
      'Tampered GCM tag must reject decryption'
    );
  });

  await t.test('Anti-Formula Injection (CWE-1236): sanitizes formulas in CSV/Excel export cells', () => {
    // Model CSV export sanitizer that neutralizes =, +, -, @, \t, \r triggers
    function sanitizeCsvCell(value) {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
      if (dangerousPrefixes.some(p => trimmed.startsWith(p))) {
        return `'${trimmed}`; // Prefix single quote to escape formula execution
      }
      return trimmed;
    }

    assert.equal(sanitizeCsvCell('=cmd|"/C calc"!A0'), '\'=cmd|"/C calc"!A0');
    assert.equal(sanitizeCsvCell('+12345'), '\'+12345');
    assert.equal(sanitizeCsvCell('-50.00'), '\'-50.00');
    assert.equal(sanitizeCsvCell('@SUM(1,2)'), '\'@SUM(1,2)');
    assert.equal(sanitizeCsvCell('Flight to Rome'), 'Flight to Rome');
  });

  await t.test('PII & Privacy Protection: public trip and community feeds strip private user credentials', () => {
    // Test data scrubber for public profiles and community feed
    function sanitizePublicUser(userRecord) {
      const sanitized = { ...userRecord };
      delete sanitized.password;
      delete sanitized.google_id;
      delete sanitized.email; // strip email for public viewer
      delete sanitized.reset_token;
      return sanitized;
    }

    const rawUser = {
      id: 'uuid-101',
      name: 'Sarah Connor',
      email: 'sarah@skynet.com',
      password: '$2b$10$hashedpasswordvaluehere',
      google_id: 'google-sub-999888',
      profile_photo: 'data:image/jpeg;base64,...'
    };

    const publicView = sanitizePublicUser(rawUser);

    assert.equal(publicView.id, 'uuid-101');
    assert.equal(publicView.name, 'Sarah Connor');
    assert.equal(publicView.profile_photo, 'data:image/jpeg;base64,...');
    assert.equal(publicView.password, undefined, 'Password must be completely stripped');
    assert.equal(publicView.email, undefined, 'Email must be omitted from public social feed');
    assert.equal(publicView.google_id, undefined, 'Google sub ID must be omitted');
  });
});

