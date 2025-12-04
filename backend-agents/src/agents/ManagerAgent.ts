import { BaseAgent, JobRequest, JobResponse, AgentCard } from "./BaseAgent";
import { SpecialistAgent } from "./SpecialistAgent";

export class ManagerAgent extends BaseAgent {
  private registry: Map<string, AgentCard> = new Map();
  private hiredAgents: Map<string, AgentCard> = new Map();
  private specialistAgents?: Map<string, SpecialistAgent>;

  constructor(apiKey: string, specialistAgents?: Map<string, SpecialistAgent>) {
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
    
    this.specialistAgents = specialistAgents;
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
      // Get base URL from environment or default to Cloudflare Workers URL
      const baseUrl = process.env.BASE_URL || "https://agentlink-backend.agentlink.workers.dev";
      
      // Multiple specialists per type with different prices (marketplace simulation)
      const mockRegistry: AgentCard[] = [
        // Solidity Specialists (3 options with different prices)
        {
          id: "specialist-solidity-001",
          name: "Solidity Pro",
          role: "Smart Contract Developer",
          specialization: "solidity",
          rate: "0.0005", // Cheapest
          currency: "ETH",
          url: `${baseUrl}/specialist/solidity`,
          address: "0xef1562c87973f9013721c37d3af26d6c9baf6ee3",
          capabilities: ["ERC-20 tokens", "Smart contracts", "Solidity optimization"],
        },
        {
          id: "specialist-solidity-002",
          name: "Contract Master",
          role: "Smart Contract Developer",
          specialization: "solidity",
          rate: "0.0006",
          currency: "ETH",
          url: `${baseUrl}/specialist/solidity`,
          address: "0x1f8348b5a5e72b409af3362dcd8eba6ceae95b0f",
          capabilities: ["ERC-20 tokens", "DeFi protocols", "Gas optimization"],
        },
        {
          id: "specialist-solidity-003",
          name: "Blockchain Expert",
          role: "Smart Contract Developer",
          specialization: "solidity",
          rate: "0.0007", // Most expensive
          currency: "ETH",
          url: `${baseUrl}/specialist/solidity`,
          address: "0xef1562c87973f9013721c37d3af26d6c9baf6ee3",
          capabilities: ["ERC-721 NFTs", "Complex protocols", "Advanced optimization"],
        },
        // Security Specialists (2 options)
        {
          id: "specialist-security-001",
          name: "Security Pro",
          role: "Smart Contract Security Expert",
          specialization: "security",
          rate: "0.0007", // Cheapest
          currency: "ETH",
          url: `${baseUrl}/specialist/security`,
          address: "0x68031f3974f6fbe580b607ffd1435b669ac190ff",
          capabilities: ["Vulnerability analysis", "Code audit", "Security recommendations"],
        },
        {
          id: "specialist-security-002",
          name: "Audit Master",
          role: "Smart Contract Security Expert",
          specialization: "security",
          rate: "0.0009", // More expensive
          currency: "ETH",
          url: `${baseUrl}/specialist/security`,
          address: "0x68031f3974f6fbe580b607ffd1435b669ac190ff",
          capabilities: ["Comprehensive audits", "Penetration testing", "Formal verification"],
        },
        // Frontend Specialists (2 options)
        {
          id: "specialist-frontend-001",
          name: "UI Expert",
          role: "React/Web3 Developer",
          specialization: "frontend",
          rate: "0.0006", // Cheapest
          currency: "ETH",
          url: `${baseUrl}/specialist/frontend`,
          address: "0xd91f1c11e7f6d0d4df5f8da3d2193c34f5cf216c",
          capabilities: ["React/Next.js development", "Web3 integration", "UI/UX design"],
        },
        {
          id: "specialist-frontend-002",
          name: "Full Stack Dev",
          role: "React/Web3 Developer",
          specialization: "frontend",
          rate: "0.0008", // More expensive
          currency: "ETH",
          url: `${baseUrl}/specialist/frontend`,
          address: "0xd91f1c11e7f6d0d4df5f8da3d2193c34f5cf216c",
          capabilities: ["Advanced React", "Performance optimization", "Complex integrations"],
        },
      ];

      // Store all specialists (multiple per specialization)
      // Use a composite key to allow multiple specialists per type
      mockRegistry.forEach((card) => {
        this.registry.set(card.id, card); // Use ID as key to allow duplicates
      });

      console.log(`✓ Registry loaded with ${this.registry.size} specialists`);
    } catch (error) {
      console.error("Failed to load registry:", error);
      throw error;
    }
  }

  async findWorker(specialization: string): Promise<AgentCard | null> {
    console.log(`🔍 Finding worker for specialization: ${specialization}`);

    // Find all specialists matching this specialization
    const matchingSpecialists: AgentCard[] = [];
    
    for (const specialist of this.registry.values()) {
      if (specialist.specialization === specialization) {
        matchingSpecialists.push(specialist);
      }
    }

    if (matchingSpecialists.length === 0) {
      console.log(`✗ No worker found for: ${specialization}`);
      return null;
    }

    // Choose the cheapest specialist (marketplace behavior)
    const cheapestSpecialist = matchingSpecialists.reduce((cheapest, current) => {
      const cheapestRate = parseFloat(cheapest.rate || "0");
      const currentRate = parseFloat(current.rate || "0");
      return currentRate < cheapestRate ? current : cheapest;
    });

    console.log(`✓ Found ${matchingSpecialists.length} specialist(s) for ${specialization}`);
    console.log(`   Selected: ${cheapestSpecialist.name} (${cheapestSpecialist.rate} ETH) - Cheapest option`);
    
    this.hiredAgents.set(cheapestSpecialist.id, cheapestSpecialist);
    return cheapestSpecialist;
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
      // Check if request is an informational query (not a work request)
      if (this.isInformationalQuery(userInput)) {
        const response = await this.getInformationalResponse(userInput);
        return {
          jobId: "job-001",
          status: "completed",
          result: response,
        };
      }

      // Check if request is too vague
      if (this.isVagueRequest(userInput)) {
        const clarificationResponse = await this.generateResponse(
          userInput,
          `The user's request is too vague or unclear. Politely ask them to provide more specific details about what they need. 
          Give 2-3 helpful examples of specific requests they could make. Be friendly and helpful.`
        );
        return {
          jobId: "job-001",
          status: "failed",
          result: clarificationResponse,
        };
      }

      // Step 1: Analyze the request
      const analysis = await this.analyzeRequest(userInput);
      console.log(`\n📊 Analysis: ${analysis}`);

      // Step 2: Extract required skills from analysis
      const requiredSkills = this.extractSkills(analysis);
      console.log(`\n🛠️ Required skills: ${requiredSkills.join(", ")}`);

      // If no specific skills detected, ask for clarification
      if (requiredSkills.length === 0) {
        return {
          jobId: "job-001",
          status: "failed",
          result: `I couldn't determine what type of work you need. Please be more specific about your requirements.

Available specialists:
• **Solidity Developer** - For smart contracts, tokens, DeFi protocols
• **Frontend Developer** - For React components, UI/UX, Web3 integration
• **Security Auditor** - For security audits, vulnerability assessments

What would you like to build or need help with?`,
        };
      }

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

      // Step 4: Send work to specialists (actual HTTP calls)
      const previews: string[] = [];
      const fullResults: string[] = [];
      let totalAmount = 0;
      const specialistInvoices: Array<{ amount: string; to: string; currency: string }> = [];
      
      for (const specialist of hiredSpecialists) {
        try {
          const jobResponse = await this.contactSpecialist(specialist, userInput);
          
          // Ensure result is a valid string
          const preview = jobResponse.result ? String(jobResponse.result).trim() : "";
          if (preview) {
            previews.push(preview);
          }
          
          // Collect full results if available
          const fullResult = jobResponse.fullResult ? String(jobResponse.fullResult).trim() : "";
          if (fullResult) {
            fullResults.push(fullResult);
          } else if (preview) {
            // If no fullResult, use result as fallback
            fullResults.push(preview);
          }
          
          // Use invoice from specialist response, or create one from specialist card
          if (jobResponse.invoice) {
            const amount = parseFloat(String(jobResponse.invoice.amount || "0"));
            if (!isNaN(amount) && amount > 0) {
              totalAmount += amount;
              specialistInvoices.push({
                amount: String(jobResponse.invoice.amount),
                to: String(jobResponse.invoice.to || specialist.address || ""),
                currency: String(jobResponse.invoice.currency || "ETH"),
              });
            }
          } else if (specialist.address && specialist.rate) {
            // Fallback: create invoice from specialist card
            const amount = parseFloat(String(specialist.rate || "0"));
            if (!isNaN(amount) && amount > 0) {
              totalAmount += amount;
              specialistInvoices.push({
                amount: String(specialist.rate),
                to: String(specialist.address),
                currency: String(specialist.currency || "ETH"),
              });
            }
          }
        } catch (error) {
          console.error(`Error processing specialist ${specialist.name}:`, error);
          // Continue with other specialists
        }
      }

      // Ensure we have at least one preview
      if (previews.length === 0) {
        previews.push("Work is being prepared. Please try again.");
      }
      
      // Ensure we have at least one full result
      if (fullResults.length === 0) {
        fullResults.push(previews[0] || "Work completed.");
      }

      // Use the first specialist's invoice address (primary payment address)
      const invoiceAddress = specialistInvoices.length > 0 
        ? specialistInvoices[0].to 
        : (hiredSpecialists[0]?.address || "0x0000000000000000000000000000000000000000");

      // Format amount with proper precision (remove trailing zeros, show up to 6 decimals)
      const formatAmount = (amount: number): string => {
        if (amount === 0) return "0";
        // Convert to string with 6 decimals, then remove trailing zeros
        return amount.toFixed(6).replace(/\.?0+$/, '');
      };

      return {
        jobId: "job-001",
        status: "completed",
        result: previews.join("\n\n---\n\n"), // Preview shown before payment
        fullResult: fullResults.join("\n\n---\n\n"), // Full code shown after payment
        invoice: {
          amount: totalAmount > 0 ? formatAmount(totalAmount) : "0.0006",
          currency: "ETH",
          to: invoiceAddress,
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

  private isInformationalQuery(userInput: string): boolean {
    const lowerInput = userInput.toLowerCase().trim();
    
    // Informational question patterns
    const infoPatterns = [
      "what is",
      "what are",
      "what can",
      "what do",
      "what does",
      "how does",
      "how do",
      "tell me about",
      "explain",
      "describe",
      "scope",
      "services",
      "capabilities",
      "what services",
      "what can you",
      "what do you",
      "who are",
      "who is",
    ];
    
    // Check if it's a question (ends with ?) or contains informational patterns
    const isQuestion = lowerInput.endsWith("?");
    const hasInfoPattern = infoPatterns.some(pattern => lowerInput.includes(pattern));
    
    // If it's clearly informational (question mark + info pattern), treat as query
    if (isQuestion && hasInfoPattern) {
      return true;
    }
    
    // Also check for standalone info patterns even without question mark
    if (hasInfoPattern && lowerInput.length < 50) {
      return true;
    }
    
    return false;
  }

  private async getInformationalResponse(userInput: string): Promise<string> {
    // Use LLM to generate natural, contextual response instead of hardcoded
    const specialistInfo = Array.from(this.registry.values())
      .map(spec => `- ${spec.name} (${spec.specialization}): ${spec.capabilities.slice(0, 3).join(", ")}`)
      .join("\n");
    
    return this.generateResponse(
      userInput,
      `You are the Manager Agent for AgentLink, a decentralized marketplace for AI agents. 
      
Available specialists in the registry:
${specialistInfo}

Provide a helpful, natural response to the user's question about services, capabilities, or how the system works. 
Be conversational and friendly, but informative. Include examples of what users can request.
Don't mention specific prices - just describe the services naturally.`
    );
  }

  private isVagueRequest(userInput: string): boolean {
    const lowerInput = userInput.toLowerCase().trim();
    
    // Very short or generic phrases
    const vaguePhrases = [
      "can you find",
      "find anything",
      "find something",
      "help me",
      "what can you do",
      "what do you do",
      "show me",
      "give me",
      "i need",
      "i want",
    ];
    
    // Check if input is very short (less than 20 chars) or contains vague phrases without specifics
    if (lowerInput.length < 20) {
      // But allow specific short requests like "ERC-20 token" or "NFT contract"
      const specificKeywords = ["erc", "token", "nft", "contract", "component", "audit", "security"];
      const hasSpecificKeyword = specificKeywords.some(keyword => lowerInput.includes(keyword));
      
      if (!hasSpecificKeyword) {
        return true;
      }
    }
    
    // Check for vague phrases without context
    const hasVaguePhrase = vaguePhrases.some(phrase => lowerInput.includes(phrase));
    if (hasVaguePhrase && lowerInput.length < 30) {
      // If it's a vague phrase and the request is short, it's likely vague
      return true;
    }
    
    return false;
  }

  private async analyzeRequest(userInput: string): Promise<string> {
    return this.generateResponse(
      userInput,
      `Analyze this request and identify what type of work needs to be done and what specialists would be required.
      
Available specialists:
- "solidity": For smart contracts, tokens, blockchain development, Solidity code
- "frontend": For React components, UI/UX, Next.js, Web3 integration, wallet connections, user interfaces
- "security": For security audits, vulnerability assessments, code reviews

Be specific about which specialist(s) are needed. For example:
- "Build a React component" → frontend
- "Create a smart contract" → solidity
- "Audit my contract" → security
- "Build a dApp with frontend and contracts" → frontend + solidity`
    );
  }

  private extractSkills(analysis: string): string[] {
    // Extract required skills from analysis text
    const skills: string[] = [];
    const lowerAnalysis = analysis.toLowerCase();

    // Frontend/React/UI detection (check first to avoid false positives)
    if (
      lowerAnalysis.includes("react") ||
      lowerAnalysis.includes("frontend") ||
      lowerAnalysis.includes("front-end") ||
      lowerAnalysis.includes("ui") ||
      lowerAnalysis.includes("component") ||
      lowerAnalysis.includes("next.js") ||
      lowerAnalysis.includes("nextjs") ||
      lowerAnalysis.includes("web3") ||
      lowerAnalysis.includes("wallet connection") ||
      lowerAnalysis.includes("wallet integration") ||
      lowerAnalysis.includes("user interface") ||
      lowerAnalysis.includes("user experience") ||
      lowerAnalysis.includes("ux") ||
      lowerAnalysis.includes("javascript") ||
      lowerAnalysis.includes("typescript") ||
      lowerAnalysis.includes("html") ||
      lowerAnalysis.includes("css") ||
      lowerAnalysis.includes("tailwind") ||
      lowerAnalysis.includes("dashboard") ||
      lowerAnalysis.includes("interface")
    ) {
      skills.push("frontend");
    }

    // Solidity/Smart Contract detection
    if (
      lowerAnalysis.includes("solidity") ||
      lowerAnalysis.includes("smart contract") ||
      lowerAnalysis.includes("erc-20") ||
      lowerAnalysis.includes("erc-721") ||
      lowerAnalysis.includes("erc-1155") ||
      lowerAnalysis.includes("token") ||
      lowerAnalysis.includes("nft") ||
      lowerAnalysis.includes("defi") ||
      lowerAnalysis.includes("blockchain") ||
      lowerAnalysis.includes("ethereum") ||
      lowerAnalysis.includes("evm")
    ) {
      skills.push("solidity");
    }

    // Security/Audit detection
    if (
      lowerAnalysis.includes("security") ||
      lowerAnalysis.includes("audit") ||
      lowerAnalysis.includes("vulnerability") ||
      lowerAnalysis.includes("penetration") ||
      lowerAnalysis.includes("security review") ||
      lowerAnalysis.includes("code review")
    ) {
      skills.push("security");
    }

    // If no skills detected, return empty array (don't default to solidity)
    // This allows the system to properly handle unknown requests
    return skills;
  }

  private async contactSpecialist(
    specialist: AgentCard,
    jobDescription: string
  ): Promise<{ result: string; fullResult?: string; invoice?: any }> {
    console.log(`\n📞 Contacting ${specialist.name}...`);
    console.log(`   Job: ${jobDescription}`);
    console.log(`   Specialization: ${specialist.specialization}`);

    // Try direct method call first (if specialist agents are available)
    if (this.specialistAgents) {
      const specialistAgent = this.specialistAgents.get(specialist.specialization);
      if (specialistAgent) {
        try {
          console.log(`   ✓ Using direct method call`);
          await specialistAgent.initialize();
          const jobResponse = await specialistAgent.processJob(jobDescription);
          console.log(`   ✓ Received response from ${specialist.name}`);
          return {
            result: jobResponse.result,
            fullResult: jobResponse.fullResult,
            invoice: jobResponse.invoice,
          };
        } catch (error) {
          console.error(`   ✗ Direct call failed:`, error);
          // Fall through to HTTP fallback
        }
      }
    }

    // Fallback to HTTP call
    console.log(`   ↻ Using HTTP call to ${specialist.url}`);
    try {
      const response = await fetch(specialist.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job: jobDescription }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`   ✗ HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`Specialist ${specialist.name} returned error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`   Response text (first 200 chars): ${responseText.substring(0, 200)}`);
      
      let jobResponse: { result: string; fullResult?: string; invoice?: any };
      try {
        jobResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`   ✗ JSON Parse Error:`, parseError);
        console.error(`   Response was: ${responseText}`);
        throw new Error(`Invalid JSON response from ${specialist.name}: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}`);
      }

      // Validate response structure
      if (!jobResponse || typeof jobResponse.result !== 'string') {
        console.error(`   ✗ Invalid response structure:`, jobResponse);
        throw new Error(`Invalid response structure from ${specialist.name}`);
      }

      console.log(`   ✓ Received valid response from ${specialist.name}`);
      
      return {
        result: jobResponse.result,
        fullResult: jobResponse.fullResult,
        invoice: jobResponse.invoice,
      };
    } catch (error) {
      console.error(`   ✗ Error contacting ${specialist.name}:`, error);
      console.error(`   Error details:`, error instanceof Error ? error.stack : error);
      
      // Final fallback: generate response locally
      console.log(`   ↻ Falling back to local generation...`);
      const fallbackResponse = await this.generateResponse(
        `As a ${specialist.specialization} specialist, complete this job: ${jobDescription}`,
        `Provide the actual work output, not a job request. You are the specialist doing the work.`
      );
      
      return {
        result: fallbackResponse,
        invoice: {
          amount: specialist.rate,
          currency: specialist.currency || "ETH",
          to: specialist.address || "0x0000000000000000000000000000000000000000",
          description: `${specialist.specialization} work completed`,
        },
      };
    }
  }

  getHiredAgents(): AgentCard[] {
    return Array.from(this.hiredAgents.values());
  }

  clearHiredAgents(): void {
    this.hiredAgents.clear();
  }
}
