import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';

export const applicationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/applications
  fastify.get('/applications', async (request) => {
    const query = request.query as { status?: string };
    const data = await store.getApplications({ status: query.status });
    return {
      data,
      total: data.length
    };
  });

  // GET /api/v1/applications/:id
  fastify.get('/applications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const app = await store.getApplicationById(id);
    if (!app) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }
    return app;
  });

  // PATCH /api/v1/applications/:id
  fastify.patch('/applications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const updated = await store.updateApplication(id, body);
    if (!updated) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }
    return updated;
  });

  // POST /api/v1/applications/:id/resolve-blocker
  fastify.post('/applications/:id/resolve-blocker', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { blockerId, response } = request.body as { blockerId: string; response: string };
    const updated = await store.resolveBlocker(id, blockerId, response);
    if (!updated) {
      return reply.status(404).send({ error: 'Candidature ou bloqueur non trouvé' });
    }
    return {
      message: 'Bloqueur résolu avec succès',
      application: updated
    };
  });

  // POST /api/v1/applications/:id/submit
  fastify.post('/applications/:id/submit', async (request, reply) => {
    const { id } = request.params as { id: string };
    const app = await store.getApplicationById(id);
    if (!app) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }

    // Vérification Human-in-the-loop : y a-t-il des bloqueurs non résolus ?
    const hasUnresolved = app.blockers.some(b => !b.resolved);
    if (hasUnresolved) {
      return reply.status(400).send({
        error: 'Soumission impossible : des questions ou actions requièrent encore votre intervention.',
        unresolvedBlockers: app.blockers.filter(b => !b.resolved)
      });
    }

    const submitted = await store.submitApplication(id);
    return {
      message: 'Candidature transmise avec succès !',
      application: submitted
    };
  });
};
