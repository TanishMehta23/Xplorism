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

function containsSqlInjection(value) {
  if (typeof value === 'string') {
    // Check value against all known SQL Injection patterns
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
  } else if (value && typeof value === 'object') {
    // Recursively scan objects and arrays
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        if (containsSqlInjection(value[key])) {
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
