import PQueue from 'p-queue';
import { LRUCache } from 'lru-cache';

// Airtable limit: 5 requests per second
// We use 4 concurrent requests and 4 requests per second to stay safe
const queue = new PQueue({ concurrency: 4, interval: 1000, intervalCap: 4 });

// Micro-cache (5 seconds)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 1000,
});

/**
 * Executes an Airtable request with rate limiting, caching, and retries.
 * 
 * @param key Unique key for caching (use null to skip cache)
 * @param fn The async function that performs the Airtable request
 * @param retries Number of retries (default: 3)
 */
export async function airtableSafe<T>(
  key: string | null,
  fn: () => Promise<T>,
  retries = 3,
  useCache = true
): Promise<T> {
  // Check cache first if key is provided and useCache is true
  if (useCache && key && cache.has(key)) {
    return cache.get(key) as T;
  }


  const execute = async (attempt: number): Promise<T> => {
    try {
      // Add to queue for rate limiting
      const result = await queue.add(fn);
      
      // Store in cache if key is provided and useCache is true
      // and result is not empty (for arrays)
      const hasContent = Array.isArray(result) ? result.length > 0 : !!result;
      if (useCache && key && hasContent) {
        cache.set(key, result);
      }
      
      return result as T;
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number };
      // Check if we should retry (Airtable 429 error or network error)
      if (attempt < retries && (err?.status === 429 || err?.statusCode === 429 || !err?.status)) {
        const delay = Math.pow(2, attempt) * 100; // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise((resolve) => setTimeout(resolve, delay));
        return execute(attempt + 1);
      }
      throw error;
    }
  };

  return execute(0);
}
