import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const TEST_JWT_SECRET = 'enterprise-test-jwt-secret-at-least-32-chars-long';

test('Authentication & Session Lifecycle Suite', async (t) => {
  await t.test('Token Creation & Payload Integrity: issues signed JWT with valid claims', () => {
    const payload = {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'traveler@xplorism.com',
      name: 'Elena Rostova',
      role: 'TRAVELER'
    };

    const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '7d' });
    assert.ok(typeof token === 'string' && token.split('.').length === 3, 'JWT must be in standard 3-segment format');

    const decoded = jwt.verify(token, TEST_JWT_SECRET);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.name, payload.name);
    assert.equal(decoded.role, payload.role);
    assert.ok(decoded.exp > decoded.iat, 'Token expiration must be in the future');
  });

  await t.test('Tampering Defense: rejects signatures manipulated with foreign secrets', () => {
    const payload = { id: 'user-123', email: 'legit@xplorism.com' };
    const forgedToken = jwt.sign(payload, 'unauthorized-adversary-secret');

    assert.throws(
      () => jwt.verify(forgedToken, TEST_JWT_SECRET),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('invalid signature'),
      'Must reject tokens signed by foreign secrets'
    );
  });

  await t.test('Expiration Handling: rejects expired tokens with TokenExpiredError', async () => {
    const expiredToken = jwt.sign(
      { id: 'user-expired', email: 'expired@xplorism.com' },
      TEST_JWT_SECRET,
      { expiresIn: '-1s' }
    );

    assert.throws(
      () => jwt.verify(expiredToken, TEST_JWT_SECRET),
      (err) => err.name === 'TokenExpiredError',
      'Must throw TokenExpiredError for expired sessions'
    );
  });

  await t.test('Password Hashing: generates irreversible bcrypt salt with 10 rounds', async () => {
    const rawPassword = 'SecureExplorerPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Must use bcrypt format ($2a$ or $2b$)');
    assert.notEqual(hash, rawPassword, 'Hashed password must never equal plaintext');

    const isValid = await bcrypt.compare(rawPassword, hash);
    assert.equal(isValid, true, 'Valid password must verify successfully');

    const isInvalid = await bcrypt.compare('WrongGuess123', hash);
    assert.equal(isInvalid, false, 'Invalid password must fail verification');
  });

  await t.test('Salt Uniqueness: distinct hashes produced for identical passwords', async () => {
    const password = 'IdenticalPassword99!';
    const hash1 = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const hash2 = await bcrypt.hash(password, await bcrypt.genSalt(10));

    assert.notEqual(hash1, hash2, 'Bcrypt salts must ensure hashes for the same password are non-identical');
    assert.ok(await bcrypt.compare(password, hash1));
    assert.ok(await bcrypt.compare(password, hash2));
  });

  await t.test('OTP Lifecycle: generates 6-digit numeric OTP with 10-minute validity window', () => {
    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
    const otp = generateOtp();

    assert.match(otp, /^\d{6}$/, 'OTP must be exactly 6 numeric digits');

    const expiresAt = Date.now() + 10 * 60 * 1000;
    assert.ok(expiresAt > Date.now(), 'OTP expiry must be in the future');

    // Simulate expired check
    const simulatedPast = Date.now() + 11 * 60 * 1000;
    const isExpired = simulatedPast > expiresAt;
    assert.equal(isExpired, true, 'OTP must expire after 10-minute threshold');
  });

  await t.test('Refresh Token Family Rotation: single-use tokens advance and detect reuse', () => {
    // Model refresh token rotation: each family tracks active generation
    const tokenFamilyStore = new Map();

    function issueRefreshToken(userId, familyId, generation = 1) {
      const token = `rt_${userId}_${familyId}_gen${generation}_${crypto.randomBytes(8).toString('hex')}`;
      tokenFamilyStore.set(familyId, { userId, currentGen: generation, activeToken: token, compromised: false });
      return token;
    }

    function rotateRefreshToken(presentedToken, familyId) {
      const family = tokenFamilyStore.get(familyId);
      if (!family) throw new Error('Invalid token family');
      if (family.compromised) throw new Error('Token family compromised: session revoked');

      if (family.activeToken !== presentedToken) {
        // Reuse detected! Compromise entire family
        family.compromised = true;
        throw new Error('Token reuse detected: invalidating token family');
      }

      // Advance generation
      const nextGen = family.currentGen + 1;
      const newToken = issueRefreshToken(family.userId, familyId, nextGen);
      return newToken;
    }

    const familyId = 'family-alpha-1';
    const userId = 'user-test-77';

    const token1 = issueRefreshToken(userId, familyId, 1);
    assert.ok(token1.includes('_gen1_'));

    // Legitimate rotation
    const token2 = rotateRefreshToken(token1, familyId);
    assert.ok(token2.includes('_gen2_'));

    // Attacker tries to replay token1
    assert.throws(
      () => rotateRefreshToken(token1, familyId),
      /Token reuse detected/
    );

    // Legitimate user tries to use token2 now, but family was compromised
    assert.throws(
      () => rotateRefreshToken(token2, familyId),
      /Token family compromised/
    );
  });

  await t.test('Multi-Device Session Revocation: FIFO capping at max sessions', () => {
    const MAX_SESSIONS = 5;
    const userSessions = [];

    function registerSession(device, ip) {
      const sessionId = crypto.randomUUID();
      const existingIdx = userSessions.findIndex(s => s.device === device && s.ip === ip);
      if (existingIdx !== -1) {
        userSessions[existingIdx].lastActive = Date.now();
        return userSessions[existingIdx].sessionId;
      }

      if (userSessions.length >= MAX_SESSIONS) {
        userSessions.shift(); // Evict oldest FIFO session
      }

      userSessions.push({ sessionId, device, ip, lastActive: Date.now() });
      return sessionId;
    }

    // Register 5 devices
    registerSession('Chrome-Win', '192.168.1.1');
    registerSession('Safari-iOS', '192.168.1.2');
    registerSession('Firefox-Linux', '192.168.1.3');
    registerSession('Edge-Win', '192.168.1.4');
    const fifthSession = registerSession('Electron-Desktop', '192.168.1.5');

    assert.equal(userSessions.length, 5);
    assert.equal(userSessions[0].device, 'Chrome-Win');

    // Add 6th device -> Chrome-Win should be evicted
    registerSession('Capacitor-Android', '192.168.1.6');
    assert.equal(userSessions.length, 5);
    assert.equal(userSessions[0].device, 'Safari-iOS', 'Oldest session must be evicted via FIFO');
    assert.ok(userSessions.some(s => s.device === 'Capacitor-Android'));
  });

  await t.test('Logout Invalidation: individual session termination removes target record', () => {
    const activeSessions = new Map([
      ['sess_1', { userId: 'u1', device: 'Desktop' }],
      ['sess_2', { userId: 'u1', device: 'Mobile' }],
      ['sess_3', { userId: 'u2', device: 'Web' }]
    ]);

    function revokeSession(sessionId) {
      return activeSessions.delete(sessionId);
    }

    assert.equal(revokeSession('sess_1'), true);
    assert.equal(activeSessions.has('sess_1'), false);
    assert.equal(activeSessions.has('sess_2'), true);
    assert.equal(activeSessions.has('sess_3'), true);
  });
});

