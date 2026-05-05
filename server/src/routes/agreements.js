const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { crudHandlers, mountCrud } = require('../lib/crud');

const router = express.Router();

const Schema = z.object({
  school: z.string().min(1),
  cluster: z.string().min(1),
  agreementType: z.enum(['MOA', 'MOU', 'DOD', 'DOA']),
  partnerName: z.string().min(1),
  partnerRep: z.string().optional().nullable(),
  partnerNature: z.enum(['LGU', 'NGO', 'PrivateCompany', 'Individual', 'AcademicInstitution', 'GovernmentAgency', 'Other']),
  purpose: z.string().min(1),
  effectivityStart: z.string().optional().nullable(),
  effectivityEnd: z.string().optional().nullable(),
  notarized: z.boolean().default(false),
  notarizedDate: z.string().optional().nullable(),
  status: z.enum(['Active', 'Expired', 'Pending', 'Cancelled']).optional(),
  fileId: z.string().optional().nullable()
});

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const handlers = crudHandlers({
  model: prisma.agreement,
  schema: Schema,
  transform: (data) => ({
    ...data,
    effectivityStart: parseDate(data.effectivityStart),
    effectivityEnd: parseDate(data.effectivityEnd),
    notarizedDate: parseDate(data.notarizedDate)
  }),
  include: { file: { select: { id: true, filename: true, mimeType: true, size: true } } }
});
mountCrud(router, '/', handlers);

module.exports = router;
