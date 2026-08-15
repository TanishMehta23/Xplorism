/**
 * Middleware to detect and block common SQL injection patterns in req.body, req.query, and req.params.
 * Provides an additional layer of validation on top of parameterized database queries.
 */

// Regular expressions to detect typical SQL injection payloads
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|UNION|DROP|ALTER|CREATE|TRUNCATE|DATABASE|GRANT|REVOKE)\b)/i,
  /(--|#|\/\*|\*\/)/, // SQL comment markers
  /(\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // OR '1'='1' style bypasses
  /(\band\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // AND '1'='1' style logic
  /UNION\s+(ALL\s+)?SELECT/i,
  /WAITFOR\s+DELAY/i, // Time-based injection
  /BENCHMARK\(/i      // Heavy execution injection
];

// Fields that are known to contain binary/base64 data and should be skipped
const SKIP_FIELDS = new Set(['profilePhoto', 'profile_photo', 'document', 'fileData', 'imageData']);

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
  // Scan request parameters, query string, and body
  if (
    containsSqlInjection(req.body) ||
    containsSqlInjection(req.query) ||
    containsSqlInjection(req.params)
  ) {
    console.warn(`[SECURITY WARNING]: Blocked potential SQL Injection attack from IP: ${req.ip}`);
    return res.status(400).json({
      status: 400,
      message: 'Suspicious input detected. Request rejected for security purposes.'
    });
  }
  next();
};
