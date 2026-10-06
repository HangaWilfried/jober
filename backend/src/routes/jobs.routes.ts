import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';

export const jobRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/jobs
  fastify.get('/jobs', async (request) => {
    const query = request.query as { status?: string; minMatch?: string };
    const minMatch = query.minMatch ? parseInt(query.minMatch, 10) : undefined;
    const data = store.getJobs({ status: query.status, minMatch });
    return {
      data,
      total: data.length
    };
  });

  // GET /api/v1/jobs/:id
  fastify.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = store.getJobById(id);
    if (!job) {
      return reply.status(404).send({ error: 'Offre non trouvée' });
    }
    return job;
  });

  // POST /api/v1/jobs/collect
  fastify.post('/jobs/collect', async () => {
    return {
      taskId: `task_collect_${Date.now()}`,
      status: 'completed',
      message: 'Recherche synchronisée avec succès. Nouvelles offres indexées.'
    };
  });

  // POST /api/v1/jobs/:id/analyze
  fastify.post('/jobs/:id/analyze', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = store.getJobById(id);
    if (!job) {
      return reply.status(404).send({ error: 'Offre non trouvée' });
    }
    return {
      message: 'Analyse mise à jour',
      job
    };
  });
};

