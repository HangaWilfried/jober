import * as cheerio from 'cheerio';
import type { RawJobItem } from './collector.types.js';

export class WttjHttpCollectorService {
  async collect(targetTitles: string[], keywords: string[]): Promise<RawJobItem[]> {
    const categories = (targetTitles.length ? targetTitles : keywords).slice(0, 3);
    const offers: RawJobItem[] = [];

    for (const cat of categories) {
      const slug = encodeURIComponent(cat.replace(/\s+/g, '-').toLowerCase());
      const url = `https://www.welcometothejungle.com/fr/pages/emploi-${slug}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const html = await res.text();
        const $ = cheerio.load(html);

        const nodes = $('[data-testid^="job-thumb-"]').slice(0, 5);
        nodes.each((_, el) => {
          const link = $(el).find('a[href*="/companies/"][href*="/jobs/"]').first();
          const href = link.attr('href');
          if (!href) return;
          const jobUrl = new URL(href, 'https://www.welcometothejungle.com').toString();
          offers.push({
            externalId: jobUrl,
            title: (link.text() || '').trim(),
            company: '',
            location: '',
            remoteType: 'unknown',
            url: jobUrl,
            source: 'Welcome to the Jungle',
            description: '',
            publishedAt: undefined
          });
        });
      } catch (e) {
        // ignore and continue
        continue;
      }
    }

    return offers;
  }
}

export const wttjCollector = new WttjHttpCollectorService();
