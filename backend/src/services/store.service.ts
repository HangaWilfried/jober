import { prisma } from '../db/prisma.js';
import { calculateReadinessScore } from './application-readiness.service.js';
import type { UserProfile, JobOffer, Application, ApplicationUpdate } from '../types/index.js';

export class DatabaseService {
  // ========================
  // 1. Profil Utilisateur
  // ========================
  async getProfile(): Promise<UserProfile | null> {
    const p = await prisma.userProfile.findFirst({
      include: { resumes: true }
    });

    if (!p) return null;

    return {
      id: p.id,
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      headline: p.headline,
      location: p.location,
      skills: JSON.parse(p.skills || '[]'),
      searchPreferences: JSON.parse(p.searchPreferences || '{}'),
      resumes: p.resumes.map(r => ({
        id: r.id,
        name: r.name,
        isPrimary: r.isPrimary,
        updatedAt: r.updatedAt.toISOString()
      }))
    };
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const existing = await prisma.userProfile.findFirst();
    if (!existing) return null;

    const dataToUpdate: any = {};
    if (updates.fullName !== undefined) dataToUpdate.fullName = updates.fullName;
    if (updates.email !== undefined) dataToUpdate.email = updates.email;
    if (updates.phone !== undefined) dataToUpdate.phone = updates.phone;
    if (updates.headline !== undefined) dataToUpdate.headline = updates.headline;
    if (updates.location !== undefined) dataToUpdate.location = updates.location;
    if (updates.skills !== undefined) dataToUpdate.skills = JSON.stringify(updates.skills);
    if (updates.searchPreferences !== undefined) {
      dataToUpdate.searchPreferences = JSON.stringify(updates.searchPreferences);
    }

    await prisma.userProfile.update({
      where: { id: existing.id },
      data: dataToUpdate
    });

    return this.getProfile();
  }

  // ========================
  // 2. Offres d'Emploi
  // ========================
  async getJobs(filters?: { status?: string; minMatch?: number }): Promise<JobOffer[]> {
    const where: any = {};
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    const offers = await prisma.jobOffer.findMany({
      where,
      include: {
        analysis: true,
        application: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted: JobOffer[] = offers.map(o => {
      let analysis: any = undefined;
      if (o.analysis) {
        analysis = {
          matchScore: o.analysis.matchScore,
          summary: o.analysis.summary,
          requiredSkills: JSON.parse(o.analysis.requiredSkills || '[]'),
          matchingSkills: JSON.parse(o.analysis.matchingSkills || '[]'),
          missingSkills: JSON.parse(o.analysis.missingSkills || '[]'),
          minExperienceYears: o.analysis.minExperienceYears,
          analysisMethod: o.analysis.analysisMethod as 'gemini' | 'local_fallback'
        };
      }

      return {
        id: o.id,
        title: o.title,
        company: o.company,
        location: o.location,
        remoteType: o.remoteType as any,
        url: o.url,
        source: o.source,
        description: o.description,
        publishedAt: o.publishedAt?.toISOString() ?? null,
        expiresAt: o.expiresAt?.toISOString() ?? null,
        status: o.status as any,
        analysis,
        applicationId: o.application?.id,
        applicationStatus: o.application?.status as Application['status'] | undefined
      };
    });

    if (filters?.minMatch !== undefined) {
      return formatted.filter(j => (j.analysis?.matchScore ?? 0) >= filters.minMatch!);
    }

    return formatted;
  }

  async getJobById(id: string): Promise<JobOffer | null> {
    const o = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        analysis: true,
        application: true
      }
    });

    if (!o) return null;

    let analysis: any = undefined;
    if (o.analysis) {
      analysis = {
        matchScore: o.analysis.matchScore,
        summary: o.analysis.summary,
        requiredSkills: JSON.parse(o.analysis.requiredSkills || '[]'),
        matchingSkills: JSON.parse(o.analysis.matchingSkills || '[]'),
        missingSkills: JSON.parse(o.analysis.missingSkills || '[]'),
        minExperienceYears: o.analysis.minExperienceYears,
        analysisMethod: o.analysis.analysisMethod as 'gemini' | 'local_fallback'
      };
    }

    return {
      id: o.id,
      title: o.title,
      company: o.company,
      location: o.location,
      remoteType: o.remoteType as any,
      url: o.url,
      source: o.source,
      description: o.description,
      publishedAt: o.publishedAt?.toISOString() ?? null,
      expiresAt: o.expiresAt?.toISOString() ?? null,
      status: o.status as any,
      analysis,
      applicationId: o.application?.id,
      applicationStatus: o.application?.status as Application['status'] | undefined
    };
  }

  // ========================
  // 3. Candidatures
  // ========================
  async getApplications(filters?: { status?: string }): Promise<Application[]> {
    const where: any = {};
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    const apps = await prisma.application.findMany({
      where,
      include: {
        job: true,
        blockers: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(apps.map(a => this.formatApplication(a)));
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const a = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        blockers: true
      }
    });

    if (!a) return null;
    return this.formatApplication(a);
  }

  private async formatApplication(a: any): Promise<Application> {
    const [selectedResumeRecord, availableResumeRecords] = await Promise.all([
      a.selectedResumeId
        ? prisma.resume.findUnique({ where: { id: a.selectedResumeId } })
        : Promise.resolve(null),
      prisma.resume.findMany({
        where: { extractedText: { not: null } },
        select: { id: true, name: true, isPrimary: true, updatedAt: true, extractedText: true }
      })
    ]);
    const toResumeItem = (resume: {
      id: string;
      name: string;
      isPrimary: boolean;
      updatedAt: Date;
    }) => ({
      id: resume.id,
      name: resume.name,
      isPrimary: resume.isPrimary,
      updatedAt: resume.updatedAt.toISOString()
    });
    const selectedResume = selectedResumeRecord ? toResumeItem(selectedResumeRecord) : undefined;
    const availableResumes = availableResumeRecords
      .filter((resume) => Boolean(resume.extractedText?.trim()))
      .map(toResumeItem);

    return {
      id: a.id,
      jobId: a.jobId,
      jobTitle: a.job.title,
      company: a.job.company,
      status: a.status as any,
      matchScore: a.matchScore,
      readinessScore: a.readinessScore,
      preparedData: {
        selectedResume,
        availableResumes,
        customizedResumeContent: a.customizedResumeContent,
        customizedResumeConfirmed: a.customizedResumeConfirmed,
        customizedHighlights: JSON.parse(a.customizedHighlights || '[]'),
        coverLetter: a.coverLetter,
        coverLetterConfirmed: a.coverLetterConfirmed,
        preparedAnswers: JSON.parse(a.preparedAnswers || '[]')
      },
      blockers: a.blockers.map((b: any) => ({
        id: b.id,
        type: b.type,
        question: b.question,
        resolved: b.resolved,
        userResponse: b.userResponse
      })),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null
    };
  }

  async updateApplication(id: string, updates: ApplicationUpdate): Promise<Application | null> {
    const current = await prisma.application.findUnique({
      where: { id },
      include: { blockers: true }
    });
    if (!current) return null;

    const data: {
      coverLetter?: string;
      coverLetterConfirmed?: boolean;
      customizedResumeContent?: string;
      customizedResumeConfirmed?: boolean;
      customizedHighlights?: string;
      preparedAnswers?: string;
      selectedResumeId?: string | null;
      readinessScore?: number;
      status?: string;
    } = {};
    if (updates.preparedData?.coverLetter !== undefined) {
      data.coverLetter = updates.preparedData.coverLetter;
      if (updates.preparedData.coverLetter !== current.coverLetter) {
        data.coverLetterConfirmed = false;
      }
    }
    if (updates.preparedData?.coverLetterConfirmed !== undefined) {
      if (updates.preparedData.coverLetterConfirmed && !(
        updates.preparedData.coverLetter ?? current.coverLetter
      ).trim()) return null;
      data.coverLetterConfirmed = updates.preparedData.coverLetterConfirmed;
    }
    if (updates.preparedData?.customizedResumeContent !== undefined) {
      data.customizedResumeContent = updates.preparedData.customizedResumeContent;
      if (updates.preparedData.customizedResumeContent !== current.customizedResumeContent) {
        data.customizedResumeConfirmed = false;
      }
    }
    if (updates.preparedData?.customizedResumeConfirmed !== undefined) {
      if (updates.preparedData.customizedResumeConfirmed && !(
        updates.preparedData.customizedResumeContent ?? current.customizedResumeContent
      ).trim()) return null;
      data.customizedResumeConfirmed = updates.preparedData.customizedResumeConfirmed;
    }
    if (updates.preparedData?.customizedHighlights !== undefined) {
      data.customizedHighlights = JSON.stringify(updates.preparedData.customizedHighlights);
    }
    if (updates.preparedData?.preparedAnswers !== undefined) {
      data.preparedAnswers = JSON.stringify(updates.preparedData.preparedAnswers);
    }
    if (updates.preparedData?.selectedResumeId !== undefined) {
      if (updates.preparedData.selectedResumeId === null) {
        data.selectedResumeId = null;
      } else {
        const resume = await prisma.resume.findFirst({
          where: {
            id: updates.preparedData.selectedResumeId,
            extractedText: { not: null }
          }
        });
        if (!resume?.extractedText?.trim()) return null;
        data.selectedResumeId = resume.id;
      }
      if (updates.preparedData.selectedResumeId !== current.selectedResumeId) {
        data.customizedResumeContent = '';
        data.customizedResumeConfirmed = false;
        data.coverLetterConfirmed = false;
      }
    }

    if (!current.status.startsWith('submitted_')) {
      const selectedResumeId = data.selectedResumeId ?? current.selectedResumeId;
      const resume = selectedResumeId
        ? await prisma.resume.findUnique({ where: { id: selectedResumeId } })
        : null;
      const unresolvedBlockerCount = current.blockers.filter((blocker) => !blocker.resolved).length;
      const answers: unknown = updates.preparedData?.preparedAnswers ??
        JSON.parse(current.preparedAnswers || '[]');
      const unconfirmedAnswers = Array.isArray(answers)
        ? answers.filter((answer) =>
            typeof answer === 'object' &&
            answer !== null &&
            'isConfirmed' in answer &&
            answer.isConfirmed !== true
          ).length
        : 1;
      const readinessScore = calculateReadinessScore({
        hasResume: Boolean(resume?.extractedText?.trim()),
        customizedResumeConfirmed:
          data.customizedResumeConfirmed ?? (
            data.selectedResumeId !== undefined
              ? false
              : current.customizedResumeConfirmed
          ),
        coverLetterConfirmed: data.coverLetterConfirmed ?? (
          data.selectedResumeId !== undefined
            ? false
            : current.coverLetterConfirmed
        ),
        unresolvedBlockerCount: unresolvedBlockerCount + unconfirmedAnswers
      });
      data.readinessScore = readinessScore;
      data.status = readinessScore === 100 ? 'ready_to_submit' : 'ready_for_review';
    }

    await prisma.application.update({
      where: { id },
      data
    });

    return this.getApplicationById(id);
  }

  async resolveBlocker(appId: string, blockerId: string, response: string): Promise<Application | null> {
    if (!response.trim()) return null;
    const resolved = await prisma.$transaction(async (transaction) => {
      const application = await transaction.application.findUnique({
        where: { id: appId },
        include: { blockers: true }
      });
      const blocker = application?.blockers.find((item) => item.id === blockerId);
      if (!application || !blocker) return false;

      await transaction.applicationBlocker.update({
        where: { id: blockerId },
        data: { resolved: true, userResponse: response }
      });

      const unresolvedBlockerCount = await transaction.applicationBlocker.count({
        where: { applicationId: appId, resolved: false }
      });
      const resume = application.selectedResumeId
        ? await transaction.resume.findUnique({ where: { id: application.selectedResumeId } })
        : null;
      const answers: unknown = JSON.parse(application.preparedAnswers || '[]');
      const unconfirmedAnswers = Array.isArray(answers)
        ? answers.filter((answer) =>
            typeof answer === 'object' &&
            answer !== null &&
            'isConfirmed' in answer &&
            answer.isConfirmed !== true
          ).length
        : 1;
      const readinessScore = calculateReadinessScore({
        hasResume: Boolean(resume?.extractedText?.trim()),
        customizedResumeConfirmed: application.customizedResumeConfirmed,
        coverLetterConfirmed: application.coverLetterConfirmed,
        unresolvedBlockerCount: unresolvedBlockerCount + unconfirmedAnswers
      });
      await transaction.application.update({
        where: { id: appId },
        data: {
          readinessScore,
          status: readinessScore === 100 ? 'ready_to_submit' : 'ready_for_review'
        }
      });
      return true;
    });
    if (!resolved) return null;

    return this.getApplicationById(appId);
  }

  async submitApplication(id: string): Promise<Application | null> {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { blockers: true }
    });
    if (!application) return null;

    const unresolvedBlockers = application.blockers.some((blocker) => !blocker.resolved);
    const answers: unknown = JSON.parse(application.preparedAnswers || '[]');
    const unconfirmedAnswers = Array.isArray(answers) && answers.some((answer) =>
      typeof answer === 'object' &&
      answer !== null &&
      'isConfirmed' in answer &&
      answer.isConfirmed !== true
    );
    const resume = application.selectedResumeId
      ? await prisma.resume.findUnique({ where: { id: application.selectedResumeId } })
      : null;
    const readinessScore = calculateReadinessScore({
      hasResume: Boolean(resume?.extractedText?.trim()),
      customizedResumeConfirmed: application.customizedResumeConfirmed,
      coverLetterConfirmed: application.coverLetterConfirmed,
      unresolvedBlockerCount: application.blockers.filter((blocker) => !blocker.resolved).length +
        (unconfirmedAnswers ? 1 : 0)
    });
    if (unresolvedBlockers || unconfirmedAnswers || readinessScore !== 100) {
      return null;
    }

    await prisma.application.update({
      where: { id },
      data: {
        status: 'submitted_manual',
        submittedAt: new Date()
      }
    });

    return this.getApplicationById(id);
  }
}

export const store = new DatabaseService();
