const { canEdit, canDelete } = require('../middleware/auth');

/**
 * Build standard CRUD handlers for a Prisma model.
 * @param {Object} cfg
 * @param {Object} cfg.model - prisma model delegate (e.g. prisma.transmittal)
 * @param {Object} cfg.schema - zod schema for create/update
 * @param {Function} [cfg.transform] - (data, req) => transformed data for prisma
 * @param {Object} [cfg.orderBy] - prisma orderBy (default: { createdAt: 'desc' })
 * @param {Object} [cfg.include] - prisma include
 */
function crudHandlers(cfg) {
  const orderBy = cfg.orderBy || { createdAt: 'desc' };

  return {
    list: async (req, res) => {
      const items = await cfg.model.findMany({ orderBy, include: cfg.include });
      res.json(items);
    },
    get: async (req, res) => {
      const item = await cfg.model.findUnique({ where: { id: req.params.id }, include: cfg.include });
      if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
      res.json(item);
    },
    create: async (req, res) => {
      if (!canEdit(req.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
      const parsed = cfg.schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message, issues: parsed.error.errors } });
      }
      const data = cfg.transform ? cfg.transform(parsed.data, req) : parsed.data;
      data.createdById = req.user.id;
      const item = await cfg.model.create({ data, include: cfg.include });
      res.status(201).json(item);
    },
    update: async (req, res) => {
      if (!canEdit(req.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
      const parsed = cfg.schema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
      }
      const data = cfg.transform ? cfg.transform(parsed.data, req, { partial: true }) : parsed.data;
      try {
        const item = await cfg.model.update({ where: { id: req.params.id }, data, include: cfg.include });
        res.json(item);
      } catch (e) {
        if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
        throw e;
      }
    },
    remove: async (req, res) => {
      if (!canDelete(req.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only Admins can delete.' } });
      try {
        await cfg.model.delete({ where: { id: req.params.id } });
        res.status(204).end();
      } catch (e) {
        if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
        throw e;
      }
    }
  };
}

function mountCrud(router, basePath, handlers) {
  router.get(basePath, handlers.list);
  router.get(`${basePath}/:id`, handlers.get);
  router.post(basePath, handlers.create);
  router.patch(`${basePath}/:id`, handlers.update);
  router.delete(`${basePath}/:id`, handlers.remove);
}

module.exports = { crudHandlers, mountCrud };
