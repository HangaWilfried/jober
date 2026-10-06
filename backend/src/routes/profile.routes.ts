import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/profile
  fastify.get('/profile', async () => {
    return store.getProfile();
  });

  // PUT /api/v1/profile
  fastify.put('/profile', async (request) => {
    const body = request.body as Record<string, unknown>;
    return store.updateProfile(body);
  });
};

