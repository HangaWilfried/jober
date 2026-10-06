import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { profileRoutes } from './routes/profile.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';
import { applicationRoutes } from './routes/applications.routes.js';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Enregistrement CORS pour permettre les requêtes depuis Vite (ex: http://localhost:5173)
await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
});

// Support multipart pour l'upload de CVs (PDF)
await fastify.register(multipart, {
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 Mo max
  }
});

// Route de santé
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Enregistrement des routes préfixées par /api/v1
await fastify.register(
  async (api) => {
    await api.register(profileRoutes);
    await api.register(jobRoutes);
    await api.register(applicationRoutes);
  },
  { prefix: '/api/v1' }
);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 Serveur Jober Backend démarré sur http://localhost:${PORT}`);
    console.log(`📋 API v1 disponible sur http://localhost:${PORT}/api/v1`);
    console.log(`🩺 Health check sur http://localhost:${PORT}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

