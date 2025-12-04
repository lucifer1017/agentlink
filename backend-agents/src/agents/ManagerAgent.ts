import { BaseAgent, JobRequest, JobResponse, AgentCard } from "./BaseAgent";

export class ManagerAgent extends BaseAgent {
  private registry: Map<string, AgentCard> = new Map();
  private hiredAgents: Map<string, AgentCard> = new Map();

  constructor(apiKey: string) {
    super({
      name: "Manager Agent",
      role: "Project Manager",
      systemPrompt: `You are a Project Manager AI Agent. Your role is to:
1. Analyze user requests and break them down into tasks
2. Identify required specialist agents (e.g., "solidity", "frontend", "security")
3. Find and hire appropriate specialist agents
4. Coordinate work between multiple specialists
5. Ensure deliverables meet quality standards
6. Invoice and payment processing

When you need help, you have access to a find_worker tool that searches the registry for specialists.
Always be clear about what work needs to be done and the timeline.
Be professional and concise in your communications with specialist agents.`,
      apiKey: apiKey,
      model: "gemini-2.5-flash",
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    // Load registry from JSON
    await this.loadRegistry();
  }

  private async loadRegistry(): Promise<void> {
    try {
      // In production, this would fetch from Edenlayer
      // For now, we'll use a mock registry
      const mockRegistry: AgentCard[] = [
        {
          id: "specialist-001",
          name: "Solidity Coder",
          role: "Smart Contract Developer",
          specialization: "solidity",
          rate: "0.01",
          currency: "ETH",
          url: "http://localhost:8787/specialist/solidity",
          capabilities: [
            "ERC-20 tokens",
            "Smart contracts",
            "Solidity optimization",
          ],
        },
        {
          id: "specialist-002",
          name: "Security Auditor",
          role: "Smart Contract Security Expert",
          specialization: "security",
          rate: "0.05",
          currency: "ETH",
          url: "http://localhost:8787/specialist/security",
          capabilities: ["Vulnerability analysis", "Code audit", "Security recommendations"],
        },
      ];

      mockRegistry.forEach((card) => {
        this.registry.set(card.specialization, card);
      });

      console.log(`✓ Registry loaded with ${this.registry.size} specialists`);
    } catch (error) {
      console.error("Failed to load registry:", error);
      throw error;
    }
  }

  async findWorker(specialization: string): Promise<AgentCard | null> {
    console.log(`🔍 Finding worker for specialization: ${specialization}`);

    const worker = this.registry.get(specialization.toLowerCase());

    if (worker) {
      console.log(`✓ Found worker: ${worker.name} (${worker.specialization})`);
      this.hiredAgents.set(specialization, worker);
      return worker;
    }

    console.log(`✗ No worker found for: ${specialization}`);
    return null;
  }

  async hireSpecialist(specialization: string): Promise<AgentCard | null> {
    const specialist = await this.findWorker(specialization);

    if (specialist) {
      console.log(`💼 Hired: ${specialist.name}`);
      console.log(`   Rate: ${specialist.rate} ${specialist.currency}`);
      console.log(`   Contact: ${specialist.url}`);
    }

    return specialist;
  }

  async processUserRequest(userInput: string): Promise<JobResponse> {
    console.log(`\n📋 Processing user request: "${userInput}"`);

    try {
      // Step 1: Analyze the request
      const analysis = await this.analyzeRequest(userInput);
      console.log(`\n📊 Analysis: ${analysis}`);

      // Step 2: Extract required skills from analysis
      const requiredSkills = this.extractSkills(analysis);
      console.log(`\n🛠️ Required skills: ${requiredSkills.join(", ")}`);

      // Step 3: Find and hire specialists
      const hiredSpecialists: AgentCard[] = [];
      for (const skill of requiredSkills) {
        const specialist = await this.hireSpecialist(skill);
        if (specialist) {
          hiredSpecialists.push(specialist);
        }
      }

      if (hiredSpecialists.length === 0) {
        return {
          jobId: "job-001",
          status: "failed",
          result:
            "No suitable specialists found for your request. Please try with different requirements.",
        };
      }

      // Step 4: Send work to specialists (in real implementation)
      const results: string[] = [];
      for (const specialist of hiredSpecialists) {
        const result = await this.contactSpecialist(specialist, userInput);
        results.push(result);
      }

      return {
        jobId: "job-001",
        status: "completed",
        result: results.join("\n\n---\n\n"),
        invoice: {
          amount: (hiredSpecialists.length * 0.01).toString(),
          currency: "ETH",
          to: "0x0000000000000000000000000000000000000000",
          description: `Work completed by ${hiredSpecialists.length} specialist(s)`,
        },
      };
    } catch (error) {
      console.error("Error processing request:", error);
      return {
        jobId: "job-001",
        status: "failed",
        result: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private async analyzeRequest(userInput: string): Promise<string> {
    return this.generateResponse(
      userInput,
      "Analyze this request and identify what type of work needs to be done and what specialists would be required."
    );
  }

  private extractSkills(analysis: string): string[] {
    // Simple extraction - in production, use NLP or LLM to extract skills
    const skills: string[] = [];

    if (
      analysis.toLowerCase().includes("solidity") ||
      analysis.toLowerCase().includes("smart contract") ||
      analysis.toLowerCase().includes("erc-20") ||
      analysis.toLowerCase().includes("token")
    ) {
      skills.push("solidity");
    }

    if (
      analysis.toLowerCase().includes("security") ||
      analysis.toLowerCase().includes("audit") ||
      analysis.toLowerCase().includes("vulnerability")
    ) {
      skills.push("security");
    }

    // Default to solidity if nothing else matches (for demo)
    if (skills.length === 0) {
      skills.push("solidity");
    }

    return skills;
  }

  private async contactSpecialist(
    specialist: AgentCard,
    jobDescription: string
  ): Promise<string> {
    // In production, this would make HTTP request to specialist agent
    console.log(`\n📞 Contacting ${specialist.name}...`);
    console.log(`   Job: ${jobDescription}`);

    const response = await this.generateResponse(
      `You are contacting a ${specialist.specialization} specialist. Prepare a detailed job request for them. The user wants: ${jobDescription}`,
      `Format your response as a professional job request that a ${specialist.specialization} specialist would understand.`
    );

    return response;
  }

  getHiredAgents(): AgentCard[] {
    return Array.from(this.hiredAgents.values());
  }

  clearHiredAgents(): void {
    this.hiredAgents.clear();
  }
}
