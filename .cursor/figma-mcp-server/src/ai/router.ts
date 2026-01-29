import { BaseCommand } from "../commands/types.js";
import { logger } from "../logger.js";

/**
 * Intent extracted from user message
 */
export interface Intent {
  action: string; // e.g., "move", "create", "delete"
  target?: string; // Target node/component
  parameters: Record<string, any>;
  confidence: number; // 0-1 confidence score
}

/**
 * Context for AI decision-making
 */
export interface AIContext {
  fileKey: string;
  targetNodeId?: string;
  nearbyNodes?: string[];
  styles?: any;
  variables?: any;
  userMessage: string;
  [key: string]: any; // Additional context
}

/**
 * AI provider interface for provider-agnostic routing
 * Enables swapping Claude/GPT/local models without changing command layer
 */
export interface AIProvider {
  generateIntent(message: string, context: AIContext): Promise<Intent>;
  generateCommands(intent: Intent, context: AIContext): Promise<BaseCommand[]>;
  name: string; // Provider name (e.g., "claude", "gpt-4", "local")
}

/**
 * AI router for provider-agnostic AI integration
 * Routes requests to appropriate AI provider
 */
export interface AIRouter {
  route(message: string, context: AIContext): Promise<BaseCommand[]>;
  registerProvider(name: string, provider: AIProvider): void;
  getProvider(name?: string): AIProvider | null;
  getDefaultProvider(): AIProvider | null;
}

/**
 * AI router implementation
 */
export class AIRouterImpl implements AIRouter {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProviderName: string | null = null;

  /**
   * Register an AI provider
   */
  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider);
    if (!this.defaultProviderName) {
      this.defaultProviderName = name;
    }
    logger.info(`Registered AI provider: ${provider.name}`);
  }

  /**
   * Get provider by name, or default if not specified
   */
  getProvider(name?: string): AIProvider | null {
    if (name) {
      return this.providers.get(name) || null;
    }
    return this.getDefaultProvider();
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): AIProvider | null {
    if (!this.defaultProviderName) {
      return null;
    }
    return this.providers.get(this.defaultProviderName) || null;
  }

  /**
   * Route message through AI to generate commands
   */
  async route(message: string, context: AIContext): Promise<BaseCommand[]> {
    const provider = this.getDefaultProvider();
    if (!provider) {
      throw new Error("No AI provider registered");
    }

    try {
      // Step 1: Generate intent from message
      logger.debug(`Generating intent via ${provider.name}`);
      const intent = await provider.generateIntent(message, context);

      // Step 2: Generate commands from intent
      logger.debug(`Generating commands from intent: ${intent.action}`);
      const commands = await provider.generateCommands(intent, context);

      return commands;
    } catch (error: any) {
      logger.error(`AI routing failed:`, error);
      throw new Error(`AI routing failed: ${error.message}`);
    }
  }
}

// Singleton instance
export const aiRouter: AIRouter = new AIRouterImpl();
