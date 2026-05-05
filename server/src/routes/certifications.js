const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { crudHandlers, mountCrud } = require('../lib/crud');

const router = express.Router();

const Schema = z.object({
  school: z.string().min(1),
  schoolHead: z.string().optional().nullable(),
  partnerName: z.string().min(1),
  amountReceived: z.number().min(0).default(0),
  pointsEarned: z.number().int().min(0).default(0),
  certDate: z.string().optional().nullable(),
  programYear: z.string().min(4),
  quarter: z.string().min(1),
  hiyas: z.boolean().default(false),
  status: z.enum(['Pending', 'Issued', 'Approved']).optional()
});

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const handlers = crudHandlers({
  model: prisma.certification,
  schema: Schema,
  transform: (data) => ({ ...data, certDate: parseDate(data.certDate) })
});
mountCrud(router, '/', handlers);

module.exports = router;
