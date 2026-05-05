const express = require('express');
const multer = require('multer');
const prisma = require('../lib/prisma');
const { canEdit } = require('../middleware/auth');

const router = express.Router();

const FIVE_MB = 5 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIVE_MB },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WebP, TXT.'));
    }
    cb(null, true);
  }
});

// POST /api/files — upload
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!canEdit(req.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    if (!req.file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    const f = await prisma.uploadedFile.create({
      data: {
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
        uploadedBy: req.user.id
      },
      select: { id: true, filename: true, mimeType: true, size: true, createdAt: true }
    });
    res.status(201).json(f);
  } catch (e) { next(e); }
});

// GET /api/files/:id/meta — metadata only
router.get('/:id/meta', async (req, res) => {
  const f = await prisma.uploadedFile.findUnique({
    where: { id: req.params.id },
    select: { id: true, filename: true, mimeType: true, size: true, createdAt: true }
  });
  if (!f) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.json(f);
});

// GET /api/files/:id — download (reconstructs original file)
router.get('/:id', async (req, res) => {
  const f = await prisma.uploadedFile.findUnique({ where: { id: req.params.id } });
  if (!f) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.setHeader('Content-Type', f.mimeType);
  res.setHeader('Content-Length', f.size);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(f.filename)}"`);
  res.send(f.data);
});

// DELETE /api/files/:id
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  try {
    await prisma.uploadedFile.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    throw e;
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 5MB limit.' } });
  }
  if (err && err.message) {
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
  }
  next(err);
});

module.exports = router;
