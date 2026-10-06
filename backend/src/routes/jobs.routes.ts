import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';
import { geminiService } from '../services/gemini.service.js';
import { prisma } from '../db/prisma.js';
import { jobCollector } from '../services/collector/job-collector.service.js';

export const jobRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/jobs
  fastify.get('/jobs', async (request) => {
    const query = request.query as { status?: string; minMatch?: string };
    const minMatch = query.minMatch ? parseInt(query.minMatch, 10) : undefined;
    const data = await store.getJobs({ status: query.status, minMatch });
    return {
      data,
      total: data.length
    };
  });

  // GET /api/v1/jobs/:id
  fastify.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await store.getJobById(id);
    if (!job) {
      return reply.status(404).send({ error: 'Offre non trouvée' });
    }
    return job;
  });

  // POST /api/v1/jobs/analyze-manual (Analyse IA d'une offre collée ou ajoutée)
  fastify.post('/jobs/analyze-manual', async (request, reply) => {
    const body = request.body as {
      title: string;
      company: string;
      location?: string;
      remoteType?: string;
      url?: string;
      source?: string;
      description: string;
    };

    if (!body.title || !body.company || !body.description) {
      return reply.status(400).send({
        error: 'Le titre du poste, le nom de l entreprise et la description sont requis.'
      });
    }

    // Récupérer le profil et le CV principal dans SQLite
    const user = await prisma.userProfile.findFirst({
      include: { resumes: true }
    });

    if (!user) {
      return reply.status(400).send({ error: 'Aucun profil utilisateur trouvé en base.' });
    }

    const primaryResume = user.resumes.find(r => r.isPrimary) || user.resumes[0];
    const cvText = primaryResume?.extractedText || '';

    // Lancement de l'analyse IA via Gemini
    const analysisResult = await geminiService.analyzeJob({
      jobTitle: body.title,
      company: body.company,
      jobDescription: body.description,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills: JSON.parse(user.skills || '[]'),
        location: user.location,
        searchPreferences: JSON.parse(user.searchPreferences || '{}')
      },
      cvText
    });

    const status = analysisResult.matchScore >= 60 ? 'analyzed' : 'rejected';

    // Création de l'offre et de l'analyse dans SQLite
    const newJob = await prisma.jobOffer.create({
      data: {
        title: body.title,
        company: body.company,
        location: body.location || 'Non spécifié',
        remoteType: body.remoteType || 'unknown',
        url: body.url || 'https://example.com',
        source: body.source || 'Ajout manuel',
        description: body.description,
        status,
        analysis: {
          create: {
            matchScore: analysisResult.matchScore,
            summary: analysisResult.summary,
            requiredSkills: JSON.stringify(analysisResult.requiredSkills),
            matchingSkills: JSON.stringify(analysisResult.matchingSkills),
            missingSkills: JSON.stringify(analysisResult.missingSkills),
            minExperienceYears: analysisResult.minExperienceYears
          }
        }
      }
    });

    // Si match suffisant, préparation automatique du dossier de candidature
    if (analysisResult.matchScore >= 60) {
      const hasBlockers = analysisResult.potentialBlockers.length > 0;
      const initialReadiness = hasBlockers ? 80 : 100;
      const initialStatus = hasBlockers ? 'ready_for_review' : 'ready_to_submit';

      await prisma.application.create({
        data: {
          jobId: newJob.id,
          status: initialStatus,
          matchScore: analysisResult.matchScore,
          readinessScore: initialReadiness,
          selectedResumeId: primaryResume?.id,
          coverLetter: analysisResult.draftCoverLetter,
          customizedHighlights: JSON.stringify(analysisResult.customizedHighlights),
          preparedAnswers: JSON.stringify(analysisResult.preparedAnswers.map(a => ({
            ...a,
            isConfirmed: false
          }))),
          blockers: {
            create: analysisResult.potentialBlockers.map(b => ({
              type: b.type,
              question: b.question,
              resolved: false,
              userResponse: null
            }))
          }
        }
      });
    }

    const createdJob = await store.getJobById(newJob.id);

    return {
      message: 'Offre analysée et enregistrée avec succès !',
      job: createdJob
    };
  });

  // POST /api/v1/jobs/collect (Collecte automatique et déduplication)
  fastify.post('/jobs/collect', async (_request, reply) => {
    try {
      const result = await jobCollector.runCollection();
      return {
        message: `Collecte terminée : ${result.newOffersSaved} nouvelle(s) offre(s) indexée(s), ${result.duplicatesSkipped} doublon(s) ignoré(s).${result.failedSources.length ? ` Sources indisponibles : ${result.failedSources.join(', ')}.` : ''}`,
        result
      };
    } catch (err) {
      return reply.status(500).send({
        error: `Erreur lors de la collecte : ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      });
    }
  });

  // POST /api/v1/jobs/:id/analyze (Ré-analyse)
  fastify.post('/jobs/:id/analyze', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await store.getJobById(id);
    if (!job) {
      return reply.status(404).send({ error: 'Offre non trouvée' });
    }

    const user = await prisma.userProfile.findFirst({
      include: { resumes: true }
    });

    if (!user) {
      return reply.status(400).send({ error: 'Profil utilisateur introuvable' });
    }

    const primaryResume = user.resumes.find(r => r.isPrimary) || user.resumes[0];

    const analysisResult = await geminiService.analyzeJob({
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      userProfile: {
        fullName: user.fullName,
        headline: user.headline,
        skills: JSON.parse(user.skills || '[]'),
        location: user.location,
        searchPreferences: JSON.parse(user.searchPreferences || '{}')
      },
      cvText: primaryResume?.extractedText || ''
    });

    // Mise à jour de l'analyse dans SQLite
    await prisma.jobAnalysis.upsert({
      where: { jobId: id },
      update: {
        matchScore: analysisResult.matchScore,
        summary: analysisResult.summary,
        requiredSkills: JSON.stringify(analysisResult.requiredSkills),
        matchingSkills: JSON.stringify(analysisResult.matchingSkills),
        missingSkills: JSON.stringify(analysisResult.missingSkills),
        minExperienceYears: analysisResult.minExperienceYears
      },
      create: {
        jobId: id,
        matchScore: analysisResult.matchScore,
        summary: analysisResult.summary,
        requiredSkills: JSON.stringify(analysisResult.requiredSkills),
        matchingSkills: JSON.stringify(analysisResult.matchingSkills),
        missingSkills: JSON.stringify(analysisResult.missingSkills),
        minExperienceYears: analysisResult.minExperienceYears
      }
    });

    const updated = await store.getJobById(id);
    return {
      message: 'Analyse mise à jour par l IA',
      job: updated
    };
  });
};
