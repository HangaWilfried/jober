import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { SearchPreferences } from '../types/index.js';

const JobAnalysisResultSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  requiredSkills: z.array(z.string()),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  minExperienceYears: z.number().int().nonnegative(),
  customizedResumeContent: z.string(),
  customizedHighlights: z.array(z.string()),
  draftCoverLetter: z.string(),
  preparedAnswers: z.array(z.object({
    question: z.string(),
    suggestedAnswer: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  potentialBlockers: z.array(z.object({
    type: z.enum(['subjective_question', 'missing_document', 'captcha', 'salary_expectation', 'other']),
    question: z.string()
  }))
});

export interface JobAnalysisResult {
  matchScore: number;
  summary: string;
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  minExperienceYears: number;
  customizedResumeContent: string;
  customizedHighlights: string[];
  draftCoverLetter: string;
  preparedAnswers: Array<{
    question: string;
    suggestedAnswer: string;
    confidence: number;
  }>;
  potentialBlockers: Array<{
    type: 'subjective_question' | 'missing_document' | 'captcha' | 'salary_expectation' | 'other';
    question: string;
  }>;
  analysisMethod: 'gemini' | 'local_fallback';
}

export class GeminiService {
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  private getClient(): GoogleGenAI | null {
    if (!this.client && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.client;
  }

  /**
   * Analyse une offre d'emploi par rapport au profil et au CV de l'utilisateur
   */
  async analyzeJob(params: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    userProfile: {
      fullName: string;
      headline: string;
      skills: string[];
      location: string;
      searchPreferences: SearchPreferences;
    };
    cvText: string;
  }): Promise<JobAnalysisResult> {
    const client = this.getClient();

    if (!client) {
      console.warn('⚠️ GEMINI_API_KEY non configurée dans backend/.env. Utilisation de l analyse heuristique locale.');
      return this.fallbackLocalAnalysis(params);
    }

    try {
      const prompt = `
Tu es un expert en recrutement technique et analyse de CV.
Tu dois analyser avec rigueur l'adéquation entre le profil d'un candidat et une offre d'emploi.

INFORMATIONS CANDIDAT :
- Nom : ${params.userProfile.fullName}
- Titre : ${params.userProfile.headline}
- Compétences déclarées : ${params.userProfile.skills.join(', ')}
- Préférences de recherche : ${JSON.stringify(params.userProfile.searchPreferences)}
- Contenu brut du CV :
"""
${params.cvText || 'Aucun texte de CV disponible. Se baser uniquement sur les compétences déclarées.'}
"""

OFFRE D'EMPLOI :
- Poste : ${params.jobTitle}
- Entreprise : ${params.company}
- Description brute :
"""
${params.jobDescription}
"""

CONSIGNES STRICTES :
1. Extrais les compétences techniques indispensables requises par l'offre.
2. Compare les compétences requises avec celles présentes dans le CV ou profil du candidat.
3. Calcule un "matchScore" (entier entre 0 et 100) représentant la fidélité de l'adéquation technique et fonctionnelle.
4. Rédige un résumé explicatif franc et objectif ("summary") expliquant pourquoi l'offre correspond ou pas.
5. Identifie les "customizedHighlights" : 2 à 3 points forts concrets du candidat à valoriser pour cette offre spécifique.
6. Rédige une version du CV adaptée à l'offre ("customizedResumeContent"). Réorganise et reformule uniquement les faits déjà présents dans le CV. N'invente jamais d'expérience, date, diplôme, résultat, compétence ou chiffre. Omet les éléments inconnus; si le CV est absent, retourne une chaîne vide.
7. Rédige une lettre de motivation ("draftCoverLetter") personnalisée et percutante (en français), évitant le jargon creux et les faits non présents dans le CV.
8. Identifie d'éventuels bloqueurs subjectifs ("potentialBlockers") requérant une réponse humaine (ex: "Pourquoi rejoindre notre entreprise ?").
9. Prépare les réponses ("preparedAnswers") aux questions courantes (années d'expérience, disponibilité, etc.), mais laisse vides celles pour lesquelles aucune donnée fiable n'est fournie.
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.INTEGER, description: 'Score de 0 à 100' },
              summary: { type: Type.STRING, description: 'Résumé de l adéquation' },
              requiredSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Compétences demandées par le poste'
              },
              matchingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Compétences maîtrisées par le candidat'
              },
              missingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Compétences manquantes ou non mentionnées'
              },
              minExperienceYears: { type: Type.INTEGER, description: 'Années d expérience demandées' },
              customizedResumeContent: {
                type: Type.STRING,
                description: 'CV adapté à l’offre sans ajout de faits non présents dans le CV source'
              },
              customizedHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Points forts du candidat pour cette offre'
              },
              draftCoverLetter: { type: Type.STRING, description: 'Lettre de motivation personnalisée' },
              preparedAnswers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    suggestedAnswer: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ['question', 'suggestedAnswer', 'confidence']
                }
              },
              potentialBlockers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      enum: ['subjective_question', 'missing_document', 'captcha', 'salary_expectation', 'other']
                    },
                    question: { type: Type.STRING }
                  },
                  required: ['type', 'question']
                }
              }
            },
            required: [
              'matchScore',
              'summary',
              'requiredSkills',
              'matchingSkills',
              'missingSkills',
              'minExperienceYears',
              'customizedResumeContent',
              'customizedHighlights',
              'draftCoverLetter',
              'preparedAnswers',
              'potentialBlockers'
            ]
          }
        }
      });

      if (!response.text) {
        throw new Error('Réponse vide de Gemini');
      }

      const parsed = JobAnalysisResultSchema.parse(JSON.parse(response.text));
      return { ...parsed, analysisMethod: 'gemini' };
    } catch (err: any) {
      console.error('Erreur lors de l appel Gemini API:', err);
      return this.fallbackLocalAnalysis(params);
    }
  }

  /**
   * Régénère une lettre de motivation avec des consignes ou un ton spécifique
   */
  async regenerateCoverLetter(params: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    userProfile: { fullName: string; headline: string; skills: string[] };
    cvText: string;
    instructions?: string;
    tone?: string;
  }): Promise<string> {
    const client = this.getClient();

    if (!client) {
      return `Madame, Monsieur,\n\nC'est avec un grand intérêt que je vous transmets ma candidature pour le poste de ${params.jobTitle} chez ${params.company}.\n\nFort de mon expertise sur ${params.userProfile.skills.slice(0, 3).join(', ')}, je saurai apporter une contribution immédiate à vos projets.\n\nCordialement,\n${params.userProfile.fullName}`;
    }

    try {
      const prompt = `
Rédige une lettre de motivation professionnelle en français pour le poste suivant :
Poste : ${params.jobTitle}
Entreprise : ${params.company}
Description du poste :
${params.jobDescription}

Candidat :
Nom : ${params.userProfile.fullName}
Titre : ${params.userProfile.headline}
Compétences : ${params.userProfile.skills.join(', ')}
CV :
${params.cvText}

Consignes supplémentaires :
- Ton souhaité : ${params.tone || 'Professionnel, dynamique et percutant'}
- Instructions spécifiques de l'utilisateur : ${params.instructions || 'Mettre en valeur les réalisations concrètes et la valeur ajoutée apportée.'}
- Sois concis (3 à 4 paragraphes percutants). Évite les formules plates et clichées.
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return response.text || 'Erreur lors de la génération de la lettre.';
    } catch (err: any) {
      console.error('Erreur régénération lettre Gemini:', err);
      return `Madame, Monsieur,\n\nJe vous adresse ma candidature pour le poste de ${params.jobTitle} au sein de ${params.company}.\n\nCordialement,\n${params.userProfile.fullName}`;
    }
  }

  /**
   * Suggère une réponse assistée par l'IA à une question bloquante du recruteur
   */
  async generateSuggestedAnswer(params: {
    question: string;
    jobTitle: string;
    company: string;
    userProfile: { fullName: string; headline: string; skills: string[] };
    cvText: string;
  }): Promise<string> {
    const client = this.getClient();

    if (!client) {
      return `Je souhaite rejoindre ${params.company} pour apporter mes compétences sur ${params.userProfile.skills.slice(0, 2).join(', ')} et participer activement au développement de vos projets.`;
    }

    try {
      const prompt = `
Tu es l'assistant de candidature du candidat ${params.userProfile.fullName} (${params.userProfile.headline}).
Un formulaire de recrutement pour le poste de "${params.jobTitle}" chez "${params.company}" pose la question suivante :
"${params.question}"

Propose une réponse percutante, sincère et adaptée (en français, 2 à 4 phrases max), basée sur les compétences du candidat (${params.userProfile.skills.join(', ')}) et son CV :
${params.cvText}
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return response.text?.trim() || '';
    } catch (err: any) {
      console.error('Erreur suggestion réponse Gemini:', err);
      return `Mon profil et mon expérience sur ${params.userProfile.skills.slice(0, 2).join(', ')} s alignent étroitement avec les objectifs de ${params.company}.`;
    }
  }

  /**
   * Analyse algorithmique locale (fallback si clé non renseignée ou coupure réseau)
   */
  private fallbackLocalAnalysis(params: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    userProfile: { fullName: string; headline: string; skills: string[] };
    cvText: string;
  }): JobAnalysisResult {
    const desc = params.jobDescription.toLowerCase();
    const candidateText = `${params.userProfile.skills.join(' ')} ${params.cvText}`.toLowerCase();
    const commonTechs = [
      'Vue.js', 'Vue 3', 'React', 'TypeScript', 'Node.js', 'Python', 'Java',
      'Docker', 'PostgreSQL', 'Tailwind CSS', 'AWS', 'GraphQL', 'Fastify'
    ];
    const requiredSkills = commonTechs.filter((skill) => desc.includes(skill.toLowerCase()));
    const matchingSkills = requiredSkills.filter((skill) => candidateText.includes(skill.toLowerCase()));
    
    const missingSkills = requiredSkills.filter((skill) => !matchingSkills.includes(skill));
    const matchScore = requiredSkills.length === 0
      ? 0
      : Math.min(Math.round((matchingSkills.length / requiredSkills.length) * 100), 75);
    const experienceMatch = params.jobDescription.match(
      /(?:minimum|min\.?|au moins|[+]?)\s*(\d{1,2})\s*(?:ans?|années?)\s*(?:d['’ ]expérience)?/i
    );
    const minExperienceYears = experienceMatch ? Number(experienceMatch[1]) : 0;
    const potentialBlockers: JobAnalysisResult['potentialBlockers'] = [{
      type: 'subjective_question',
      question: `Vérifiez les questions spécifiques posées par ${params.company} avant de répondre.`
    }, {
      type: 'other',
      question: 'Le CV source n’a pas été adapté automatiquement. Adaptez-le et vérifiez son contenu avant de l’envoyer.'
    }];
    if (/\b(salaire|rémunération|prétentions)\b/i.test(params.jobDescription)) {
      potentialBlockers.push({
        type: 'salary_expectation',
        question: 'Prétentions salariales : indiquez et confirmez votre montant.'
      });
    }

    return {
      matchScore,
      summary: `Estimation locale heuristique, à vérifier : ${matchingSkills.length} compétence(s) détectée(s) dans l'offre et le profil/CV. ${missingSkills.length > 0 ? `Compétences manquantes ou non vérifiées : ${missingSkills.join(', ')}.` : 'Aucune compétence détectée comme manquante.'} Ce score n'est pas une évaluation Gemini.`,
      requiredSkills,
      matchingSkills,
      missingSkills,
      minExperienceYears,
      customizedResumeContent: params.cvText,
      customizedHighlights: matchingSkills.length
        ? [`Compétences mentionnées dans le CV ou le profil : ${matchingSkills.slice(0, 3).join(', ')}`]
        : ['Ajoutez des réalisations vérifiables en lien avec les compétences exigées.'],
      draftCoverLetter: `Madame, Monsieur,\n\nJe souhaite vous présenter ma candidature pour le poste de ${params.jobTitle} chez ${params.company}.\n\n${matchingSkills.length ? `Mon profil mentionne des compétences en ${matchingSkills.slice(0, 3).join(', ')}.` : 'Je souhaite échanger avec vous afin de préciser l’adéquation de mon parcours avec ce poste.'}\n\nRestant à votre disposition pour tout échange,\n\n${params.userProfile.fullName}`,
      preparedAnswers: [],
      potentialBlockers,
      analysisMethod: 'local_fallback'
    };
  }
}

export const geminiService = new GeminiService();
