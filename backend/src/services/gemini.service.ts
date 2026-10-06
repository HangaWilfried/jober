import { GoogleGenAI, Type } from '@google/genai';

export interface JobAnalysisResult {
  matchScore: number;
  summary: string;
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  minExperienceYears: number;
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
      searchPreferences: any;
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
6. Rédige une lettre de motivation ("draftCoverLetter") personnalisée et percutante (en français), évitant le jargon creux.
7. Identifie d'éventuels bloqueurs subjectifs ("potentialBlockers") requérant une réponse humaine (ex: "Pourquoi rejoindre notre entreprise ?").
8. Prépare les réponses ("preparedAnswers") aux questions courantes (années d'expérience, disponibilité, etc.).
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

      const parsed: JobAnalysisResult = JSON.parse(response.text);
      return parsed;
    } catch (err: any) {
      console.error('Erreur lors de l appel Gemini API:', err);
      // En cas de problème d'API, on bascule sur l'analyse locale
      return this.fallbackLocalAnalysis(params);
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
    const userSkills = params.userProfile.skills;

    const matchingSkills = userSkills.filter(s => desc.includes(s.toLowerCase()));
    const commonTechs = ['Vue', 'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Docker', 'PostgreSQL', 'Tailwind CSS', 'AWS', 'GraphQL'];
    const requiredSkills = commonTechs.filter(t => desc.includes(t.toLowerCase()));
    
    if (requiredSkills.length === 0) {
      requiredSkills.push('Développement', 'Travail en équipe', 'Git');
    }

    const missingSkills = requiredSkills.filter(r => !matchingSkills.some(m => m.toLowerCase() === r.toLowerCase()));

    const baseScore = requiredSkills.length > 0
      ? Math.round((matchingSkills.length / Math.max(requiredSkills.length, 1)) * 100)
      : 75;

    const matchScore = Math.min(Math.max(baseScore, 30), 98);

    return {
      matchScore,
      summary: `Analyse locale : ${matchingSkills.length} compétences concordantes identifiées (${matchingSkills.slice(0, 3).join(', ')}). ${missingSkills.length > 0 ? `Points d attention : ${missingSkills.join(', ')}.` : 'Bonne adéquation technique.'} (Pour une analyse IA avancée, ajoutez votre clé GEMINI_API_KEY dans backend/.env)`,
      requiredSkills,
      matchingSkills,
      missingSkills,
      minExperienceYears: 3,
      customizedHighlights: [
        `Maîtrise démontrée des technologies clés : ${matchingSkills.slice(0, 2).join(', ') || 'Développement fullstack'}`,
        `Profil orienté productivité et architectures maintenables`
      ],
      draftCoverLetter: `Madame, Monsieur,\n\nC'est avec grand intérêt que je vous soumets ma candidature pour le poste de ${params.jobTitle} chez ${params.company}.\n\nMon expérience sur ${matchingSkills.slice(0, 3).join(', ') || 'les technologies modernes'} me permet d'être rapidement opérationnel et de contribuer efficacement à vos projets.\n\nRestant à votre disposition pour tout échange,\n\n${params.userProfile.fullName}`,
      preparedAnswers: [
        {
          question: 'Disponibilité / Préavis',
          suggestedAnswer: '1 mois (négociable)',
          confidence: 0.9
        }
      ],
      potentialBlockers: [
        {
          type: 'subjective_question',
          question: `Pourquoi souhaitez-vous rejoindre l'équipe de ${params.company} ?`
        }
      ]
    };
  }
}

export const geminiService = new GeminiService();
