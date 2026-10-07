import assert from 'node:assert/strict';
import test from 'node:test';
import { WttjHttpCollectorService } from './wttj-http-collector.service.js';

const listingHtml = `
  <div data-testid="job-thumb-1">
    <a href="/fr/companies/example/jobs/vue-developer">Senior Vue Developer</a>
    <a href="/fr/companies/example">Example Company</a>
  </div>
`;

const posting = {
  '@context': 'https://schema.org',
  '@type': 'https://schema.org/JobPosting',
  title: 'Senior Vue Developer',
  description: '<p>Build a Vue and TypeScript application with our engineering team. '.repeat(3) + '</p>',
  datePosted: '2026-10-01T00:00:00Z',
  validThrough: '2026-12-01T00:00:00Z',
  hiringOrganization: { name: 'Example Company' },
  jobLocation: {
    address: {
      addressLocality: 'Paris',
      addressCountry: 'France'
    }
  },
  baseSalary: {
    currency: 'EUR',
    value: { minValue: 55000, unitText: 'YEAR' }
  }
};

test('collects complete WTTJ offers from listing cards and JSON-LD', async () => {
  const requestedUrls: string[] = [];
  const collector = new WttjHttpCollectorService(async (input) => {
    const url = String(input);
    requestedUrls.push(url);
    return new Response(
      url.includes('/pages/')
        ? listingHtml
        : `<script type="application/ld+json">${JSON.stringify(posting)}</script>`,
      { status: 200 }
    );
  });

  const offers = await collector.collect(['Vue Developer'], ['Vue']);

  assert.equal(offers.length, 1);
  assert.equal(offers[0].title, 'Senior Vue Developer');
  assert.equal(offers[0].company, 'Example Company');
  assert.equal(offers[0].location, 'Paris, France');
  assert.equal(offers[0].salaryMin, 55000);
  assert.equal(offers[0].salaryCurrency, 'EUR');
  assert.ok((offers[0].description?.length ?? 0) > 100);
  assert.equal(requestedUrls.length, 2);
});

test('rejects WTTJ page markup that no longer contains job cards', async () => {
  const collector = new WttjHttpCollectorService(async () =>
    new Response('<html><body>Updated page layout</body></html>', { status: 200 })
  );

  await assert.rejects(
    () => collector.collect(['Vue Developer'], []),
    /Format inattendu/
  );
});
