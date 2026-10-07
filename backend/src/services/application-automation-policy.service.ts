export interface AutomationPreconditions {
  matchScore: number;
  readinessScore: number;
  unresolvedBlockerCount: number;
  unconfirmedAnswerCount: number;
  hasResumeFile: boolean;
  hasCustomizedResume: boolean;
  hasCoverLetter: boolean;
  alreadySubmitted: boolean;
}

export function isSupportedApplicationUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return [
      'boards.greenhouse.io',
      'job-boards.greenhouse.io',
      'jobs.lever.co',
      'jobs.eu.lever.co'
    ].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function getAutomationBlocker(inputs: AutomationPreconditions): string | null {
  if (inputs.alreadySubmitted) return 'Cette candidature est déjà marquée comme envoyée.';
  if (inputs.matchScore < 90) return 'Le Match Score est inférieur à 90 %.';
  if (inputs.readinessScore !== 100) return 'La candidature n’atteint pas 100 % de readiness.';
  if (inputs.unresolvedBlockerCount > 0) return 'Des points de décision humaine ne sont pas résolus.';
  if (inputs.unconfirmedAnswerCount > 0) return 'Des réponses préremplies ne sont pas confirmées.';
  if (!inputs.hasResumeFile) return 'Le fichier du CV sélectionné est introuvable.';
  if (!inputs.hasCustomizedResume) return 'Le CV adapté est vide.';
  if (!inputs.hasCoverLetter) return 'La lettre de motivation est vide.';
  return null;
}

export function isSensitiveOrLegalField(label: string): boolean {
  return /\b(race|ethnicity|gender|sex|disability|veteran|religion|date of birth|social security|visa|work authorization|right to work|equal opportunity|diversity|consent|privacy|terms|certify|attest)\b/i
    .test(label);
}

export function normalizeQuestion(value: string): string {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getConfirmedAnswer(
  label: string,
  answers: Array<{ question: string; suggestedAnswer: string; isConfirmed: boolean }>
): string | undefined {
  const normalizedLabel = normalizeQuestion(label);
  if (!normalizedLabel) return undefined;
  const answer = answers.find(({ question, isConfirmed }) => {
    if (!isConfirmed) return false;
    const normalizedQuestion = normalizeQuestion(question);
    return normalizedQuestion === normalizedLabel;
  });
  return answer?.suggestedAnswer.trim() || undefined;
}
