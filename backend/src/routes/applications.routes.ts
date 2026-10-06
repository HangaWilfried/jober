import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';
import { geminiService } from '../services/gemini.service.js';
import { prisma } from '../db/prisma.js';

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

  // POST /api/v1/applications/:id/regenerate-letter (Régénération IA de la lettre de motivation)
  fastify.post('/applications/:id/regenerate-letter', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { instructions, tone } = (request.body as { instructions?: string; tone?: string }) || {};

    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!app) {
      return reply.status(404).send({ error: 'Candidature introuvable' });
    }

    const user = await prisma.userProfile.findFirst({
      include: { resumes: true }
    });

    if (!user) {
      return reply.status(400).send({ error: 'Profil utilisateur introuvable' });
    }

    const primaryResume = user.resumes.find(r => r.isPrimary) || user.resumes[0];

    const newLetter = await geminiService.regenerateCoverLetter({
      jobTitle: app.job.title,
      company: app.job.company,
      jobDescription: app.job.description,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills: JSON.parse(user.skills || '[]')
      },
      cvText: primaryResume?.extractedText || '',
      instructions,
      tone
    });

    await prisma.application.update({
      where: { id },
      data: { coverLetter: newLetter }
    });

    const updated = await store.getApplicationById(id);
    return {
      message: 'Lettre de motivation régénérée avec succès !',
      coverLetter: newLetter,
      application: updated
    };
  });

  // POST /api/v1/applications/:id/suggest-blocker-answer (Assistance IA pour répondre à un bloqueur)
  fastify.post('/applications/:id/suggest-blocker-answer', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { blockerId } = request.body as { blockerId: string };

    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        blockers: true
      }
    });

    if (!app) {
      return reply.status(404).send({ error: 'Candidature introuvable' });
    }

    const blocker = app.blockers.find(b => b.id === blockerId);
    if (!blocker) {
      return reply.status(404).send({ error: 'Bloqueur introuvable' });
    }

    const user = await prisma.userProfile.findFirst({
      include: { resumes: true }
    });

    if (!user) {
      return reply.status(400).send({ error: 'Profil utilisateur introuvable' });
    }

    const primaryResume = user.resumes.find(r => r.isPrimary) || user.resumes[0];

    const suggested = await geminiService.generateSuggestedAnswer({
      question: blocker.question,
      jobTitle: app.job.title,
      company: app.job.company,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills: JSON.parse(user.skills || '[]')
      },
      cvText: primaryResume?.extractedText || ''
    });

    return {
      blockerId,
      suggestedAnswer: suggested
    };
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
