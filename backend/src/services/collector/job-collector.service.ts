import { prisma } from '../../db/prisma.js';
import { SearchPreferencesSchema } from '../../types/index.js';
import { feedCollector } from './feed-collector.service.js';
import { geminiService } from '../gemini.service.js';
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

  const locations = preferences.locations.map(normalizeText).filter(Boolean);
  if (locations.length === 0) return false;

  const offerLocation = normalizeText(offer.location);
  const locationAgnostic = ['remote', 'worldwide', 'global', 'anywhere', 'international', 'europe'];
  if (locationAgnostic.some((term) => offerLocation.includes(term))) return false;

  return !locations.some(
    (location) => offerLocation.includes(location) || location.includes(offerLocation)
  );
}

export class JobCollectorService {
  async runCollection(): Promise<CollectionResult> {
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
    const primaryResume = user.resumes.find((resume) => resume.isPrimary) || user.resumes[0];
    const cvText = primaryResume?.extractedText || '';

    const collection = await feedCollector.collectFromTechFeeds(
      preferences.targetTitles,
      targetKeywords
    );
    const existingJobs = await prisma.jobOffer.findMany({
      select: { title: true, company: true, url: true }
    });
    const knownUrls = new Set(existingJobs.map((job) => normalizeUrl(job.url)));
    const knownFingerprints = new Set(
      existingJobs.map((job) => `${normalizeText(job.title)}|${normalizeText(job.company)}`)
    );

    let duplicatesSkipped = 0;
    let newOffersSaved = 0;
    let filteredOut = 0;
    let highlyRelevantMatches = 0;

    for (const offer of collection.offers) {
      if (isExcludedByPreferences(offer, preferences)) {
        filteredOut++;
        continue;
      }

      const normalizedUrl = normalizeUrl(offer.url);
      const fingerprint = `${normalizeText(offer.title)}|${normalizeText(offer.company)}`;
      if (knownUrls.has(normalizedUrl) || knownFingerprints.has(fingerprint)) {
        duplicatesSkipped++;
        continue;
      }

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
        cvText
      });

      const isRelevant = analysis.matchScore >= 60;
      const blockers = [...analysis.potentialBlockers];
      if (!primaryResume && !blockers.some((blocker) => blocker.type === 'missing_document')) {
        blockers.push({
          type: 'missing_document',
          question: 'Ajoutez ou sélectionnez un CV avant de soumettre cette candidature.'
        });
      }

      const isReadyForReview = blockers.length > 0;
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
          status: isRelevant ? 'analyzed' : 'rejected',
          analysis: {
            create: {
              matchScore: analysis.matchScore,
              summary: analysis.summary,
              requiredSkills: JSON.stringify(analysis.requiredSkills),
              matchingSkills: JSON.stringify(analysis.matchingSkills),
              missingSkills: JSON.stringify(analysis.missingSkills),
              minExperienceYears: analysis.minExperienceYears
            }
          },
          ...(isRelevant
            ? {
                application: {
                  create: {
                    status: isReadyForReview ? 'ready_for_review' : 'ready_to_submit',
                    matchScore: analysis.matchScore,
                    readinessScore: isReadyForReview ? 80 : 100,
                    ...(primaryResume ? { selectedResumeId: primaryResume.id } : {}),
                    coverLetter: analysis.draftCoverLetter,
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
      knownFingerprints.add(fingerprint);
      newOffersSaved++;
      if (isRelevant) highlyRelevantMatches++;
    }

    return {
      totalDiscovered: collection.offers.length,
      newOffersSaved,
      duplicatesSkipped,
      filteredOut,
      highlyRelevantMatches,
      sources: collection.sources,
      failedSources: collection.failedSources
    };
  }
}

export const jobCollector = new JobCollectorService();
