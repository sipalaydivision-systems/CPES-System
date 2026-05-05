const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  school: z.string().min(2),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
  }
  const { name, email, password, school } = parsed.data;
  const role = parsed.data.role || 'Viewer';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email already registered.' } });
  }

  // First user becomes Admin
  const userCount = await prisma.user.count();
  const finalRole = userCount === 0 ? 'Admin' : (role === 'Admin' ? 'Viewer' : role);

  const user = await prisma.user.create({
    data: {
      name, email, school,
      passwordHash: await bcrypt.hash(password, 10),
      role: finalRole
    }
  });

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school }
  });
});

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid email or password format.' } });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'Active') {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school }
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const u = req.user;
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role, school: u.school });
});

module.exports = router;
