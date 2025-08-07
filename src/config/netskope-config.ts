import dotenv from 'dotenv';
import { z } from "zod";

dotenv.config();

export const configSchema = z.object({
  baseUrl: z.string().url(),
  apiToken: z.string().min(1),
  timeout: z.number().positive().default(30000),
  retryAttempts: z.number().nonnegative().default(3),
  retryDelay: z.number().nonnegative().default(1000),
  cacheTTL: z.number().nonnegative().default(300), // 5 minutes
  cacheSize: z.number().positive().default(1000)
});

export type Config = z.infer<typeof configSchema>;

const defaultConfig: Partial<Config> = {
  timeout: 10000, // Reduced from 30s to 10s
  retryAttempts: 1, // Reduced from 3 to 1 for faster debugging
  retryDelay: 500, // Reduced from 1000ms to 500ms
  cacheTTL: 300,
  cacheSize: 1000
};

export function loadConfig(): Config {
  const config = {
    baseUrl: process.env.NETSKOPE_BASE_URL,
    apiToken: process.env.NETSKOPE_API_TOKEN || process.env.NETSKOPE_API_KEY,
    timeout: parseInt(process.env.NETSKOPE_TIMEOUT ?? String(defaultConfig.timeout)),
    retryAttempts: parseInt(process.env.NETSKOPE_RETRY_ATTEMPTS ?? String(defaultConfig.retryAttempts)),
    retryDelay: parseInt(process.env.NETSKOPE_RETRY_DELAY ?? String(defaultConfig.retryDelay)),
    cacheTTL: parseInt(process.env.NETSKOPE_CACHE_TTL ?? String(defaultConfig.cacheTTL)),
    cacheSize: parseInt(process.env.NETSKOPE_CACHE_SIZE ?? String(defaultConfig.cacheSize))
  };

  const result = configSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${errors}`);
  }

  return result.data;
}

export class ApiClient {
  private config: Config;
  private cache: Map<string, {data: any, timestamp: number}>;

  constructor(config: Config) {
    this.config = config;
    this.cache = new Map();
  }

  private getCacheKey(path: string, options: RequestInit): string {
    return `${options.method || 'GET'}:${path}:${options.body || ''}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return (Date.now() - timestamp) < (this.config.cacheTTL * 1000);
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(path, options);
    
    // Debug logging for URL construction
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] API: request called with path: ${JSON.stringify(path)}, type: ${typeof path}\n`;
    try {
      const fs = await import('fs');
      fs.appendFileSync('debug.log', logMessage);
    } catch (error) {
      console.error('Debug log failed:', error);
      console.log('API request path:', path, 'type:', typeof path);
    }
    
    if (options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }
    }

    const url = new URL(path, this.config.baseUrl);
    const headers = new Headers(options.headers);
    const apiToken = process.env.NETSKOPE_API_TOKEN || process.env.NETSKOPE_API_KEY;
    if (!apiToken) {
      throw new Error('Netskope API token not found in environment variables.');
    }
    headers.set('Authorization', `Bearer ${apiToken}`);
    headers.set('Content-Type', 'application/json');


    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers,
        signal: controller.signal
      });


      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as T;
      
      if (options.method === 'GET') {
        if (this.cache.size >= this.config.cacheSize) {
          const oldestKey = [...this.cache.entries()]
            .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0];
          this.cache.delete(oldestKey);
        }
        this.cache.set(cacheKey, {data, timestamp: Date.now()});
      }
      
      return data;
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async requestWithRetry<T>(path: string, options: RequestInit = {}): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await this.request<T>(path, options);
      } catch (error) {
        lastError = error as Error;
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }
        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
      }
    }

    throw lastError;
  }
}

export const api = new ApiClient(loadConfig());