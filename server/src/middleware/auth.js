const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'cpes-dev-secret-change-me';

function signToken(user) {
  return jwt.sign(
    { userId: user.id, registrationType: user.registrationType, email: user.email },
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

function requireDivision(req, res, next) {
  if (!req.user) return res.status(401).json({ error: { code: 'NO_USER' } });
  if (req.user.registrationType !== 'Division') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Division-level access required.' } });
  }
  next();
}

// Helpers used by route handlers
function isDivision(user) { return user && user.registrationType === 'Division'; }
function isSchool(user) { return user && user.registrationType === 'School'; }

// Returns a where-clause fragment that scopes records to the user's school
// for School users. Division users see everything (returns {}).
function schoolScopeWhere(user) {
  if (isDivision(user)) return {};
  return { school: user.school };
}

// Enforces school field on writes for School users (cannot assign records to other schools)
function enforceSchoolOnWrite(user, data) {
  if (isSchool(user)) {
    return { ...data, school: user.school };
  }
  return data;
}

module.exports = {
  signToken,
  requireAuth,
  requireDivision,
  isDivision,
  isSchool,
  schoolScopeWhere,
  enforceSchoolOnWrite,
  JWT_SECRET
};
