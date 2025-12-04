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

// Create agents
const managerAgent = new ManagerAgent(GOOGLE_GENERATIVE_AI_API_KEY);

// Specialist agents (these would typically run as separate workers in production)
const solicityCoder = new SpecialistAgent(
  "solidity",
  "0.01",
  GOOGLE_GENERATIVE_AI_API_KEY,
  "http://localhost:8787/specialist/solidity"
);

const securityAuditor = new SpecialistAgent(
  "security",
  "0.05",
  GOOGLE_GENERATIVE_AI_API_KEY,
  "http://localhost:8787/specialist/security"
);

const frontendDev = new SpecialistAgent(
  "frontend",
  "0.02",
  GOOGLE_GENERATIVE_AI_API_KEY,
  "http://localhost:8787/specialist/frontend"
);

// Simple HTTP server for demonstration
async function handleRequest(request: Request): Promise<Response> {
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
        headers: { "Content-Type": "application/json" },
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
          { status: 400, headers: { "Content-Type": "application/json" } }
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

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing manager request:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
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
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Specialist not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
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
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const agent = agents[type];
        if (!agent) {
          return new Response(JSON.stringify({ error: "Specialist not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        await agent.initialize();
        const response = await agent.processJob(jobDescription);

        return new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error processing specialist job:", error);
        return new Response(
          JSON.stringify({
            error:
              error instanceof Error ? error.message : "Internal server error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
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
        headers: { "Content-Type": "application/json" },
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
          { status: 400, headers: { "Content-Type": "application/json" } }
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
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in workflow:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 404
  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
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
