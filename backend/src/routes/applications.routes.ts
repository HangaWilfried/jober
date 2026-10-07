import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';
import { geminiService } from '../services/gemini.service.js';
import { prisma } from '../db/prisma.js';
import {
  ApplicationUpdateSchema,
  PreparedAnswerSchema,
  SearchPreferencesSchema
} from '../types/index.js';
import { z } from 'zod';
import { applicationFormAutomator } from '../services/application-form-automator.service.js';
import { calculateReadinessScore } from '../services/application-readiness.service.js';

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
    const parsedBody = ApplicationUpdateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({ error: 'Les données de candidature sont invalides.' });
    }
    const selectedResumeId = parsedBody.data.preparedData?.selectedResumeId;
    if (typeof selectedResumeId === 'string') {
      const resume = await prisma.resume.findFirst({
        where: { id: selectedResumeId, extractedText: { not: null } }
      });
      if (!resume?.extractedText?.trim()) {
        return reply.status(400).send({ error: 'Le CV sélectionné est introuvable ou ne contient pas de texte.' });
      }
    }
    const updated = await store.updateApplication(id, parsedBody.data);
    if (!updated) {
      return reply.status(400).send({ error: 'Candidature introuvable ou les données confirmées sont incomplètes.' });
    }
    return updated;
  });

  fastify.post('/applications/:id/select-resume', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedBody = z.object({ resumeId: z.string().min(1) }).safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({ error: 'Un CV valide est requis.' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true, blockers: true }
    });
    if (!application) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }
    if (application.status.startsWith('submitted_')) {
      return reply.status(400).send({ error: 'Le CV ne peut pas être modifié après l’envoi.' });
    }

    const user = await prisma.userProfile.findFirst({ include: { resumes: true } });
    if (!user) {
      return reply.status(400).send({ error: 'Profil utilisateur introuvable' });
    }
    const resume = user.resumes.find((item) =>
      item.id === parsedBody.data.resumeId && Boolean(item.extractedText?.trim())
    );
    if (!resume?.extractedText) {
      return reply.status(400).send({ error: 'Ce CV ne contient pas de texte analysable.' });
    }

    const skills = z.array(z.string()).parse(JSON.parse(user.skills || '[]'));
    const preferences = SearchPreferencesSchema.parse(
      JSON.parse(user.searchPreferences || '{}')
    );
    const analysis = await geminiService.analyzeJob({
      jobTitle: application.job.title,
      company: application.job.company,
      jobDescription: application.job.description,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills,
        location: user.location,
        searchPreferences: preferences
      },
      cvText: resume.extractedText
    });

    const blockers = [...analysis.potentialBlockers];
    blockers.push({
      type: 'other',
      question: 'Vérifiez que le CV adapté ne contient que des informations exactes avant de l’envoyer.'
    });
    if (preferences.minSalary) {
      blockers.push({
        type: 'salary_expectation',
        question: `Confirmez que cette offre respecte votre salaire minimum de ${preferences.minSalary} EUR brut annuel.`
      });
    }
    const uniqueBlockers = [...new Map(
      blockers.map((blocker) => [`${blocker.type}:${blocker.question}`, blocker])
    ).values()];

    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.jobAnalysis.upsert({
        where: { jobId: application.jobId },
        update: {
          matchScore: analysis.matchScore,
          summary: analysis.summary,
          requiredSkills: JSON.stringify(analysis.requiredSkills),
          matchingSkills: JSON.stringify(analysis.matchingSkills),
          missingSkills: JSON.stringify(analysis.missingSkills),
          minExperienceYears: analysis.minExperienceYears,
          analysisMethod: analysis.analysisMethod
        },
        create: {
          jobId: application.jobId,
          matchScore: analysis.matchScore,
          summary: analysis.summary,
          requiredSkills: JSON.stringify(analysis.requiredSkills),
          matchingSkills: JSON.stringify(analysis.matchingSkills),
          missingSkills: JSON.stringify(analysis.missingSkills),
          minExperienceYears: analysis.minExperienceYears,
          analysisMethod: analysis.analysisMethod
        }
      });
      await transaction.applicationBlocker.deleteMany({ where: { applicationId: id } });
      await transaction.application.update({
        where: { id },
        data: {
          selectedResumeId: resume.id,
          matchScore: analysis.matchScore,
          customizedResumeContent: analysis.customizedResumeContent,
          customizedResumeConfirmed: false,
          coverLetter: analysis.draftCoverLetter,
          coverLetterConfirmed: false,
          customizedHighlights: JSON.stringify(analysis.customizedHighlights),
          preparedAnswers: JSON.stringify(analysis.preparedAnswers.map((answer) => ({
            ...answer,
            isConfirmed: false
          }))),
          readinessScore: calculateReadinessScore({
            hasResume: true,
            customizedResumeConfirmed: false,
            coverLetterConfirmed: false,
            unresolvedBlockerCount: uniqueBlockers.length + analysis.preparedAnswers.length
          }),
          status: 'ready_for_review',
          blockers: {
            create: uniqueBlockers.map((blocker) => ({
              type: blocker.type,
              question: blocker.question,
              resolved: false
            }))
          }
        }
      });
      return true;
    });
    if (!updated) {
      return reply.status(500).send({ error: 'Impossible de préparer la candidature avec ce CV.' });
    }
    return store.getApplicationById(id);
  });

  fastify.patch('/applications/:id/prepared-answers/:answerIndex/confirm', async (request, reply) => {
    const { id, answerIndex } = request.params as { id: string; answerIndex: string };
    const index = Number(answerIndex);
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }
    const body = request.body as { suggestedAnswer?: unknown } | undefined;
    const parsedAnswers = z.array(PreparedAnswerSchema).safeParse(
      JSON.parse(application.preparedAnswers || '[]')
    );
    if (!parsedAnswers.success || !Number.isInteger(index) ||
      index < 0 || index >= parsedAnswers.data.length) {
      return reply.status(400).send({ error: 'Réponse préremplie introuvable.' });
    }
    const answers = parsedAnswers.data;
    const answer = {
      ...answers[index],
      ...(typeof body?.suggestedAnswer === 'string'
        ? { suggestedAnswer: body.suggestedAnswer }
        : {})
    };
    if (!answer.suggestedAnswer.trim()) {
      return reply.status(400).send({ error: 'La réponse doit être complétée avant confirmation.' });
    }

    answers[index] = { ...answer, isConfirmed: true };
    const update = await store.updateApplication(id, {
      preparedData: { preparedAnswers: answers }
    });
    if (!update) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }
    return update;
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

    const selectedResume = user.resumes.find((resume) => resume.id === app.selectedResumeId);

    const newLetter = await geminiService.regenerateCoverLetter({
      jobTitle: app.job.title,
      company: app.job.company,
      jobDescription: app.job.description,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills: JSON.parse(user.skills || '[]')
      },
      cvText: selectedResume?.extractedText || '',
      instructions,
      tone
    });

    const updated = await store.updateApplication(id, {
      preparedData: { coverLetter: newLetter }
    });
    if (!updated) {
      return reply.status(404).send({ error: 'Candidature introuvable' });
    }
    return {
      message: 'Lettre de motivation régénérée avec succès !',
      coverLetter: newLetter,
      application: updated
    };
  });

  // POST /api/v1/applications/:id/suggest-blocker-answer (Assistance IA pour répondre à un bloqueur)
  fastify.post('/applications/:id/suggest-blocker-answer', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedBody = z.object({ blockerId: z.string().min(1) }).safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({ error: 'Un bloqueur valide est requis.' });
    }
    const { blockerId } = parsedBody.data;

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

    const selectedResume = user.resumes.find((resume) => resume.id === app.selectedResumeId);

    const suggested = await geminiService.generateSuggestedAnswer({
      question: blocker.question,
      jobTitle: app.job.title,
      company: app.job.company,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills: JSON.parse(user.skills || '[]')
      },
      cvText: selectedResume?.extractedText || ''
    });

    return {
      blockerId,
      suggestedAnswer: suggested
    };
  });

  // POST /api/v1/applications/:id/resolve-blocker
  fastify.post('/applications/:id/resolve-blocker', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { blockerId?: unknown; response?: unknown };
    if (typeof body?.blockerId !== 'string' || typeof body.response !== 'string' ||
      !body.response.trim()) {
      return reply.status(400).send({ error: 'Une réponse non vide est requise pour résoudre ce point.' });
    }
    const { blockerId, response } = body as { blockerId: string; response: string };
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

    const hasUnresolved = app.blockers.some(b => !b.resolved);
    if (hasUnresolved) {
      return reply.status(400).send({
        error: 'Soumission impossible : des questions ou actions requièrent encore votre intervention.',
        unresolvedBlockers: app.blockers.filter(b => !b.resolved)
      });
    }

    try {
      const result = await applicationFormAutomator.submit(id);
      if (result.status === 'manual_required') {
        return reply.status(409).send({
          ...result,
          application: await store.getApplicationById(id)
        });
      }
      return {
        message: result.message,
        application: await store.getApplicationById(id)
      };
    } catch (error) {
      fastify.log.error({ error, applicationId: id }, 'Application automation failed');
      return reply.status(503).send({
        error: error instanceof Error ? error.message : 'Le navigateur d’automatisation est indisponible.'
      });
    }
  });

  fastify.post('/applications/:id/confirm-manual-submission', async (request, reply) => {
    const { id } = request.params as { id: string };
    const application = await store.getApplicationById(id);
    if (!application) {
      return reply.status(404).send({ error: 'Candidature non trouvée' });
    }
    if (application.status.startsWith('submitted_')) {
      return reply.status(400).send({ error: 'Cette candidature est déjà marquée comme envoyée.' });
    }
    if (application.matchScore < 60) {
      return reply.status(400).send({ error: 'Cette candidature n’est pas préparée pour une soumission.' });
    }
    const submitted = await store.submitApplication(id);
    if (!submitted) {
      return reply.status(400).send({
        error: 'Dossier incomplet : sélectionnez un CV analysé, adaptez les documents, confirmez les réponses et résolvez tous les points de décision.'
      });
    }
    return {
      message: 'Candidature marquée comme envoyée manuellement après confirmation.',
      application: submitted
    };
  });
};
