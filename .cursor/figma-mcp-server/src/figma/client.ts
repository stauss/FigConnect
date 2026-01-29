import fetch from 'node-fetch';
import { CONFIG } from '../config.js';
import { logger } from '../logger.js';

export class FigmaAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'FigmaAPIError';
  }
}

export class FigmaClient {
  private baseUrl = CONFIG.figma.apiBase;
  private token = CONFIG.figma.accessToken;
  private requestCount = 0;
  private requestWindowStart = Date.now();

  /**
   * Make GET request to Figma API
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    await this.checkRateLimit();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    logger.debug(`Figma API GET: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Figma-Token': this.token,
      },
      signal: AbortSignal.timeout(CONFIG.figma.timeout),
    });

    this.requestCount++;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Figma API error: ${response.status}`, errorText);

      // Handle specific error codes
      if (response.status === 404) {
        throw new FigmaAPIError('File or resource not found', 404, 'NOT_FOUND');
      }
      if (response.status === 403) {
        throw new FigmaAPIError(
          'Access denied. Check your Figma token permissions',
          403,
          'FORBIDDEN'
        );
      }
      if (response.status === 429) {
        throw new FigmaAPIError('Rate limit exceeded', 429, 'RATE_LIMITED');
      }

      throw new FigmaAPIError(
        `Figma API error: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * Simple rate limiting
   */
  private async checkRateLimit() {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset counter if window expired
    if (now - this.requestWindowStart > windowDuration) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    // Wait if at limit
    if (this.requestCount >= CONFIG.rateLimit.maxRequestsPerMinute) {
      const waitTime = windowDuration - (now - this.requestWindowStart);
      logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }
  }

  /**
   * Get file structure
   */
  async getFile(fileKey: string, depth?: number) {
    const params = depth ? { depth: depth.toString() } : undefined;
    return this.get(`/files/${fileKey}`, params);
  }

  /**
   * Get specific nodes
   */
  async getNodes(fileKey: string, nodeIds: string[]) {
    return this.get(`/files/${fileKey}/nodes`, {
      ids: nodeIds.join(','),
    });
  }

  /**
   * Get image exports
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    format: string = 'png',
    scale: number = 1
  ) {
    return this.get(`/images/${fileKey}`, {
      ids: nodeIds.join(','),
      format,
      scale: scale.toString(),
    });
  }

  /**
   * Get file components
   */
  async getFileComponents(fileKey: string) {
    return this.get(`/files/${fileKey}/components`);
  }

  /**
   * Get file styles
   */
  async getFileStyles(fileKey: string) {
    return this.get(`/files/${fileKey}/styles`);
  }

  /**
   * Get file comments
   */
  async getComments(fileKey: string) {
    return this.get(`/files/${fileKey}/comments`);
  }

  /**
   * Get file versions
   */
  async getVersions(fileKey: string, pageSize: number = 10) {
    return this.get(`/files/${fileKey}/versions`, {
      page_size: pageSize.toString(),
    });
  }

  /**
   * Get local variables
   */
  async getLocalVariables(fileKey: string) {
    return this.get(`/files/${fileKey}/variables/local`);
  }
}

// Singleton instance
export const figmaClient = new FigmaClient();
