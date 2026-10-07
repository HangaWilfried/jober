import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du peuplement de la base de données SQLite...');

  const existingProfile = await prisma.userProfile.findFirst();
  if (existingProfile) {
    console.log('Profil existant détecté : seed ignoré afin de préserver les données locales.');
    return;
  }

  // 1. Profil Utilisateur
  const profile = await prisma.userProfile.create({
    data: {
      fullName: 'Alexandre Dev',
      email: 'alexandre.dev@example.com',
      phone: '+33 6 12 34 56 78',
      headline: 'Développeur Fullstack (Vue.js / Node.js)',
      location: 'Paris, France',
      skills: JSON.stringify([
        'Vue.js',
        'Vue 3',
        'TypeScript',
        'Node.js',
        'Fastify',
        'Tailwind CSS',
        'Docker',
        'Git',
        'REST API'
      ]),
      searchPreferences: JSON.stringify({
        targetTitles: ['Développeur Fullstack', 'Frontend Engineer Vue.js', 'Tech Lead Frontend'],
        remote: 'hybrid',
        minSalary: 55000,
        locations: ['Paris', 'Île-de-France', 'Télétravail'],
        excludedCompanies: []
      }),
      resumes: {
        create: [
          {
            name: 'CV_Alexandre_Fullstack_2026.pdf',
            isPrimary: true
          },
          {
            name: 'CV_Alexandre_LeadVue_2026.pdf',
            isPrimary: false
          }
        ]
      }
    }
  });

  console.log(`✓ Profil créé : ${profile.fullName}`);

  // 2. Offre 1 : Match 94% (Vue 3 / Node.js)
  const job1 = await prisma.jobOffer.create({
    data: {
      title: 'Senior Fullstack Engineer (Vue 3 / Node.js)',
      company: 'Novatech Labs',
      location: 'Paris (2 jours présentiel / 3 jours télétravail)',
      remoteType: 'hybrid',
      url: 'https://example.com/jobs/novatech-fullstack',
      source: 'Welcome to the Jungle',
      description: 'Nous recherchons un développeur Fullstack expérimenté maîtrisant Vue 3 (Composition API) et Node.js/TypeScript pour concevoir nos nouveaux outils métiers internes.',
      status: 'analyzed',
      analysis: {
        create: {
          matchScore: 94,
          summary: 'Excellente adéquation technique et organisationnelle. Stack 100% alignée (Vue 3, TypeScript, Node.js). Télétravail hybride conforme aux critères.',
          requiredSkills: JSON.stringify(['Vue.js', 'TypeScript', 'Node.js', 'REST API']),
          matchingSkills: JSON.stringify(['Vue.js', 'TypeScript', 'Node.js', 'REST API']),
          missingSkills: JSON.stringify([]),
          minExperienceYears: 4
        }
      },
      application: {
        create: {
          status: 'ready_for_review',
          matchScore: 94,
          readinessScore: 85,
          customizedHighlights: JSON.stringify([
            'Mise en valeur de 4 ans de projets en Vue 3 Composition API et TypeScript',
            'Expérience pratique sur les architectures Node.js orientées performance'
          ]),
          coverLetter: `Madame, Monsieur,\n\nC'est avec un grand enthousiasme que je vous adresse ma candidature pour le poste de Senior Fullstack Engineer au sein de Novatech Labs.\n\nFort de mon parcours sur l'écosystème Vue 3 et Node.js/TypeScript, j'ai développé une solide rigueur dans la conception d'applications réactives et maintenables. Vos projets d'outils métiers résonnent parfaitement avec mes réalisations récentes.\n\nRestant à votre entière disposition pour échanger de vive voix,\n\nAlexandre Dev`,
          preparedAnswers: JSON.stringify([
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
          ]),
          blockers: {
            create: [
              {
                type: 'subjective_question',
                question: 'Pourquoi souhaitez-vous rejoindre particulièrement Novatech Labs ?',
                resolved: false,
                userResponse: null
              }
            ]
          }
        }
      }
    }
  });

  // 3. Offre 2 : Match 88% (Lead Vue)
  const job2 = await prisma.jobOffer.create({
    data: {
      title: 'Lead Frontend Vue.js',
      company: 'DataFlow Systems',
      location: 'Full Remote (France)',
      remoteType: 'full',
      url: 'https://example.com/jobs/dataflow-lead-vue',
      source: 'LinkedIn',
      description: 'Rejoignez notre équipe pour piloter la refonte de notre plateforme SaaS vers Vue 3, Pinia et Tailwind CSS.',
      status: 'analyzed',
      analysis: {
        create: {
          matchScore: 88,
          summary: 'Profil très pertinent sur Vue 3 et Pinia. Expérience d architecture requise.',
          requiredSkills: JSON.stringify(['Vue 3', 'Pinia', 'Tailwind CSS', 'Architecture Frontend']),
          matchingSkills: JSON.stringify(['Vue 3', 'Tailwind CSS']),
          missingSkills: JSON.stringify(['Architecture Frontend']),
          minExperienceYears: 5
        }
      },
      application: {
        create: {
          status: 'prepared',
          matchScore: 88,
          readinessScore: 70,
          customizedHighlights: JSON.stringify([
            'Focus sur le design system avec Tailwind CSS et le state management Pinia'
          ]),
          coverLetter: `Madame, Monsieur,\n\nIntéressé par votre projet de refonte vers Vue 3 et Pinia, je souhaite vous apporter mon expertise technique...`,
          preparedAnswers: JSON.stringify([
            {
              question: 'Avez-vous déjà mené une migration de framework ?',
              suggestedAnswer: 'Oui, migration complète d un portail interne Vue 2 vers Vue 3.',
              confidence: 0.85,
              isConfirmed: false
            }
          ]),
          blockers: {
            create: [
              {
                type: 'subjective_question',
                question: 'Décrivez un défi d architecture complexe que vous avez résolu.',
                resolved: false,
                userResponse: null
              }
            ]
          }
        }
      }
    }
  });

  // 4. Offre 3 : Non retenue (Java / Angular)
  const job3 = await prisma.jobOffer.create({
    data: {
      title: 'Développeur Java / Angular Senior',
      company: 'Legacy Corp',
      location: 'La Défense',
      remoteType: 'on-site',
      url: 'https://example.com/jobs/legacy-java-angular',
      source: 'Indeed',
      description: 'Maintenance et migration de progiciels bancaires en Java Spring Boot et Angular 12.',
      status: 'rejected',
      analysis: {
        create: {
          matchScore: 25,
          summary: 'Non recommandé : compétences clés manquantes (Java, Spring Boot, Angular). Présentiel complet non souhaité.',
          requiredSkills: JSON.stringify(['Java', 'Spring Boot', 'Angular', 'Oracle DB']),
          matchingSkills: JSON.stringify([]),
          missingSkills: JSON.stringify(['Java', 'Spring Boot', 'Angular', 'Oracle DB']),
          minExperienceYears: 6
        }
      }
    }
  });

  console.log(`✓ 3 offres insérées en base (${job1.title}, ${job2.title}, ${job3.title})`);
  console.log('✨ Base de données SQLite prête !');
}

main()
  .catch((e) => {
    console.error('Erreur de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
