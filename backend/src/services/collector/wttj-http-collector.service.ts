import * as cheerio from 'cheerio';
import type { RawJobItem } from './collector.types.js';

interface JobPosting {
  '@type'?: string | string[];
  title?: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
  jobLocation?: unknown;
  jobLocationType?: string;
  applicantLocationRequirements?: unknown;
  hiringOrganization?: { name?: string };
  baseSalary?: {
    currency?: string;
    value?: {
      minValue?: number;
      maxValue?: number;
      unitText?: string;
    };
  };
}

interface ListingCard {
  title: string;
  url: string;
  text: string;
  company?: string;
  location?: string;
}

const WTTJ_ORIGIN = 'https://www.welcometothejungle.com';
const CATEGORY_LIMIT = 3;
const JOB_LIMIT_PER_CATEGORY = 5;

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function categorySlug(title: string): string {
  const normalized = normalizeText(title);
  if (/\b(front end|frontend)\b/.test(normalized)) return 'developpeur-front-end';
  if (/\b(back end|backend)\b/.test(normalized)) return 'developpeur-back-end';
  if (/\bmobile\b/.test(normalized)) return 'developpeur-mobile';
  if (/\b(developpeur|developer|engineer|ingenieur|full ?stack|tech lead)\b/.test(normalized)) {
    return 'developpeur';
  }
  return normalized.replace(/\s+/g, '-');
}

function flattenJobPostings(value: unknown): JobPosting[] {
  if (Array.isArray(value)) return value.flatMap(flattenJobPostings);
  if (typeof value !== 'object' || value === null) return [];

  const record = value as Record<string, unknown>;
  if (Array.isArray(record['@graph'])) return flattenJobPostings(record['@graph']);

  const types = Array.isArray(record['@type']) ? record['@type'] : [record['@type']];
  const ownPosting = types.some((type) =>
    typeof type === 'string' && type.toLocaleLowerCase().endsWith('jobposting')
  ) ? [record as JobPosting] : [];
  return [...ownPosting, ...Object.values(record).flatMap((item) =>
    Array.isArray(item) || (typeof item === 'object' && item !== null)
      ? flattenJobPostings(item)
      : []
  )];
}

function parseJsonLd($: cheerio.CheerioAPI): JobPosting[] {
  const postings: JobPosting[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).html();
    if (!raw) return;
    try {
      postings.push(...flattenJobPostings(JSON.parse(raw)));
    } catch {
      return;
    }
  });
  return postings;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function collectLocation(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectLocation);
  if (typeof value !== 'object' || value === null) return [];

  const record = value as Record<string, unknown>;
  const address = record.address;
  const fields = typeof address === 'object' && address !== null
    ? address as Record<string, unknown>
    : {};
  return ['addressLocality', 'addressRegion', 'addressCountry']
    .map((field) => fields[field])
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const normalizedText = normalizeText(text);
  return keywords.some((keyword) => {
    const tokens = normalizeText(keyword).split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => normalizedText.includes(token));
  });
}

function readCards($: cheerio.CheerioAPI): ListingCard[] {
  const cards: ListingCard[] = [];
  $('[data-testid^="job-thumb-"]').each((_, element) => {
    const card = $(element);
    const jobLink = card.find('a[href*="/companies/"][href*="/jobs/"]').first();
    const href = jobLink.attr('href');
    if (!href) return;

    let jobUrl: URL;
    try {
      jobUrl = new URL(href, WTTJ_ORIGIN);
    } catch {
      return;
    }
    if (jobUrl.origin !== WTTJ_ORIGIN) return;

    const companyLink = card.find('a[href*="/companies/"]').filter((_, link) =>
      !($(link).attr('href') || '').includes('/jobs/')
    ).first();
    const text = card.text().replace(/\s+/g, ' ').trim();
    const location = card.find('[data-testid*="location"]').first().text().trim();
    cards.push({
      title: jobLink.text().trim(),
      url: jobUrl.toString(),
      text,
      company: companyLink.text().trim() || undefined,
      location: location || undefined
    });
  });
  return cards.filter((card) => card.title.length > 0);
}

function descriptionFromPage($: cheerio.CheerioAPI): string {
  const selectors = [
    '[data-testid*="job-description"]',
    '[data-testid*="description"]',
    'main article',
    'main'
  ];
  for (const selector of selectors) {
    const candidate = $(selector).first().clone();
    candidate.find('script, style, noscript, nav, header, footer').remove();
    const text = candidate.text().replace(/\s+/g, ' ').trim();
    if (text.length >= 100) return text;
  }
  return '';
}

function inferRemoteType(posting: JobPosting, text: string): RawJobItem['remoteType'] {
  const normalized = normalizeText(text);
  if (
    posting.jobLocationType?.toLocaleUpperCase() === 'TELECOMMUTE' ||
    /\b(100 ?% teletravail|teletravail complet|full remote|entierement a distance)\b/.test(normalized)
  ) return 'full';
  if (/\b(teletravail frequent|teletravail occasionnel|mode hybride|hybride)\b/.test(normalized)) {
    return 'hybrid';
  }
  if (/\b(sans teletravail|aucun teletravail|presentiel uniquement)\b/.test(normalized)) {
    return 'on-site';
  }
  return 'unknown';
}

export class WttjHttpCollectorService {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async collect(targetTitles: string[], keywords: string[]): Promise<RawJobItem[]> {
    const categories = [...new Set((targetTitles.length ? targetTitles : keywords).map(categorySlug))]
      .filter(Boolean)
      .slice(0, CATEGORY_LIMIT);
    const offers: RawJobItem[] = [];
    const errors: string[] = [];

    for (const category of categories) {
      try {
        offers.push(...await this.collectCategory(category, keywords));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        console.warn(`Collecte WTTJ indisponible pour ${category}: ${message}`);
        errors.push(`${category}: ${message}`);
      }
    }

    if (categories.length > 0 && errors.length === categories.length) {
      throw new Error(errors.join(' | '));
    }
    return offers;
  }

  private async collectCategory(category: string, keywords: string[]): Promise<RawJobItem[]> {
    const listingUrl = new URL(
      `/fr/pages/emploi-${encodeURIComponent(category)}`,
      WTTJ_ORIGIN
    );
    const listingHtml = await this.fetchPage(listingUrl);
    const $ = cheerio.load(listingHtml);
    const cards = readCards($).slice(0, JOB_LIMIT_PER_CATEGORY);
    if (cards.length === 0 && $('[data-testid^="job-thumb-"]').length === 0) {
      throw new Error('Format inattendu de la page de résultats WTTJ.');
    }
    const offers: RawJobItem[] = [];

    for (const card of cards) {
      try {
        const response = await this.fetchPage(new URL(card.url));
        const page = cheerio.load(response);
        const posting = parseJsonLd(page).find((item) => item.title || item.description) || {};
        const description = posting.description
          ? htmlToText(posting.description)
          : descriptionFromPage(page);
        const title = posting.title?.trim() || card.title;
        const company = posting.hiringOrganization?.name?.trim() || card.company;
        const location = [
          ...collectLocation(posting.jobLocation),
          ...collectLocation(posting.applicantLocationRequirements)
        ];
        const finalLocation = [...new Set(location)].join(', ') || card.location || '';
        const salaryMin = this.parseAnnualSalary(posting.baseSalary);

        if (!company || description.length < 100) continue;
        if (!matchesKeywords(`${title} ${description}`, keywords)) continue;

        offers.push({
          externalId: card.url,
          title,
          company,
          location: finalLocation || 'Localisation non précisée',
          remoteType: inferRemoteType(posting, `${card.text} ${description} ${finalLocation}`),
          url: card.url,
          source: 'Welcome to the Jungle',
          description,
          publishedAt: parseDate(posting.datePosted),
          expiresAt: parseDate(posting.validThrough),
          ...(salaryMin ? {
            salaryMin,
            ...(posting.baseSalary?.currency
              ? { salaryCurrency: posting.baseSalary.currency.toUpperCase() }
              : {})
          } : {})
        });
      } catch (error) {
        console.warn(`Offre WTTJ ignorée (${card.url}): ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`);
      }
    }
    return offers;
  }

  private async fetchPage(url: URL): Promise<string> {
    if (url.origin !== WTTJ_ORIGIN) {
      throw new Error(`URL WTTJ invalide: ${url.origin}`);
    }
    const response = await this.fetcher(url, {
      headers: { 'User-Agent': 'Jober personal job-search assistant' },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url.pathname}`);
    return response.text();
  }

  private parseAnnualSalary(
    baseSalary: JobPosting['baseSalary']
  ): number | undefined {
    if (!baseSalary?.value?.minValue) return undefined;
    const unit = baseSalary.value.unitText?.toLocaleUpperCase();
    if (unit === 'YEAR' || unit === 'ANNUAL') return baseSalary.value.minValue;
    if (unit === 'MONTH' || unit === 'MONTHLY') return baseSalary.value.minValue * 12;
    return undefined;
  }
}

export const wttjCollector = new WttjHttpCollectorService();
