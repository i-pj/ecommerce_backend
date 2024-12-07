const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token Verification Error:', err.message);
    res.status(401).json({ error: 'Unauthorized access.' });
  }
};