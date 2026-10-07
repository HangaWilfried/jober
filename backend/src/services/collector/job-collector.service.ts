import { prisma } from '../../db/prisma.js';
import { SearchPreferencesSchema } from '../../types/index.js';
import { feedCollector } from './feed-collector.service.js';
import { geminiService } from '../gemini.service.js';
import { calculateReadinessScore } from '../application-readiness.service.js';
import { selectMostRelevantResume } from '../resume-selection.service.js';
import type { CollectionResult, RawJobItem } from './collector.types.js';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|campaign$)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.hostname = url.hostname.toLocaleLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim().toLocaleLowerCase();
  }
}

function isExcludedByPreferences(
  offer: RawJobItem,
  preferences: {
    remote: 'any' | 'hybrid' | 'full' | 'none';
    locations: string[];
    minSalary?: number;
    excludedCompanies?: string[];
  }
): boolean {
  if (
    (preferences.remote === 'full' && offer.remoteType !== 'full') ||
    (preferences.remote === 'hybrid' && !['full', 'hybrid'].includes(offer.remoteType)) ||
    (preferences.remote === 'none' && offer.remoteType !== 'on-site')
  ) {
    return true;
  }

  const excludedCompanies = (preferences.excludedCompanies || []).map(normalizeText);
  if (excludedCompanies.includes(normalizeText(offer.company))) return true;
  if (preferences.minSalary && offer.salaryCurrency?.toUpperCase() === 'EUR' &&
    offer.salaryMin !== undefined &&
    offer.salaryMin < preferences.minSalary) return true;

  const locations = preferences.locations.map(normalizeText).filter(Boolean);
  if (locations.length === 0) return false;

  const offerLocation = normalizeText(offer.location);
  if (!offerLocation) return true;
  const locationAgnostic = ['remote', 'worldwide', 'global', 'anywhere', 'international', 'europe'];
  if (locationAgnostic.some((term) => offerLocation.includes(term))) return false;

  return !locations.some(
    (location) => offerLocation.includes(location) || location.includes(offerLocation)
  );
}

export class JobCollectorService {
  private activeCollection: Promise<CollectionResult> | null = null;

  async runCollection(): Promise<CollectionResult> {
    if (this.activeCollection) return this.activeCollection;

    this.activeCollection = this.collectOffers().finally(() => {
      this.activeCollection = null;
    });
    return this.activeCollection;
  }

  private async collectOffers(): Promise<CollectionResult> {
    const user = await prisma.userProfile.findFirst({
      include: { resumes: true }
    });

    if (!user) {
      throw new Error('Aucun profil utilisateur trouvé en base.');
    }

    const preferences = SearchPreferencesSchema.parse(
      JSON.parse(user.searchPreferences || '{}')
    );
    const parsedSkills: unknown = JSON.parse(user.skills || '[]');
    if (!Array.isArray(parsedSkills) || !parsedSkills.every((skill) => typeof skill === 'string')) {
      throw new Error('Les compétences du profil utilisateur sont invalides.');
    }
    const userSkills = parsedSkills;
    const targetKeywords = preferences.targetTitles.length > 0
      ? preferences.targetTitles
      : userSkills;
    const collection = await feedCollector.collectFromTechFeeds(
      preferences.targetTitles,
      targetKeywords
    );
    const existingJobs = await prisma.jobOffer.findMany({
      select: { id: true, title: true, company: true, url: true, status: true }
    });
    const knownUrls = new Set(existingJobs.map((job) => normalizeUrl(job.url)));
    const existingByUrl = new Map(existingJobs.map((job) => [normalizeUrl(job.url), job]));
    const knownFingerprints = new Set(
      existingJobs.map((job) => `${normalizeText(job.title)}|${normalizeText(job.company)}`)
    );

    let duplicatesSkipped = 0;
    let newOffersSaved = 0;
    let expiredOffers = 0;
    let incompleteOffers = 0;
    let filteredOut = 0;
    let highlyRelevantMatches = 0;

    for (const offer of collection.offers) {
      const normalizedUrl = normalizeUrl(offer.url);
      const existingJob = existingByUrl.get(normalizedUrl);
      if (offer.expiresAt && offer.expiresAt.getTime() < Date.now()) {
        if (existingJob && existingJob.status !== 'expired') {
          await prisma.jobOffer.update({
            where: { id: existingJob.id },
            data: { status: 'expired', expiresAt: offer.expiresAt }
          });
        }
        expiredOffers++;
        continue;
      }

      if (!offer.title.trim() || !offer.company.trim() || offer.description.trim().length < 100) {
        incompleteOffers++;
        continue;
      }

      if (isExcludedByPreferences(offer, preferences)) {
        filteredOut++;
        continue;
      }

      const fingerprint = `${normalizeText(offer.title)}|${normalizeText(offer.company)}`;
      if (knownUrls.has(normalizedUrl) || knownFingerprints.has(fingerprint)) {
        duplicatesSkipped++;
        continue;
      }

      const selectedResume = selectMostRelevantResume(
        user.resumes,
        offer.description,
        userSkills
      );
      const analysis = await geminiService.analyzeJob({
        jobTitle: offer.title,
        company: offer.company,
        jobDescription: offer.description,
        userProfile: {
          fullName: user.fullName,
          headline: user.headline,
          skills: userSkills,
          location: user.location,
          searchPreferences: preferences
        },
        cvText: selectedResume?.extractedText || ''
      });

      const isRelevant = analysis.matchScore >= 60;
      const blockers = [...analysis.potentialBlockers];
      if (preferences.minSalary &&
        (offer.salaryMin === undefined || offer.salaryCurrency?.toUpperCase() !== 'EUR') &&
        !blockers.some((blocker) => blocker.type === 'salary_expectation')) {
        blockers.push({
          type: 'salary_expectation',
          question: `Le salaire de cette offre n'est pas confirmé. Vérifiez qu'il atteint votre minimum de ${preferences.minSalary} par an.`
        });
      }
      if (!blockers.some((blocker) => blocker.type === 'other' && /\bcv\b/i.test(blocker.question))) {
        blockers.push({
          type: 'other',
          question: 'Vérifiez que le CV adapté ne contient que des informations exactes avant de l’envoyer.'
        });
      }
      if (!selectedResume?.extractedText?.trim() &&
        !blockers.some((blocker) => blocker.type === 'missing_document')) {
        blockers.push({
          type: 'missing_document',
          question: 'Ajoutez ou sélectionnez un CV avant de soumettre cette candidature.'
        });
      }

      const readinessScore = calculateReadinessScore({
        hasResume: Boolean(selectedResume?.extractedText?.trim()),
        customizedResumeConfirmed: false,
        coverLetterConfirmed: false,
        unresolvedBlockerCount: blockers.length + analysis.preparedAnswers.length
      });
      const job = await prisma.jobOffer.create({
        data: {
          title: offer.title,
          company: offer.company,
          location: offer.location,
          remoteType: offer.remoteType,
          url: offer.url,
          source: offer.source,
          description: offer.description,
          ...(offer.publishedAt ? { publishedAt: offer.publishedAt } : {}),
          ...(offer.expiresAt ? { expiresAt: offer.expiresAt } : {}),
          status: isRelevant ? 'analyzed' : 'rejected',
          analysis: {
            create: {
              matchScore: analysis.matchScore,
              summary: analysis.summary,
              requiredSkills: JSON.stringify(analysis.requiredSkills),
              matchingSkills: JSON.stringify(analysis.matchingSkills),
              missingSkills: JSON.stringify(analysis.missingSkills),
              minExperienceYears: analysis.minExperienceYears,
              analysisMethod: analysis.analysisMethod
            }
          },
          ...(isRelevant
            ? {
                application: {
                  create: {
                    status: readinessScore === 100 ? 'ready_to_submit' : 'ready_for_review',
                    matchScore: analysis.matchScore,
                    readinessScore,
                    ...(selectedResume ? { selectedResumeId: selectedResume.id } : {}),
                    coverLetter: analysis.draftCoverLetter,
                    coverLetterConfirmed: false,
                    customizedResumeContent: analysis.customizedResumeContent,
                    customizedResumeConfirmed: false,
                    customizedHighlights: JSON.stringify(analysis.customizedHighlights),
                    preparedAnswers: JSON.stringify(
                      analysis.preparedAnswers.map((answer) => ({
                        ...answer,
                        isConfirmed: false
                      }))
                    ),
                    blockers: {
                      create: blockers.map((blocker) => ({
                        type: blocker.type,
                        question: blocker.question,
                        resolved: false,
                        userResponse: null
                      }))
                    }
                  }
                }
              }
            : {})
        }
      });

      knownUrls.add(normalizedUrl);
      existingByUrl.set(normalizedUrl, {
        id: job.id,
        title: offer.title,
        company: offer.company,
        url: offer.url,
        status: isRelevant ? 'analyzed' : 'rejected'
      });
      knownFingerprints.add(fingerprint);
      newOffersSaved++;
      if (isRelevant) highlyRelevantMatches++;
    }

    return {
      totalDiscovered: collection.offers.length,
      newOffersSaved,
      duplicatesSkipped,
      expiredOffers,
      incompleteOffers,
      filteredOut,
      highlyRelevantMatches,
      sources: collection.sources,
      failedSources: collection.failedSources
    };
  }
}

export const jobCollector = new JobCollectorService();
