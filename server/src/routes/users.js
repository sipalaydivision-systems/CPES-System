const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin only.' } });
  next();
}

const CreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  school: z.string().min(2),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
  status: z.enum(['Active', 'Inactive']).optional()
});

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().nullable(),
  school: z.string().min(2).optional(),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional(),
  status: z.enum(['Active', 'Inactive']).optional()
});

router.get('/', adminOnly, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, school: true, status: true, createdAt: true }
  });
  res.json(users);
});

router.post('/', adminOnly, async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return res.status(409).json({ error: { code: 'EMAIL_TAKEN' } });
  const { password, ...rest } = parsed.data;
  const u = await prisma.user.create({
    data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true, name: true, email: true, role: true, school: true, status: true, createdAt: true }
  });
  res.status(201).json(u);
});

router.patch('/:id', adminOnly, async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
  const data = { ...parsed.data };
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
  }
  delete data.password;
  try {
    const u = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, school: true, status: true, createdAt: true }
    });
    res.json(u);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    throw e;
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
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
