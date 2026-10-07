import type { FastifyBaseLogger } from 'fastify';
import { jobCollector } from './job-collector.service.js';

const COLLECTION_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function startJobCollectionScheduler(logger: FastifyBaseLogger): NodeJS.Timeout {
  const collectAndLog = async () => {
    try {
      const result = await jobCollector.runCollection();
      logger.info({ result }, 'Scheduled job collection completed');
    } catch (error) {
      logger.error({ error }, 'Scheduled job collection failed');
    }
  };

  void collectAndLog();
  return setInterval(() => {
    void collectAndLog();
  }, COLLECTION_INTERVAL_MS);
}
