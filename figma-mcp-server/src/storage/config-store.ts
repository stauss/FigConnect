import { database, ConfigData } from "./database.js";
import { figmaClient } from "../figma/client.js";
import { logger } from "../logger.js";

/**
 * Configuration store with validation
 */
export class ConfigStore {
  /**
   * Get current configuration
   */
  async getConfig(): Promise<ConfigData> {
    return database.getConfig();
  }

  /**
   * Save configuration
   */
  async saveConfig(config: Partial<ConfigData>): Promise<void> {
    const existing = await database.getConfig();
    const updated: ConfigData = {
      ...existing,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    // Validate token if provided
    if (
      config.figmaAccessToken &&
      config.figmaAccessToken !== existing.figmaAccessToken
    ) {
      await this.validateToken(config.figmaAccessToken);
    }

    await database.saveConfig(updated);
    logger.info("Configuration saved");
  }

  /**
   * Validate Figma access token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Try to fetch user info or a test endpoint
      // Using a simple file list endpoint would work, but we need a file key
      // Instead, we'll validate by trying to use it in the client
      // For now, just check format
      if (!token.startsWith("figd_")) {
        throw new Error(
          "Invalid token format. Figma tokens start with 'figd_'",
        );
      }

      // Could add actual API validation here by calling a test endpoint
      // For MVP, format validation is sufficient
      return true;
    } catch (error: any) {
      logger.error("Token validation failed:", error);
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Get Figma access token
   */
  async getFigmaToken(): Promise<string | null> {
    const config = await this.getConfig();
    return config.figmaAccessToken || null;
  }

  /**
   * Check if configuration is complete
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return !!config.figmaAccessToken;
  }
}

// Singleton instance
export const configStore = new ConfigStore();
