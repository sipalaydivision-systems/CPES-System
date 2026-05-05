const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireDivision } = require('../middleware/auth');
const { isValidLocation } = require('../lib/schools');

const router = express.Router();

const SELECT = {
  id: true, firstName: true, middleName: true, lastName: true, suffix: true,
  email: true, registrationType: true, school: true, status: true, createdAt: true
};

const CreateSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1),
  suffix: z.string().optional().nullable(),
  email: z.string().email(),
  password: z.string().min(8),
  registrationType: z.enum(['Division', 'School']),
  school: z.string().min(2),
  status: z.enum(['Active', 'Inactive']).optional()
});

const UpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1).optional(),
  suffix: z.string().optional().nullable(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().nullable(),
  registrationType: z.enum(['Division', 'School']).optional(),
  school: z.string().min(2).optional(),
  status: z.enum(['Active', 'Inactive']).optional()
});

router.use(requireDivision);

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: SELECT });
  res.json(users);
});

router.post('/', async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
  if (!isValidLocation(parsed.data.registrationType, parsed.data.school)) {
    return res.status(400).json({ error: { code: 'INVALID_LOCATION', message: 'School/division office is not in the directory.' } });
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: { code: 'EMAIL_TAKEN' } });

  const { password, ...rest } = parsed.data;
  const u = await prisma.user.create({
    data: {
      ...rest,
      email: rest.email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10)
    },
    select: SELECT
  });
  res.status(201).json(u);
});

router.patch('/:id', async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });

  const data = { ...parsed.data };
  if (data.email) data.email = data.email.toLowerCase();
  if (data.password) data.passwordHash = await bcrypt.hash(data.password, 10);
  delete data.password;

  // If both registrationType and school are being changed, validate together
  if (data.registrationType && data.school) {
    if (!isValidLocation(data.registrationType, data.school)) {
      return res.status(400).json({ error: { code: 'INVALID_LOCATION' } });
    }
  } else if (data.school || data.registrationType) {
    // If only one is being changed, fetch existing to validate the pair
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    const type = data.registrationType || existing.registrationType;
    const school = data.school || existing.school;
    if (!isValidLocation(type, school)) {
      return res.status(400).json({ error: { code: 'INVALID_LOCATION' } });
    }
  }

  try {
    const u = await prisma.user.update({ where: { id: req.params.id }, data, select: SELECT });
    res.json(u);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    throw e;
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: { code: 'CANNOT_DELETE_SELF' } });
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    throw e;
  }
});

module.exports = router;
