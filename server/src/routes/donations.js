const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { crudHandlers, mountCrud } = require('../lib/crud');

const router = express.Router();

const Schema = z.object({
  school: z.string().min(1),
  schoolId: z.string().optional().nullable(),
  schoolHead: z.string().optional().nullable(),
  coordinator: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  quarter: z.string().min(1),
  month: z.string().min(1),
  year: z.string().min(4),
  donationType: z.enum(['Cash', 'InKind', 'Service', 'Equipment', 'Supplies', 'ConstructionMaterials', 'Food', 'Medals', 'Books', 'Other']),
  amount: z.number().min(0).default(0),
  description: z.string().min(1),
  donorCategory: z.enum(['Internal', 'External']),
  donorSubType: z.string().min(1),
  donorName: z.string().min(1),
  dateReceived: z.string().optional().nullable(),
  hasMOA: z.boolean().default(false),
  notarized: z.boolean().default(false),
  notarizedDate: z.string().optional().nullable(),
  usageDescription: z.string().optional().nullable(),
  status: z.enum(['Encoded', 'Validated', 'Utilized']).optional()
});

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const handlers = crudHandlers({
  model: prisma.donation,
  schema: Schema,
  transform: (data) => ({
    ...data,
    dateReceived: parseDate(data.dateReceived),
    notarizedDate: parseDate(data.notarizedDate)
  })
});
mountCrud(router, '/', handlers);

module.exports = router;
