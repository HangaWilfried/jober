import { FastifyPluginAsync } from 'fastify';
import { store } from '../services/store.service.js';
import {
  ResumeParseError,
  resumeParser,
  type ParsedResumeResult
} from '../services/resume-parser.service.js';
import { prisma } from '../db/prisma.js';
import { UserProfileUpdateSchema } from '../types/index.js';

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/profile
  fastify.get('/profile', async () => {
    return store.getProfile();
  });

  // PUT /api/v1/profile
  fastify.put('/profile', async (request, reply) => {
    const parsed = UserProfileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Les informations du profil sont invalides.' });
    }
    return store.updateProfile(parsed.data);
  });

  // POST /api/v1/profile/resume/upload
  fastify.post('/profile/resume/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Aucun fichier PDF fourni' });
    }

    if (!/\.(pdf|txt)$/i.test(data.filename)) {
      return reply.status(400).send({ error: 'Formats acceptés : PDF et texte brut (.txt).' });
    }

    const user = await prisma.userProfile.findFirst();
    if (!user) {
      return reply.status(404).send({ error: 'Profil utilisateur introuvable' });
    }

    const buffer = await data.toBuffer();
    let parsed: ParsedResumeResult;
    try {
      parsed = await resumeParser.parseResumeBuffer(buffer, data.filename);
    } catch (error) {
      if (error instanceof ResumeParseError) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }

    // Si premier CV ou marqué comme principal
    const existingResumesCount = await prisma.resume.count({
      where: { profileId: user.id }
    });

    const isPrimary = existingResumesCount === 0;

    // Sauvegarde du CV dans SQLite
    const newResume = await prisma.resume.create({
      data: {
        profileId: user.id,
        name: parsed.fileName,
        filePath: parsed.filePath,
        extractedText: parsed.extractedText,
        isPrimary
      }
    });

    // Optionnel : enrichir les compétences du profil avec les compétences détectées
    const currentSkills: string[] = JSON.parse(user.skills || '[]');
    const mergedSkills = Array.from(new Set([...currentSkills, ...parsed.detectedSkills]));

    await prisma.userProfile.update({
      where: { id: user.id },
      data: {
        skills: JSON.stringify(mergedSkills),
        // Si l'email ou le téléphone n'étaient pas renseignés, on peut les mettre à jour
        email: user.email === 'alexandre.dev@example.com' && parsed.detectedEmail ? parsed.detectedEmail : user.email,
        phone: user.phone === '+33 6 12 34 56 78' && parsed.detectedPhone ? parsed.detectedPhone : user.phone
      }
    });

    const updatedProfile = await store.getProfile();

    return {
      message: 'CV uploadé et analysé avec succès',
      resume: {
        id: newResume.id,
        name: newResume.name,
        isPrimary: newResume.isPrimary,
        updatedAt: newResume.updatedAt.toISOString(),
        wordCount: parsed.wordCount,
        detectedSkills: parsed.detectedSkills
      },
      profile: updatedProfile
    };
  });

  // POST /api/v1/profile/resume/:id/primary
  fastify.post('/profile/resume/:id/primary', async (request, reply) => {
    const { id } = request.params as { id: string };

    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume) {
      return reply.status(404).send({ error: 'CV introuvable' });
    }

    // Mettre à false tous les autres
    await prisma.resume.updateMany({
      where: { profileId: resume.profileId },
      data: { isPrimary: false }
    });

    // Mettre à true celui-ci
    await prisma.resume.update({
      where: { id },
      data: { isPrimary: true }
    });

    return store.getProfile();
  });

  // DELETE /api/v1/profile/resume/:id
  fastify.delete('/profile/resume/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume) {
      return reply.status(404).send({ error: 'CV introuvable' });
    }

    await prisma.resume.delete({ where: { id } });
    return store.getProfile();
  });
};
