import { prisma } from '../db/prisma.js';
import type { UserProfile, JobOffer, Application } from '../types/index.js';

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
          minExperienceYears: o.analysis.minExperienceYears
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
        publishedAt: o.publishedAt.toISOString(),
        status: o.status as any,
        analysis,
        applicationId: o.application?.id
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
        minExperienceYears: o.analysis.minExperienceYears
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
      publishedAt: o.publishedAt.toISOString(),
      status: o.status as any,
      analysis,
      applicationId: o.application?.id
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
    let selectedResume: any = undefined;
    if (a.selectedResumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: a.selectedResumeId } });
      if (resume) {
        selectedResume = {
          id: resume.id,
          name: resume.name,
          isPrimary: resume.isPrimary,
          updatedAt: resume.updatedAt.toISOString()
        };
      }
    } else {
      const primaryResume = await prisma.resume.findFirst({ where: { isPrimary: true } });
      if (primaryResume) {
        selectedResume = {
          id: primaryResume.id,
          name: primaryResume.name,
          isPrimary: primaryResume.isPrimary,
          updatedAt: primaryResume.updatedAt.toISOString()
        };
      }
    }

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
        customizedHighlights: JSON.parse(a.customizedHighlights || '[]'),
        coverLetter: a.coverLetter,
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

  async updateApplication(id: string, updates: any): Promise<Application | null> {
    const current = await prisma.application.findUnique({
      where: { id },
      include: { blockers: true }
    });
    if (!current) return null;

    const data: any = {};
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.preparedData?.coverLetter !== undefined) {
      data.coverLetter = updates.preparedData.coverLetter;
    }
    if (updates.preparedData?.customizedHighlights !== undefined) {
      data.customizedHighlights = JSON.stringify(updates.preparedData.customizedHighlights);
    }
    if (updates.preparedData?.preparedAnswers !== undefined) {
      data.preparedAnswers = JSON.stringify(updates.preparedData.preparedAnswers);
    }

    await prisma.application.update({
      where: { id },
      data
    });

    return this.getApplicationById(id);
  }

  async resolveBlocker(appId: string, blockerId: string, response: string): Promise<Application | null> {
    await prisma.applicationBlocker.update({
      where: { id: blockerId },
      data: {
        resolved: true,
        userResponse: response
      }
    });

    // Vérifie s'il reste des bloqueurs non résolus
    const remainingUnresolved = await prisma.applicationBlocker.count({
      where: {
        applicationId: appId,
        resolved: false
      }
    });

    if (remainingUnresolved === 0) {
      await prisma.application.update({
        where: { id: appId },
        data: {
          readinessScore: 100,
          status: 'ready_to_submit'
        }
      });
    }

    return this.getApplicationById(appId);
  }

  async submitApplication(id: string): Promise<Application | null> {
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
