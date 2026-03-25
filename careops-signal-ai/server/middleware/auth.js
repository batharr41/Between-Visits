import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const secret = Buffer.from(process.env.SUPABASE_JWT_SECRET, 'base64');
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT VERIFY FAILED:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
