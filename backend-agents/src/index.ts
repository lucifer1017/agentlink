import { ManagerAgent } from "./agents/ManagerAgent";
import { SpecialistAgent } from "./agents/SpecialistAgent";

// Initialize agents with API key from environment
// With nodejs_compat_populate_process_env, secrets are available via process.env
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn(
    "⚠️  GOOGLE_GENERATIVE_AI_API_KEY not set. Set it with: npx wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY"
  );
}

// Get base URL from environment (for Cloudflare Workers) or use localhost for local dev
const BASE_URL = process.env.BASE_URL || "http://localhost:8787";

// Create specialist agents map for direct calls
const specialistAgentsMap = new Map<string, SpecialistAgent>();

// Create agents
const managerAgent = new ManagerAgent(GOOGLE_GENERATIVE_AI_API_KEY, specialistAgentsMap);

// Specialist agents (these would typically run as separate workers in production)
const solicityCoder = new SpecialistAgent(
  "solidity",
  "0.0006",
  GOOGLE_GENERATIVE_AI_API_KEY,
  `${BASE_URL}/specialist/solidity`,
  "0xef1562c87973f9013721c37d3af26d6c9baf6ee3"
);

const securityAuditor = new SpecialistAgent(
  "security",
  "0.0008",
  GOOGLE_GENERATIVE_AI_API_KEY,
  `${BASE_URL}/specialist/security`,
  "0x68031f3974f6fbe580b607ffd1435b669ac190ff"
);

const frontendDev = new SpecialistAgent(
  "frontend",
  "0.0007",
  GOOGLE_GENERATIVE_AI_API_KEY,
  `${BASE_URL}/specialist/frontend`,
  "0xd91f1c11e7f6d0d4df5f8da3d2193c34f5cf216c"
);

// Add specialists to map for direct Manager calls
specialistAgentsMap.set("solidity", solicityCoder);
specialistAgentsMap.set("security", securityAuditor);
specialistAgentsMap.set("frontend", frontendDev);

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Simple HTTP server for demonstration
async function handleRequest(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Initialize managers on first request
  if (pathname === "/" || pathname === "/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "AgentLink Backend is running",
        endpoints: {
          manager: "/manager",
          specialist: "/specialist/:type",
          registry: "/registry",
          process: "/process",
        },
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Manager Agent endpoint
  if (pathname === "/manager" && request.method === "POST") {
    try {
      const body = await request.json() as { message: string };
      const userInput = body.message;

      if (!userInput) {
        return new Response(
          JSON.stringify({ error: "Missing 'message' field" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`\n${"=".repeat(60)}`);
      console.log(`📨 Incoming request to Manager Agent`);
      console.log(`${"=".repeat(60)}`);

      await managerAgent.initialize();
      const response = await managerAgent.processUserRequest(userInput);

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ Request processed`);
      console.log(`${"=".repeat(60)}\n`);

      // Ensure response is valid and can be serialized
      let responseJson: string;
      try {
        // Validate response structure
        if (!response || typeof response !== 'object') {
          throw new Error("Invalid response structure from Manager Agent");
        }
        
        // Sanitize response to ensure all fields are JSON-serializable
        const sanitizedResponse: any = {
          jobId: response.jobId || "job-001",
          status: response.status || "completed",
          result: response.result ? String(response.result) : "",
        };
        
        // Add fullResult if it exists
        if (response.fullResult) {
          sanitizedResponse.fullResult = String(response.fullResult);
        }
        
        // Add invoice if it exists
        if (response.invoice) {
          sanitizedResponse.invoice = {
            amount: String(response.invoice.amount || "0"),
            currency: String(response.invoice.currency || "ETH"),
            to: String(response.invoice.to || ""),
            description: String(response.invoice.description || ""),
          };
          
          // Add breakdown if it exists
          if (response.invoice.breakdown && Array.isArray(response.invoice.breakdown)) {
            sanitizedResponse.invoice.breakdown = response.invoice.breakdown.map((item: any) => ({
              specialist: String(item.specialist || ""),
              amount: String(item.amount || "0"),
              address: String(item.address || ""),
            }));
          }
        }
        
        // Add priceComparison if it exists
        if (response.priceComparison) {
          sanitizedResponse.priceComparison = {
            specialization: String(response.priceComparison.specialization || ""),
            options: (response.priceComparison.options || []).map((opt: any) => ({
              name: String(opt.name || ""),
              rate: String(opt.rate || ""),
              address: String(opt.address || ""),
            })),
            selected: {
              name: String(response.priceComparison.selected?.name || ""),
              rate: String(response.priceComparison.selected?.rate || ""),
              address: String(response.priceComparison.selected?.address || ""),
            },
          };
        }
        
        responseJson = JSON.stringify(sanitizedResponse);
        
        // Validate JSON can be parsed back
        const parsed = JSON.parse(responseJson);
        if (!parsed.result) {
          throw new Error("Response missing required 'result' field after sanitization");
        }
      } catch (jsonError) {
        console.error("Error serializing response:", jsonError);
        console.error("Response object:", response);
        return new Response(
          JSON.stringify({
            jobId: "job-error",
            status: "failed",
            result: `Error serializing response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`,
          }),
          {
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      return new Response(responseJson, {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error("Error processing manager request:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }

  // Specialist endpoint
  if (pathname.startsWith("/specialist/")) {
    const type = pathname.split("/")[2];
    const agents: { [key: string]: SpecialistAgent } = {
      solidity: solicityCoder,
      security: securityAuditor,
      frontend: frontendDev,
    };

    if (request.method === "GET") {
      // Return agent card
      const agent = agents[type];
      if (agent) {
        return new Response(JSON.stringify(agent.getAgentCard()), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ error: "Specialist not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (request.method === "POST") {
      // Process job
      try {
        const body = await request.json() as { job: string };
        const jobDescription = body.job;

        if (!jobDescription) {
          return new Response(
            JSON.stringify({ error: "Missing 'job' field" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const agent = agents[type];
        if (!agent) {
          return new Response(JSON.stringify({ error: "Specialist not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        await agent.initialize();
        const response = await agent.processJob(jobDescription);

        return new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (error) {
        console.error("Error processing specialist job:", error);
        return new Response(
          JSON.stringify({
            error:
              error instanceof Error ? error.message : "Internal server error",
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }
  }

  // Registry endpoint
  if (pathname === "/registry" && request.method === "GET") {
    return new Response(
      JSON.stringify({
        specialists: [
          solicityCoder.getAgentCard(),
          securityAuditor.getAgentCard(),
          frontendDev.getAgentCard(),
        ],
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  // Demo endpoint that shows the full workflow
  if (pathname === "/process" && request.method === "POST") {
    try {
      const body = await request.json() as { request: string };
      const userRequest = body.request;

      if (!userRequest) {
        return new Response(
          JSON.stringify({ error: "Missing 'request' field" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 AgentLink End-to-End Workflow`);
      console.log(`${"=".repeat(60)}`);

      await managerAgent.initialize();
      const result = await managerAgent.processUserRequest(userRequest);

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ Workflow Complete`);
      console.log(`${"=".repeat(60)}\n`);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (error) {
      console.error("Error in workflow:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }

  // 404
  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Export for Cloudflare Workers (module syntax)
export default {
  async fetch(request: any, env: any, ctx: any) {
    return await handleRequest(request);
  }
};

// For Node.js development server
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const PORT = 8787;
  const http = await import("http");

  http.createServer(async (req: any, res: any) => {
    try {
      const response = await handleRequest(
        new Request(`http://localhost:${PORT}${req.url}`, {
          method: req.method,
          body:
            req.method === "POST"
              ? await new Promise((resolve) => {
                  let data = "";
                  req.on("data", (chunk: string) => (data += chunk));
                  req.on("end", () => resolve(data || undefined));
                })
              : undefined,
        })
      );

      res.writeHead(response.status, {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      });
      res.end(await response.text());
    } catch (error) {
      console.error("Server error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }).listen(PORT);

  console.log(`🚀 AgentLink Backend running on http://localhost:${PORT}`);
}
