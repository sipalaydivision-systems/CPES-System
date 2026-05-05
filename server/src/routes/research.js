const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { crudHandlers, mountCrud } = require('../lib/crud');

const router = express.Router();

const Schema = z.object({
  title: z.string().min(1),
  type: z.enum(['ActionResearch', 'InnovationPaper', 'CaseStudy', 'PolicyReview', 'Other']),
  author: z.string().min(1),
  school: z.string().min(1),
  year: z.string().min(4),
  abstract: z.string().optional().nullable(),
  status: z.enum(['Approved', 'Pending', 'Archived']).optional(),
  fileId: z.string().optional().nullable()
});

const handlers = crudHandlers({
  model: prisma.research,
  schema: Schema,
  include: { file: { select: { id: true, filename: true, mimeType: true, size: true } } }
});
mountCrud(router, '/', handlers);

module.exports = router;
