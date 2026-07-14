const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена авторизации' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

// Не обязательная авторизация — если токен есть, подставит req.user, если нет — пропустит дальше
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch { /* игнорируем */ }
  }
  next();
}

module.exports = { auth, optionalAuth, SECRET };
