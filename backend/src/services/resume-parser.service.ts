import fs from 'fs/promises';
import { randomUUID } from 'crypto';
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

export class ResumeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeParseError';
  }
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

  async parseResumeBuffer(buffer: Buffer, originalFilename: string): Promise<ParsedResumeResult> {
    const extension = path.extname(originalFilename).toLowerCase();
    if (extension === '.pdf') return this.parsePdfBuffer(buffer, originalFilename);
    if (extension === '.txt') return this.parseTextBuffer(buffer, originalFilename);
    throw new ResumeParseError('Formats acceptés : PDF et texte brut (.txt).');
  }

  async parseTextBuffer(buffer: Buffer, originalFilename: string): Promise<ParsedResumeResult> {
    await this.init();
    if (buffer.includes(0)) {
      throw new ResumeParseError('Le fichier texte contient des données binaires invalides.');
    }

    let extractedText: string;
    try {
      extractedText = new TextDecoder('utf-8', { fatal: true })
        .decode(buffer)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .trim();
    } catch {
      throw new ResumeParseError('Le fichier texte doit être encodé en UTF-8.');
    }
    if (!extractedText) {
      throw new ResumeParseError('Le fichier texte est vide ou illisible.');
    }

    const filePath = await this.saveResumeFile(buffer, originalFilename);
    return this.buildResult(extractedText, originalFilename, filePath);
  }

  /**
   * Parse le buffer d'un fichier PDF et en extrait le texte et les métadonnées
   */
  async parsePdfBuffer(buffer: Buffer, originalFilename: string): Promise<ParsedResumeResult> {
    if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new ResumeParseError('Le fichier fourni ne semble pas être un PDF valide.');
    }

    await this.init();

    const filePath = await this.saveResumeFile(buffer, originalFilename);

    let parser: PDFParse | undefined;
    try {
      parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const extractedText = textResult.text.trim();
      if (!extractedText) {
        throw new ResumeParseError(
          'Aucun texte extractible dans ce PDF. Il est peut-être scanné et nécessite un traitement OCR.'
        );
      }

      return this.buildResult(extractedText, originalFilename, filePath);
    } catch (error) {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error(`Impossible de supprimer le PDF invalide ${filePath}:`, cleanupError);
      }

      if (error instanceof ResumeParseError) throw error;
      throw new ResumeParseError(
        `Impossible d'extraire le texte du PDF : ${error instanceof Error ? error.message : 'erreur inconnue'}`
      );
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch (error) {
          console.error('Impossible de fermer correctement le parseur PDF:', error);
        }
      }
    }
  }

  private async saveResumeFile(buffer: Buffer, originalFilename: string): Promise<string> {
    const safeFilename = `${randomUUID()}_${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(this.uploadsDir, safeFilename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  private buildResult(
    extractedText: string,
    originalFilename: string,
    filePath: string
  ): ParsedResumeResult {
    return {
      fileName: originalFilename,
      filePath,
      extractedText,
      detectedSkills: this.extractSkills(extractedText),
      detectedEmail: this.extractEmail(extractedText),
      detectedPhone: this.extractPhone(extractedText),
      wordCount: extractedText.split(/\s+/).filter(Boolean).length
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
