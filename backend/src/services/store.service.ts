import { UserProfile, JobOffer, Application } from '../types/index.js';

class DataStore {
  private profile: UserProfile = {
    id: 'usr_me',
    fullName: 'Alexandre Dev',
    email: 'alexandre.dev@example.com',
    phone: '+33 6 12 34 56 78',
    headline: 'Développeur Fullstack (Vue.js / Node.js)',
    location: 'Paris, France',
    skills: ['Vue.js', 'Vue 3', 'TypeScript', 'Node.js', 'Fastify', 'Tailwind CSS', 'Docker', 'Git', 'REST API'],
    searchPreferences: {
      targetTitles: ['Développeur Fullstack', 'Frontend Engineer Vue.js', 'Tech Lead Frontend'],
      remote: 'hybrid',
      minSalary: 55000,
      locations: ['Paris', 'Île-de-France', 'Télétravail'],
      excludedCompanies: []
    },
    resumes: [
      {
        id: 'res_01',
        name: 'CV_Alexandre_Fullstack_2026.pdf',
        isPrimary: true,
        updatedAt: '2026-10-01T08:00:00Z'
      },
      {
        id: 'res_02',
        name: 'CV_Alexandre_LeadVue_2026.pdf',
        isPrimary: false,
        updatedAt: '2026-09-20T14:30:00Z'
      }
    ]
  };

  private jobs: JobOffer[] = [
    {
      id: 'job_01',
      title: 'Senior Fullstack Engineer (Vue 3 / Node.js)',
      company: 'Novatech Labs',
      location: 'Paris (2 jours présentiel / 3 jours télétravail)',
      remoteType: 'hybrid',
      url: 'https://example.com/jobs/novatech-fullstack',
      source: 'Welcome to the Jungle',
      description: 'Nous recherchons un développeur Fullstack expérimenté maîtrisant Vue 3 (Composition API) et Node.js/TypeScript pour concevoir nos nouveaux outils métiers internes.',
      publishedAt: '2026-10-05T10:15:00Z',
      status: 'analyzed',
      analysis: {
        matchScore: 94,
        summary: 'Excellente adéquation technique et organisationnelle. Stack 100% alignée (Vue 3, TypeScript, Node.js). Télétravail hybride conforme aux critères.',
        requiredSkills: ['Vue.js', 'TypeScript', 'Node.js', 'REST API'],
        matchingSkills: ['Vue.js', 'TypeScript', 'Node.js', 'REST API'],
        missingSkills: [],
        minExperienceYears: 4
      },
      applicationId: 'app_01'
    },
    {
      id: 'job_02',
      title: 'Lead Frontend Vue.js',
      company: 'DataFlow Systems',
      location: 'Full Remote (France)',
      remoteType: 'full',
      url: 'https://example.com/jobs/dataflow-lead-vue',
      source: 'LinkedIn',
      description: 'Rejoignez notre équipe pour piloter la refonte de notre plateforme SaaS vers Vue 3, Pinia et Tailwind CSS.',
      publishedAt: '2026-10-04T16:45:00Z',
      status: 'analyzed',
      analysis: {
        matchScore: 88,
        summary: 'Profil très pertinent sur Vue 3 et Pinia. Expérience d architecture requise.',
        requiredSkills: ['Vue 3', 'Pinia', 'Tailwind CSS', 'Architecture Frontend'],
        matchingSkills: ['Vue 3', 'Tailwind CSS'],
        missingSkills: ['Architecture Frontend'],
        minExperienceYears: 5
      },
      applicationId: 'app_02'
    },
    {
      id: 'job_03',
      title: 'Développeur Java / Angular Senior',
      company: 'Legacy Corp',
      location: 'La Défense',
      remoteType: 'on-site',
      url: 'https://example.com/jobs/legacy-java-angular',
      source: 'Indeed',
      description: 'Maintenance et migration de progiciels bancaires en Java Spring Boot et Angular 12.',
      publishedAt: '2026-10-02T09:00:00Z',
      status: 'rejected',
      analysis: {
        matchScore: 25,
        summary: 'Non recommandé : compétences clés manquantes (Java, Spring Boot, Angular). Présentiel complet non souhaité.',
        requiredSkills: ['Java', 'Spring Boot', 'Angular', 'Oracle DB'],
        matchingSkills: [],
        missingSkills: ['Java', 'Spring Boot', 'Angular', 'Oracle DB'],
        minExperienceYears: 6
      }
    }
  ];

  private applications: Application[] = [
    {
      id: 'app_01',
      jobId: 'job_01',
      jobTitle: 'Senior Fullstack Engineer (Vue 3 / Node.js)',
      company: 'Novatech Labs',
      status: 'ready_for_review',
      matchScore: 94,
      readinessScore: 85,
      preparedData: {
        selectedResume: {
          id: 'res_01',
          name: 'CV_Alexandre_Fullstack_2026.pdf',
          isPrimary: true,
          updatedAt: '2026-10-01T08:00:00Z'
        },
        customizedHighlights: [
          'Mise en valeur de 4 ans de projets en Vue 3 Composition API et TypeScript',
          'Expérience pratique sur les architectures Node.js orientées performance'
        ],
        coverLetter: `Madame, Monsieur,\n\nC'est avec un grand enthousiasme que je vous adresse ma candidature pour le poste de Senior Fullstack Engineer au sein de Novatech Labs.\n\nFort de mon parcours sur l'écosystème Vue 3 et Node.js/TypeScript, j'ai développé une solide rigueur dans la conception d'applications réactives et maintenables. Vos projets d'outils métiers résonnent parfaitement avec mes réalisations récentes.\n\nRestant à votre entière disposition pour échanger de vive voix,\n\nAlexandre Dev`,
        preparedAnswers: [
          {
            question: 'Quel est votre délai de préavis ?',
            suggestedAnswer: '1 mois (négociable)',
            confidence: 0.95,
            isConfirmed: true
          },
          {
            question: 'Vos prétentions salariales brutes annuelles ?',
            suggestedAnswer: '58 000 €',
            confidence: 0.9,
            isConfirmed: false
          }
        ]
      },
      blockers: [
        {
          id: 'blk_01',
          type: 'subjective_question',
          question: 'Pourquoi souhaitez-vous rejoindre particulièrement Novatech Labs ?',
          resolved: false,
          userResponse: null
        }
      ],
      submittedAt: null
    },
    {
      id: 'app_02',
      jobId: 'job_02',
      jobTitle: 'Lead Frontend Vue.js',
      company: 'DataFlow Systems',
      status: 'prepared',
      matchScore: 88,
      readinessScore: 70,
      preparedData: {
        selectedResume: {
          id: 'res_02',
          name: 'CV_Alexandre_LeadVue_2026.pdf',
          isPrimary: false,
          updatedAt: '2026-09-20T14:30:00Z'
        },
        customizedHighlights: [
          'Focus sur le design system avec Tailwind CSS et le state management Pinia'
        ],
        coverLetter: `Madame, Monsieur,\n\nIntéressé par votre projet de refonte vers Vue 3 et Pinia, je souhaite vous apporter mon expertise technique...`,
        preparedAnswers: [
          {
            question: 'Avez-vous déjà mené une migration de framework ?',
            suggestedAnswer: 'Oui, migration complète d un portail interne Vue 2 vers Vue 3.',
            confidence: 0.85,
            isConfirmed: false
          }
        ]
      },
      blockers: [
        {
          id: 'blk_02',
          type: 'subjective_question',
          question: 'Décrivez un défi d architecture complexe que vous avez résolu.',
          resolved: false,
          userResponse: null
        }
      ],
      submittedAt: null
    }
  ];

  // Profil
  getProfile(): UserProfile {
    return this.profile;
  }

  updateProfile(update: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...update };
    return this.profile;
  }

  // Offres
  getJobs(filters?: { status?: string; minMatch?: number }): JobOffer[] {
    let result = [...this.jobs];
    if (filters?.status) {
      result = result.filter(j => j.status === filters.status);
    }
    if (filters?.minMatch !== undefined) {
      result = result.filter(j => (j.analysis?.matchScore ?? 0) >= filters.minMatch!);
    }
    return result;
  }

  getJobById(id: string): JobOffer | undefined {
    return this.jobs.find(j => j.id === id);
  }

  // Candidatures
  getApplications(filters?: { status?: string }): Application[] {
    let result = [...this.applications];
    if (filters?.status) {
      result = result.filter(a => a.status === filters.status);
    }
    return result;
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.find(a => a.id === id);
  }

  updateApplication(id: string, updates: Partial<Application>): Application | undefined {
    const appIndex = this.applications.findIndex(a => a.id === id);
    if (appIndex === -1) return undefined;

    const current = this.applications[appIndex];
    const updated = { ...current, ...updates };

    // Si tous les bloqueurs sont résolus, on augmente la readiness
    const hasUnresolvedBlockers = updated.blockers.some(b => !b.resolved);
    if (!hasUnresolvedBlockers && updated.readinessScore < 100) {
      updated.readinessScore = 100;
      if (updated.status === 'ready_for_review') {
        updated.status = 'ready_to_submit';
      }
    }

    this.applications[appIndex] = updated;
    return updated;
  }

  resolveBlocker(appId: string, blockerId: string, response: string): Application | undefined {
    const app = this.getApplicationById(appId);
    if (!app) return undefined;

    const blocker = app.blockers.find(b => b.id === blockerId);
    if (blocker) {
      blocker.resolved = true;
      blocker.userResponse = response;
    }

    return this.updateApplication(appId, { blockers: app.blockers });
  }

  submitApplication(id: string): Application | undefined {
    const app = this.getApplicationById(id);
    if (!app) return undefined;

    app.status = 'submitted_manual';
    app.submittedAt = new Date().toISOString();
    return app;
  }
}

export const store = new DataStore();

