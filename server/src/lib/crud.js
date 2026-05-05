const { isDivision, isSchool, schoolScopeWhere, enforceSchoolOnWrite } = require('../middleware/auth');

/**
 * Build standard CRUD handlers for a Prisma model with automatic
 * School-user scoping (filters by user.school for School users,
 * passes through for Division users).
 *
 * @param {Object} cfg
 * @param {Object} cfg.model        Prisma model delegate (e.g. prisma.transmittal)
 * @param {Object} cfg.schema       Zod schema for create/update bodies
 * @param {Function} [cfg.transform] (data, req) => transformed data
 * @param {Object} [cfg.orderBy]    Prisma orderBy (default: { createdAt: 'desc' })
 * @param {Object} [cfg.include]    Prisma include
 * @param {Boolean} [cfg.scoped=true] Whether to apply school scoping
 */
function crudHandlers(cfg) {
  const orderBy = cfg.orderBy || { createdAt: 'desc' };
  const scoped = cfg.scoped !== false;

  function whereForUser(req, extraWhere) {
    const w = extraWhere || {};
    if (scoped) Object.assign(w, schoolScopeWhere(req.user));
    return w;
  }

  return {
    list: async (req, res) => {
      const where = whereForUser(req);
      const items = await cfg.model.findMany({ where, orderBy, include: cfg.include });
      res.json(items);
    },

    get: async (req, res) => {
      const where = whereForUser(req, { id: req.params.id });
      const item = await cfg.model.findFirst({ where, include: cfg.include });
      if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
      res.json(item);
    },

    create: async (req, res) => {
      const parsed = cfg.schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message, issues: parsed.error.errors } });
      }
      let data = cfg.transform ? cfg.transform(parsed.data, req) : parsed.data;
      if (scoped) data = enforceSchoolOnWrite(req.user, data);
      data.createdById = req.user.id;
      const item = await cfg.model.create({ data, include: cfg.include });
      res.status(201).json(item);
    },

    update: async (req, res) => {
      const parsed = cfg.schema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
      }

      // For School users: ensure the record belongs to their school before updating
      if (scoped && isSchool(req.user)) {
        const existing = await cfg.model.findFirst({ where: { id: req.params.id, school: req.user.school } });
        if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
      }

      let data = cfg.transform ? cfg.transform(parsed.data, req, { partial: true }) : parsed.data;
      if (scoped && isSchool(req.user)) {
        // School users cannot reassign a record to another school
        delete data.school;
      }

      try {
        const item = await cfg.model.update({ where: { id: req.params.id }, data, include: cfg.include });
        res.json(item);
      } catch (e) {
        if (e.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
        throw e;
      }
    },

    remove: async (req, res) => {
      // For School users: only allow deleting records in their school
      if (scoped && isSchool(req.user)) {
        const existing = await cfg.model.findFirst({ where: { id: req.params.id, school: req.user.school } });
        if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
      }
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
