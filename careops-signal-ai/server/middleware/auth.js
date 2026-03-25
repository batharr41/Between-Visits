import jwt from 'jsonwebtoken';
import crypto from 'crypto';

let cachedKey = null;

async function getSupabasePublicKey() {
  if (cachedKey) return cachedKey;

  const jwksUrl = `${process.env.SUPABASE_URL}/.well-known/jwks.json`;
  const response = await fetch(jwksUrl);
  const jwks = await response.json();

  const key = jwks.keys[0];
  const publicKey = crypto.createPublicKey({
    key: key,
    format: 'jwk'
  });

  cachedKey = publicKey;
  return publicKey;
}

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const publicKey = await getSupabasePublicKey();
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['ES256']
    });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT VERIFY FAILED:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

Then make sure you have `SUPABASE_URL` set in your Render environment variables. It should be:
```
https://pbrcpybukwkkfyxbfdxb.supabase.co
