import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
            : null;

              if (!token) {
                  return res.status(401).json({ error: 'Unauthorized' });
                    }

                      try {
                          const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
                              req.user = decoded;
                                  next();
                                    } catch (err) {
                                        return res.status(401).json({ error: 'Unauthorized' });
                                          }
                                          }
