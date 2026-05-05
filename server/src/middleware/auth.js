const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'cpes-dev-secret-change-me';

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Authentication required.' } });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ error: { code: 'INVALID_USER', message: 'Account not active.' } });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: { code: 'NO_USER' } });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role.' } });
    }
    next();
  };
}

function canEdit(role) { return role === 'Admin' || role === 'Editor'; }
function canDelete(role) { return role === 'Admin'; }

module.exports = { signToken, requireAuth, requireRole, canEdit, canDelete, JWT_SECRET };
