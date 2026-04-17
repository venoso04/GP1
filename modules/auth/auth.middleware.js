import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const { token } = req.headers;

  if (!token) return res.status(401).json({ message: 'Please sign in' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};