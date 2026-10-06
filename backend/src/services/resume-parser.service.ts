import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';

export interface ParsedResumeResult {
  fileName: string;
  filePath: string;
  extractedText: string;
  detectedSkills: string[];
  detectedEmail?: string;
  detectedPhone?: string;
  wordCount: number;
}

// Dictionnaire de compétences courantes pour l'extraction locale sans IA
const TECH_SKILLS_DICTIONARY = [
  'JavaScript', 'TypeScript', 'Vue.js', 'Vue 3', 'Vue', 'React', 'React.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
  'Node.js', 'Node', 'Express', 'Fastify', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
  'Java', 'Spring', 'Spring Boot', 'PHP', 'Laravel', 'Symfony', 'C#', '.NET', 'Go', 'Golang', 'Rust',
  'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Prisma', 'Drizzle',
  'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'AWS', 'GCP', 'Azure',
  'Tailwind CSS', 'Tailwind', 'Bootstrap', 'Sass', 'CSS3', 'HTML5',
  'REST', 'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'Playwright', 'Puppeteer', 'Jest', 'Vitest', 'Cypress'
];

export class ResumeParserService {
  private uploadsDir = path.resolve(process.cwd(), 'uploads', 'resumes');

  async init() {
    await fs.mkdir(this.uploadsDir, { recursive: true });
  }

  /**
   * Parse le buffer d'un fichier PDF et en extrait le texte et les métadonnées
   */
  async parsePdfBuffer(buffer: Buffer, originalFilename: string): Promise<ParsedResumeResult> {
    await this.init();

    // 1. Sauvegarde du fichier localement
    const safeFilename = `${Date.now()}_${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(this.uploadsDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    // 2. Extraction du texte via PDFParse
    let extractedText = '';
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      extractedText = textResult.text.trim();
      await parser.destroy();
    } catch (err: any) {
      console.error('Erreur extraction PDF:', err);
      extractedText = `Erreur lors de l extraction du texte PDF : ${err.message}`;
    }

    // 3. Détection des compétences par mots-clés
    const detectedSkills = this.extractSkills(extractedText);

    // 4. Détection heuristique d'email et téléphone
    const detectedEmail = this.extractEmail(extractedText);
    const detectedPhone = this.extractPhone(extractedText);

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    return {
      fileName: originalFilename,
      filePath,
      extractedText,
      detectedSkills,
      detectedEmail,
      detectedPhone,
      wordCount
    };
  }

  private extractSkills(text: string): string[] {
    const found = new Set<string>();
    const lowerText = text.toLowerCase();

    for (const skill of TECH_SKILLS_DICTIONARY) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text) || lowerText.includes(skill.toLowerCase())) {
        found.add(skill);
      }
    }

    return Array.from(found);
  }

  private extractEmail(text: string): string | undefined {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : undefined;
  }

  private extractPhone(text: string): string | undefined {
    // Regex pour numéros de téléphone FR / internationaux
    const match = text.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/);
    return match ? match[0] : undefined;
  }
}

export const resumeParser = new ResumeParserService();
