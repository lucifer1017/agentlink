import { BaseAgent, JobResponse, AgentCard } from "./BaseAgent";

export class SpecialistAgent extends BaseAgent {
  private specialization: string;
  private rate: string;
  private agentCard: AgentCard;

  constructor(
    specialization: string,
    rate: string,
    apiKey: string,
    url: string
  ) {
    const specType = specialization.charAt(0).toUpperCase() + specialization.slice(1);
    const systemPrompt = SpecialistAgent.generateSystemPromptStatic(specialization);
    
    super({
      name: `${specType} Specialist`,
      role: specialization,
      systemPrompt: systemPrompt,
      apiKey: apiKey,
      model: "gemini-1.5-flash",
    });

    this.specialization = specialization;
    this.rate = rate;
    this.agentCard = {
      id: `specialist-${specialization}`,
      name: this.config.name,
      role: specialization,
      specialization: specialization,
      rate: rate,
      currency: "ETH",
      url: url,
      capabilities: this.getCapabilities(specialization),
    };
  }

  private static generateSystemPromptStatic(specialization: string): string {
    const prompts: { [key: string]: string } = {
      solidity: `You are an expert Solidity smart contract developer. Your role is to:
1. Write secure, efficient Solidity code
2. Implement ERC-20, ERC-721, and other token standards
3. Optimize for gas efficiency
4. Follow best practices and security guidelines
5. Provide detailed comments explaining the code
6. Return the complete contract code as output

When you receive a job request, analyze it carefully and produce production-ready Solidity code.
Always include proper error handling, events, and documentation.`,

      security: `You are a smart contract security expert. Your role is to:
1. Audit Solidity smart contracts for vulnerabilities
2. Identify security risks and attack vectors
3. Provide detailed vulnerability reports
4. Suggest improvements and best practices
5. Rate the security level of the code

When you receive a contract for audit, perform thorough analysis and provide a detailed report.`,

      frontend: `You are an expert React/Next.js developer. Your role is to:
1. Build responsive user interfaces
2. Implement Web3 integration with Thirdweb SDK
3. Create intuitive wallet interactions
4. Design professional UIs
5. Optimize for performance

When you receive a UI requirement, provide clean, production-ready React code.`,
    };

    return (
      prompts[specialization] ||
      `You are a ${specialization} specialist agent. Complete the job requests you receive with high quality output.`
    );
  }

  private getCapabilities(specialization: string): string[] {
    const capabilities: { [key: string]: string[] } = {
      solidity: [
        "ERC-20 token creation",
        "ERC-721 NFT contracts",
        "DeFi protocol development",
        "Smart contract optimization",
        "Gas optimization",
      ],
      security: [
        "Vulnerability analysis",
        "Code auditing",
        "Risk assessment",
        "Security recommendations",
        "Compliance checking",
      ],
      frontend: [
        "React/Next.js development",
        "Web3 integration",
        "Wallet connection",
        "UI/UX design",
        "Performance optimization",
      ],
    };

    return (
      capabilities[specialization] || ["General work in " + specialization]
    );
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log(`✓ ${this.config.name} ready`);
    console.log(`  Rate: ${this.rate} ETH`);
    console.log(`  Capabilities: ${this.agentCard.capabilities.join(", ")}`);
  }

  async processJob(jobDescription: string): Promise<JobResponse> {
    console.log(
      `\n🎯 ${this.config.name} processing job: "${jobDescription}"`
    );

    try {
      // Generate the work output
      const output = await this.generateResponse(jobDescription);

      // Create invoice
      const invoice = {
        amount: this.rate,
        currency: "ETH",
        to: "0x0000000000000000000000000000000000000000",
        description: `${this.specialization} work completed`,
      };

      return {
        jobId: "job-001",
        status: "completed",
        result: output,
        invoice: invoice,
      };
    } catch (error) {
      console.error(`Error processing job:`, error);
      return {
        jobId: "job-001",
        status: "failed",
        result: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }

  getSpecialization(): string {
    return this.specialization;
  }

  getRate(): string {
    return this.rate;
  }
}
