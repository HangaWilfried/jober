export interface RawJobItem {
  externalId?: string;
  title: string;
  company: string;
  location: string;
  remoteType: 'full' | 'hybrid' | 'on-site' | 'unknown';
  url: string;
  source: string;
  description: string;
  publishedAt?: Date;
}

export interface CollectionResult {
  totalDiscovered: number;
  newOffersSaved: number;
  duplicatesSkipped: number;
  filteredOut: number;
  highlyRelevantMatches: number;
  sources: string[];
  failedSources: string[];
}

export interface FeedCollectionResult {
  offers: RawJobItem[];
  sources: string[];
  failedSources: string[];
}
