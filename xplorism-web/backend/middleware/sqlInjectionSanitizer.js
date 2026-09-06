/**
 * Middleware to detect and block common SQL injection patterns in req.body, req.query, and req.params.
 * Provides an additional layer of validation on top of parameterized database queries.
 */

// Targeted regular expressions to detect genuine SQL injection syntax and tautology payloads
// Avoid matching standard English words like "create", "update", or hashtags "#"
const SQL_INJECTION_PATTERNS = [
  /UNION\s+(ALL\s+)?SELECT/i,
  /WAITFOR\s+DELAY\s+['"]\d+/i,
  /BENCHMARK\s*\(\s*\d+\s*,/i,
  /;\s*(DROP|TRUNCATE|ALTER)\s+(TABLE|DATABASE)\b/i,
  /;\s*DELETE\s+FROM\b/i,
  /(\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // OR '1'='1' style bypass
  /(\band\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // AND '1'='1' style bypass
  /(\bor\b\s+['"][a-zA-Z0-9]+['"]\s*=\s*['"][a-zA-Z0-9]+['"])/i, // OR 'a'='a'
  /(\bEXEC(\s+XP_|\s+SP_))/i,
  /\bCAST\s*\([^)]+\s+AS\s+(VARCHAR|INTEGER|CHAR)\b/i
];

// Fields that are known to contain binary/base64/JWT token data and should be skipped
const SKIP_FIELDS = new Set([
  'profilePhoto', 
  'profile_photo', 
  'document', 
  'fileData', 
  'imageData', 
  'credential', 
  'idToken', 
  'token', 
  'resetToken', 
  'refreshToken'
]);

function containsSqlInjection(value, key = null) {
  // Skip known binary/base64 fields
  if (key && SKIP_FIELDS.has(key)) return false;

  if (typeof value === 'string') {
    // Check value against all known SQL Injection patterns
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
  } else if (value && typeof value === 'object') {
    // Recursively scan objects and arrays, passing the key for each field
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        if (containsSqlInjection(value[k], k)) {
          return true;
        }
      }
    }
  }
  return false;
}

export const sqlInjectionSanitizer = (req, res, next) => {
  // Auth endpoints receiving Google ID tokens or credentials
  if (req.path === '/auth/google' || req.originalUrl?.includes('/auth/google')) {
    return next();
  }

  // Scan request parameters, query string, and body
  if (
    containsSqlInjection(req.body) ||
    containsSqlInjection(req.query) ||
    containsSqlInjection(req.params)
  ) {
    console.warn(`[SECURITY WARNING]: Blocked potential SQL Injection attack from IP: ${req.ip} path: ${req.originalUrl}`);
    return res.status(400).json({
      status: 400,
      message: 'Suspicious input detected. Request rejected for security purposes.'
    });
  }
  next();
};
