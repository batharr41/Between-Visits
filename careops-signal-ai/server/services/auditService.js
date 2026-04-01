import pool from '../database/pool.js';

// Fire-and-forget audit logging - never blocks the request
// HIPAA requires logging: who accessed what PHI, when, and from where
function logAudit(options) {
  var userId = options.userId || null;
  var userEmail = options.userEmail || null;
  var action = options.action;
  var resourceType = options.resourceType || null;
  var resourceId = options.resourceId || null;
  var details = options.details || null;
  var ipAddress = options.ipAddress || null;

  // Don't await - fire and forget so it never slows down API responses
  pool.query(
    'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, action, resourceType, resourceId, details ? JSON.stringify(details) : null, ipAddress]
  ).catch(function(err) {
    console.error('Audit log failed:', err.message);
  });
}

// Helper to extract audit info from request
function auditFromReq(req) {
  var ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || null;
  if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
  return {
    userId: req.staffUser ? req.staffUser.id : null,
    userEmail: req.user ? req.user.email : null,
    ipAddress: ip
  };
}

// Convenience: log from a request with one call
function logFromReq(req, action, resourceType, resourceId, extraDetails) {
  var info = auditFromReq(req);
  var details = Object.assign({ email: info.userEmail }, extraDetails || {});
  logAudit({
    userId: info.userId,
    userEmail: info.userEmail,
    action: action,
    resourceType: resourceType,
    resourceId: resourceId,
    details: details,
    ipAddress: info.ipAddress
  });
}

export { logAudit, auditFromReq, logFromReq };
