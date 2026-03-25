import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  console.log('AUTH DEBUG:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
    hasSecret: !!process.env.SUPABASE_JWT_SECRET,
    secretLength: process.env.SUPABASE_JWT_SECRET?.length || 0
  });

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT VERIFY FAILED:', err.message);
    return res.status(401).json({ error: 'Invalid token', detail: err.message });
  }
}
