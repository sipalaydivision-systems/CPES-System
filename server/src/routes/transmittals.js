const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { crudHandlers, mountCrud } = require('../lib/crud');
const { schoolScopeWhere } = require('../middleware/auth');

const router = express.Router();

const Schema = z.object({
  school: z.string().min(1),
  cluster: z.string().min(1),
  month: z.string().min(1),
  year: z.string().min(4),
  contributionType: z.enum(['Cash', 'InKind', 'Service', 'Scholarship', 'Infrastructure', 'Equipment', 'Supplies', 'Other']),
  numPartners: z.number().int().min(0),
  amountContribution: z.number().min(0),
  numBeneficiaries: z.number().int().min(0),
  status: z.enum(['Submitted', 'Validated', 'Pending']).optional()
});

const handlers = crudHandlers({ model: prisma.transmittal, schema: Schema });
mountCrud(router, '/', handlers);

// Aggregation: group by year > month (auto-scoped to user's school for School users)
router.get('/aggregate/by-period', async (req, res) => {
  const where = schoolScopeWhere(req.user);
  const all = await prisma.transmittal.findMany({ where, orderBy: [{ year: 'desc' }, { month: 'asc' }] });
  const grouped = {};
  for (const t of all) {
    if (!grouped[t.year]) grouped[t.year] = {};
    if (!grouped[t.year][t.month]) grouped[t.year][t.month] = { schools: [], totals: { partners: 0, amount: 0, beneficiaries: 0 } };
    grouped[t.year][t.month].schools.push(t);
    grouped[t.year][t.month].totals.partners += t.numPartners;
    grouped[t.year][t.month].totals.amount += t.amountContribution;
    grouped[t.year][t.month].totals.beneficiaries += t.numBeneficiaries;
  }
  res.json(grouped);
});

router.get('/aggregate/by-cluster', async (req, res) => {
  const { year, month } = req.query;
  const where = schoolScopeWhere(req.user);
  if (year) where.year = year;
  if (month) where.month = month;

  const all = await prisma.transmittal.findMany({ where, orderBy: { school: 'asc' } });
  const byCluster = {};
  for (const t of all) {
    const key = `Cluster ${t.cluster}`;
    if (!byCluster[key]) byCluster[key] = { cluster: t.cluster, schools: [], totalPartners: 0, totalAmount: 0, totalBeneficiaries: 0 };
    byCluster[key].schools.push(t);
    byCluster[key].totalPartners += t.numPartners;
    byCluster[key].totalAmount += t.amountContribution;
    byCluster[key].totalBeneficiaries += t.numBeneficiaries;
  }
  res.json(byCluster);
});

module.exports = router;
