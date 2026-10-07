import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import type { FeedCollectionResult, RawJobItem } from './collector.types.js';
import { wttjCollector } from './wttj-http-collector.service.js';

interface RemoteOKJob {
  id?: string | number;
  position?: string;
  company?: string;
  url?: string;
  location?: string;
  description?: string;
  tags?: string[];
  date?: string;
  salary_min?: string | number;
}

function isRemoteOKJob(value: unknown): value is RemoteOKJob {
  return typeof value === 'object' && value !== null;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;

  const normalizedText = normalizeText(text);
  return keywords.some((keyword) => {
    const tokens = normalizeText(keyword).split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => normalizedText.includes(token));
  });
}

function textFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

function parsePublishedAt(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export class FeedCollectorService {
  private readonly rssParser = new Parser();

  async collectFromTechFeeds(
    targetTitles: string[],
    keywords: string[]
  ): Promise<FeedCollectionResult> {
    const sources = await Promise.all([
      this.collectSource(
        'Welcome to the Jungle',
        () => wttjCollector.collect(targetTitles, keywords)
      ),
      this.collectSource('We Work Remotely', () => this.collectWeWorkRemotely(keywords)),
      this.collectSource('RemoteOK', () => this.collectRemoteOK(keywords))
    ]);

    const successful = sources.filter((result) => result.offers !== null);
    const failedSources = sources
      .filter((result) => result.offers === null)
      .map((result) => `${result.source}: ${result.error}`);

    if (successful.length === 0) {
      throw new Error(`Toutes les sources de collecte ont échoué. ${failedSources.join(' ')}`);
    }

    return {
      offers: successful.flatMap((result) => result.offers ?? []),
      sources: successful.map((result) => result.source),
      failedSources
    };
  }

  private async collectSource(
    source: string,
    collect: () => Promise<RawJobItem[]>
  ): Promise<{ source: string; offers: RawJobItem[] | null; error?: string }> {
    try {
      return { source, offers: await collect() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.warn(`Source de collecte indisponible (${source}): ${message}`);
      return { source, offers: null, error: message };
    }
  }

  private async collectWeWorkRemotely(keywords: string[]): Promise<RawJobItem[]> {
    const response = await fetch(
      'https://weworkremotely.com/categories/remote-programming-jobs.rss',
      { signal: AbortSignal.timeout(15_000) }
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const feed = await this.rssParser.parseString(await response.text());
    const offers: RawJobItem[] = [];

    for (const item of (feed.items || []).slice(0, 30)) {
      if (!item.title || !item.link) continue;

      const separatorIndex = item.title.indexOf(':');
      const company = separatorIndex > 0
        ? item.title.slice(0, separatorIndex).trim()
        : 'Entreprise Tech';
      const title = separatorIndex > 0
        ? item.title.slice(separatorIndex + 1).trim()
        : item.title.trim();
      const description = textFromHtml(item.content || item.contentSnippet || '') || title;

      if (!title || !matchesKeywords(`${title} ${description}`, keywords)) continue;

      offers.push({
        externalId: item.guid || item.link,
        title,
        company,
        location: 'Full Remote (International / Europe)',
        remoteType: 'full',
        url: item.link,
        source: 'We Work Remotely',
        description,
        publishedAt: parsePublishedAt(item.isoDate || item.pubDate)
      });
    }

    return offers;
  }

  private async collectRemoteOK(keywords: string[]): Promise<RawJobItem[]> {
    const response = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'Jober job collection (personal productivity app)'
      },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: unknown = await response.json();
    const jobs = Array.isArray(data)
      ? data.slice(1, 51).filter(isRemoteOKJob)
      : [];
    const offers: RawJobItem[] = [];

    for (const job of jobs) {
      if (typeof job.position !== 'string' || typeof job.company !== 'string') continue;

      const title = job.position.trim();
      const company = job.company.trim();
      const url = job.url ? new URL(job.url, 'https://remoteok.com').toString() : 'https://remoteok.com';
      const description = textFromHtml(job.description || '') || title;
      const tags = Array.isArray(job.tags) ? job.tags.join(' ') : '';

      if (!title || !company || !matchesKeywords(`${title} ${description} ${tags}`, keywords)) continue;

      offers.push({
        externalId: job.id ? String(job.id) : url,
        title,
        company,
        location: typeof job.location === 'string' && job.location.trim()
          ? job.location.trim()
          : 'Remote',
        remoteType: 'full',
        url,
        source: 'RemoteOK',
        description,
        publishedAt: parsePublishedAt(job.date),
        ...(typeof job.salary_min === 'number' && job.salary_min > 0
          ? { salaryMin: job.salary_min }
          : typeof job.salary_min === 'string' && Number(job.salary_min) > 0
            ? { salaryMin: Number(job.salary_min) }
            : {})
      });
    }

    return offers;
  }
}

export const feedCollector = new FeedCollectorService();
