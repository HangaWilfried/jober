import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../db/prisma.js';
import { PreparedAnswerSchema } from '../types/index.js';
import {
  getAutomationBlocker,
  getConfirmedAnswer,
  isSensitiveOrLegalField,
  isSupportedApplicationUrl,
  normalizeQuestion
} from './application-automation-policy.service.js';

export type FormAutomationResult =
  | { status: 'submitted'; message: string }
  | { status: 'manual_required'; message: string; url: string };

function manual(message: string, url: string): FormAutomationResult {
  return { status: 'manual_required', message, url };
}

function identityValue(
  fieldDescription: string,
  profile: { fullName: string; email: string; phone: string; location: string }
): string | undefined {
  const field = normalizeQuestion(fieldDescription);
  const nameParts = profile.fullName.trim().split(/\s+/).filter(Boolean);
  if (/\b(first name|given name|firstname|first_name)\b/.test(field)) return nameParts[0];
  if (/\b(last name|family name|surname|lastname|last_name)\b/.test(field)) {
    return nameParts.slice(1).join(' ');
  }
  if (/\b(full name|your name|candidate name|name)\b/.test(field)) return profile.fullName;
  if (/\b(email|e mail)\b/.test(field)) return profile.email;
  if (/\b(phone|telephone|mobile number)\b/.test(field)) return profile.phone;
  if (/\b(location|city|address)\b/.test(field)) return profile.location;
  return undefined;
}

async function isCaptchaVisible(page: import('playwright').Page): Promise<boolean> {
    const selectors = [
      'iframe[src*="captcha" i]',
      '[class*="captcha" i]',
      '[id*="captcha" i]',
      '.g-recaptcha',
      '[data-sitekey]'
    ];
    for (const selector of selectors) {
      const elements = page.locator(selector);
      for (let index = 0; index < await elements.count(); index++) {
        if (await elements.nth(index).isVisible().catch(() => false)) return true;
      }
    }
    return false;
}

export class ApplicationFormAutomatorService {
  private readonly activeSubmissions = new Map<string, Promise<FormAutomationResult>>();

  async submit(applicationId: string): Promise<FormAutomationResult> {
    const active = this.activeSubmissions.get(applicationId);
    if (active) return active;

    const attempt = this.submitOnce(applicationId).finally(() => {
      this.activeSubmissions.delete(applicationId);
    });
    this.activeSubmissions.set(applicationId, attempt);
    return attempt;
  }

  private async submitOnce(applicationId: string): Promise<FormAutomationResult> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, blockers: true }
    });
    if (!application) throw new Error('Candidature introuvable.');

    const url = application.job.url;
    if (!isSupportedApplicationUrl(url)) {
      return manual(
        'Ce site ne fait pas partie des intégrations Greenhouse/Lever prises en charge.',
        url
      );
    }

    const user = await prisma.userProfile.findFirst({ include: { resumes: true } });
    if (!user) throw new Error('Profil utilisateur introuvable.');

    const answersParse = PreparedAnswerSchema.array().safeParse(
      JSON.parse(application.preparedAnswers || '[]')
    );
    if (!answersParse.success) {
      return manual('Les réponses préparées sont invalides et doivent être vérifiées.', url);
    }
    const answers = answersParse.data;
    const unresolvedBlockerCount = application.blockers.filter((blocker) => !blocker.resolved).length;
    const unconfirmedAnswerCount = answers.filter((answer) => !answer.isConfirmed).length;
    const resume = application.selectedResumeId
      ? user.resumes.find((item) => item.id === application.selectedResumeId)
      : undefined;
    const selectedResumeRecord = application.selectedResumeId
      ? await prisma.resume.findUnique({ where: { id: application.selectedResumeId } })
      : null;
    let resumeExists = false;
    if (selectedResumeRecord?.filePath) {
      try {
        await fs.access(selectedResumeRecord.filePath);
        resumeExists = true;
      } catch {
        resumeExists = false;
      }
    }

    const blocker = getAutomationBlocker({
      matchScore: application.matchScore,
      readinessScore: application.readinessScore,
      unresolvedBlockerCount,
      unconfirmedAnswerCount,
      hasResumeFile: resumeExists,
      hasCustomizedResume: Boolean(
        application.customizedResumeContent.trim() && application.customizedResumeConfirmed
      ),
      hasCoverLetter: Boolean(application.coverLetter.trim() && application.coverLetterConfirmed),
      alreadySubmitted: application.status.startsWith('submitted_')
    });
    if (blocker) return manual(blocker, url);

    const browser = await chromium.launch({ headless: true });
    let customizedResumePath: string | undefined;
    try {
      const uploadDirectory = path.resolve(process.cwd(), 'uploads', 'applications');
      await fs.mkdir(uploadDirectory, { recursive: true });
      customizedResumePath = path.join(uploadDirectory, `${application.id}-resume.pdf`);

      const pdfPage = await browser.newPage();
      const safeResumeContent = application.customizedResumeContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      await pdfPage.setContent(
        `<html><head><meta charset="utf-8"><style>
          body { font-family: Arial, sans-serif; color: #111; font-size: 11pt; }
          pre { white-space: pre-wrap; overflow-wrap: anywhere; font-family: inherit; }
        </style></head><body><pre>${safeResumeContent}</pre></body></html>`,
        { waitUntil: 'load' }
      );
      await pdfPage.pdf({
        path: customizedResumePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' }
      });
      await pdfPage.close();

      await prisma.application.update({
        where: { id: application.id },
        data: { customizedResumePath }
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!isSupportedApplicationUrl(page.url())) {
        return manual('Le site a redirigé vers un domaine non pris en charge.', page.url());
      }
      if (await page.locator('input[type="password"]:visible').count()) {
        return manual('Une authentification manuelle est requise sur ce site.', page.url());
      }
      if (await isCaptchaVisible(page)) {
        return manual('Un CAPTCHA est présent. Il ne sera pas contourné.', page.url());
      }

      const form = page.locator('form').filter({
        has: page.locator('input[type="file"]')
      }).first();
      if (await form.count() === 0) {
        return manual('Aucun formulaire de candidature standard n’a été détecté.', page.url());
      }

      const fields = form.locator('input, textarea, select');
      for (let index = 0; index < await fields.count(); index++) {
        const field = fields.nth(index);
        if (await field.isDisabled()) continue;
        const tagName = await field.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'button') continue;

        const type = (await field.getAttribute('type') || '').toLowerCase();
        if (['hidden', 'submit', 'button', 'reset'].includes(type)) continue;
        if (type !== 'file' && !await field.isVisible()) continue;
        const name = await field.getAttribute('name') || '';
        const id = await field.getAttribute('id') || '';
        const placeholder = await field.getAttribute('placeholder') || '';
        const ariaLabel = await field.getAttribute('aria-label') || '';
        const label = id
          ? await page.locator(`label[for=${JSON.stringify(id)}]`).first().textContent().catch(() => '')
          : '';
        const description = [label, ariaLabel, placeholder, name, id].filter(Boolean).join(' ');
        const required = await field.getAttribute('required') !== null ||
          (await field.getAttribute('aria-required')) === 'true';

        if (type === 'password') {
          return manual('Une authentification manuelle est requise sur ce site.', page.url());
        }
        if (isSensitiveOrLegalField(description)) {
          if (required) {
            return manual('Le formulaire demande une déclaration légale ou une information sensible.', page.url());
          }
          continue;
        }
        if (['checkbox', 'radio'].includes(type)) {
          if (required) {
            return manual('Le formulaire requiert une confirmation ou un choix qui doit rester manuel.', page.url());
          }
          continue;
        }
        if (type === 'file') {
          if (!/\b(resume|cv|curriculum)\b/i.test(description)) {
            if (required) return manual('Un document requis non reconnu est demandé.', page.url());
            continue;
          }
          const accept = await field.getAttribute('accept');
          if (accept && !/(pdf|\.pdf|\*)/i.test(accept)) {
            return manual('Le site n’accepte pas le format PDF du CV adapté.', page.url());
          }
          await field.setInputFiles(customizedResumePath);
          continue;
        }

        const value = identityValue(description, {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          location: user.location
        });
        const confirmedAnswer = value === undefined
          ? getConfirmedAnswer(description, answers)
          : undefined;
        const fieldValue = value ?? confirmedAnswer;
        const isCoverLetter = /\b(cover letter|motivation letter|lettre de motivation)\b/i.test(description);

        if (isCoverLetter && fieldValue === undefined) {
          await field.fill(application.coverLetter);
          continue;
        }
        if (fieldValue !== undefined) {
          if (await field.evaluate((element) => element.tagName.toLowerCase() === 'select')) {
            try {
              await field.selectOption({ label: fieldValue });
            } catch {
              if (required) return manual(`Aucune option sûre ne correspond au champ « ${description} ».`, page.url());
            }
          } else {
            await field.fill(fieldValue);
          }
          continue;
        }
        if (required) {
          return manual(`Le champ obligatoire « ${description || 'non identifié'} » nécessite votre intervention.`, page.url());
        }
      }

      if (await isCaptchaVisible(page)) {
        return manual('Un CAPTCHA est présent. Il ne sera pas contourné.', page.url());
      }
      if (await form.locator(':invalid').count()) {
        return manual('Le formulaire contient des champs obligatoires non remplis ou invalides.', page.url());
      }

      const submitButton = form.locator(
        'button[type="submit"], input[type="submit"]'
      ).filter({ visible: true }).first();
      if (await submitButton.count() === 0) {
        return manual('Le bouton d’envoi du formulaire est introuvable.', page.url());
      }
      await submitButton.click();
      try {
        await page.getByText(
          /thank you for applying|application (was )?submitted|application received|merci pour votre candidature|candidature a bien été envoyée/i
        ).waitFor({ timeout: 10_000 });
      } catch {
        if (await isCaptchaVisible(page)) {
          return manual('Le site demande une action CAPTCHA après validation.', page.url());
        }
        return manual('Aucune confirmation explicite de réception n’a été détectée.', page.url());
      }

      await prisma.application.update({
        where: { id: application.id },
        data: {
          status: 'submitted_auto',
          submittedAt: new Date()
        }
      });
      return { status: 'submitted', message: 'Le site a confirmé la réception de la candidature.' };
    } finally {
      await browser.close();
    }
  }
}

export const applicationFormAutomator = new ApplicationFormAutomatorService();
