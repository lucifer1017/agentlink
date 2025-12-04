import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  apiKey: string;
  model?: string;
}

export interface AgentCard {
  id: string;
  name: string;
  role: string;
  specialization: string;
  rate: string;
  currency: string;
  url: string;
  address?: string;
  capabilities: string[];
}

export interface JobRequest {
  jobId: string;
  description: string;
  requiredSkills: string[];
  budget?: string;
}

export interface JobResponse {
  jobId: string;
  status: "completed" | "failed" | "in_progress";
  result: string; // Preview/description shown before payment
  fullResult?: string; // Full code/work shown after payment
  invoice?: {
    amount: string;
    currency: string;
    to: string;
    description: string;
    breakdown?: Array<{
      specialist: string;
      amount: string;
      address: string;
    }>;
  };
  priceComparison?: {
    specialization: string;
    options: Array<{
      name: string;
      rate: string;
      address: string;
    }>;
    selected: {
      name: string;
      rate: string;
      address: string;
    };
  };
}

export class BaseAgent {
  protected config: AgentConfig;
  protected model: any;

  constructor(config: AgentConfig) {
    this.config = config;
    // Use gemini-2.5-flash which is the latest stable model
    const modelName = config.model || "gemini-2.5-flash";
    this.model = google(modelName);
  }

  protected async generateResponse(
    userMessage: string,
    additionalContext?: string
  ): Promise<string> {
    const systemPrompt = this.config.systemPrompt;
    const fullPrompt = additionalContext
      ? `${systemPrompt}\n\nAdditional Context:\n${additionalContext}\n\nUser Request:\n${userMessage}`
      : `${systemPrompt}\n\nUser Request:\n${userMessage}`;

    try {
      const response = await generateText({
        model: this.model,
        prompt: fullPrompt,
        temperature: 0.7,
        maxTokens: 8000, // Increased for full smart contracts and detailed responses
      });

      return response.text;
    } catch (error) {
      console.error(`Error generating response for ${this.config.name}:`, error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    // Override in subclasses for custom initialization
    console.log(`Initializing ${this.config.name}...`);
  }

  async shutdown(): Promise<void> {
    // Override in subclasses for cleanup
    console.log(`Shutting down ${this.config.name}...`);
  }
}
