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
  result: string;
  invoice?: {
    amount: string;
    currency: string;
    to: string;
    description: string;
  };
}

export class BaseAgent {
  protected config: AgentConfig;
  protected model: any;

  constructor(config: AgentConfig) {
    this.config = config;
    this.model = google(config.model || "gemini-1.5-flash");
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
        maxTokens: 2000,
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
