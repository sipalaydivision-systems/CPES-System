const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { signToken, requireAuth } = require('../middleware/auth');
const { isValidLocation } = require('../lib/schools');

const router = express.Router();

const RegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required.'),
  suffix: z.string().optional().nullable(),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  registrationType: z.enum(['Division', 'School'], { errorMap: () => ({ message: 'Select Division or School registration.' }) }),
  school: z.string().min(2, 'School/office is required.')
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function publicUser(u) {
  return {
    id: u.id,
    firstName: u.firstName,
    middleName: u.middleName,
    lastName: u.lastName,
    suffix: u.suffix,
    email: u.email,
    registrationType: u.registrationType,
    school: u.school,
    status: u.status
  };
}

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
  }
  const data = parsed.data;

  // Validate the school/office matches the registration type's allowed list
  if (!isValidLocation(data.registrationType, data.school)) {
    return res.status(400).json({
      error: { code: 'INVALID_LOCATION', message: data.registrationType === 'School'
        ? 'Selected school is not in the SDO Sipalay City school directory.'
        : 'Selected division office is not recognized.' }
    });
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email already registered.' } });
  }

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName.trim(),
      middleName: data.middleName ? data.middleName.trim() : null,
      lastName: data.lastName.trim(),
      suffix: data.suffix ? data.suffix.trim() : null,
      email: data.email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(data.password, 10),
      registrationType: data.registrationType,
      school: data.school
    }
  });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid email or password format.' } });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || user.status !== 'Active') {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(publicUser(req.user));
});

module.exports = router;
