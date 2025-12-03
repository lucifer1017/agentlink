# 🤖 AgentLink Backend - NullShot Agent Framework

This is the backend for **AgentLink**, the "Upwork for the Agentic Economy." It's built using the **NullShot Framework** running on **Cloudflare Workers** with **Gemini Flash 1.5** as the LLM.

## Architecture Overview

The backend consists of three main agent types:

### 1. **Manager Agent** 🏢
- Role: Project Manager / Coordinator
- Responsibility: Analyzes user requests, finds specialists, and coordinates work
- Location: `/src/agents/ManagerAgent.ts`

### 2. **Specialist Agents** 🔧
- **Solidity Coder**: Writes smart contracts (Rate: 0.01 ETH)
- **Security Auditor**: Audits contracts for vulnerabilities (Rate: 0.05 ETH)
- **Frontend Developer**: Builds Web3 UIs (Rate: 0.02 ETH)
- Location: `/src/agents/SpecialistAgent.ts`

### 3. **Registry System** 📋
- Discovery layer for finding specialists
- Agent cards contain: name, rate, capabilities, contact URL
- Location: `/src/registry/registry.json`

## Project Structure

```
backend-agents/
├── src/
│   ├── agents/
│   │   ├── BaseAgent.ts          # Abstract base class for all agents
│   │   ├── ManagerAgent.ts       # Manager/coordinator agent
│   │   └── SpecialistAgent.ts    # Specialist agent implementation
│   ├── registry/
│   │   └── registry.json         # Agent discovery registry
│   ├── tools/                    # MCP tools (future)
│   └── index.ts                  # Main server entry point
├── package.json
├── tsconfig.json
├── wrangler.toml                 # Cloudflare Workers config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Google Gemini API key (for Gemini Flash 1.5)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file or add to `wrangler.toml`:
   ```toml
   [vars]
   GEMINI_API_KEY = "your-gemini-api-key-here"
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Running the Backend

### Local Development (Node.js)

```bash
npm run dev
```

This starts a local HTTP server on `http://localhost:8787` that mimics Cloudflare Workers behavior.

### Cloudflare Workers Deployment

```bash
npm run deploy
```

This deploys to Cloudflare Workers and makes your agents available at your Worker's URL.

## API Endpoints

### 1. Health Check
```
GET /health
Response: { status: "ok", endpoints: {...} }
```

### 2. Manager Agent - Process User Request
```
POST /manager
Body: { "message": "I need a smart contract for a meme coin" }
Response: { jobId, status, result, invoice }
```

### 3. Specialist Agents - Get Agent Card
```
GET /specialist/{type}
Example: GET /specialist/solidity
Response: { id, name, role, rate, currency, capabilities, ... }
```

### 4. Specialist Agents - Process Job
```
POST /specialist/{type}
Body: { "job": "Write an ERC-20 token contract named DOGE" }
Response: { jobId, status, result, invoice }
```

### 5. Registry - List All Specialists
```
GET /registry
Response: { specialists: [...] }
```

### 6. End-to-End Workflow
```
POST /process
Body: { "request": "I need a smart contract for a meme coin" }
Response: { jobId, status, result, invoice }
```

## Example Usage

### 1. Start the backend
```bash
npm run dev
```

### 2. Send a request to the Manager Agent

```bash
curl -X POST http://localhost:8787/manager \
  -H "Content-Type: application/json" \
  -d '{"message": "I need a smart contract for a meme coin"}'
```

### 3. The Manager will:
- ✅ Analyze the request
- ✅ Identify required skills (solidity)
- ✅ Find available specialists in the registry
- ✅ Hire the Solidity Coder (0.01 ETH)
- ✅ Send the job request to the specialist
- ✅ Return the result with invoice

### Response Example:
```json
{
  "jobId": "job-001",
  "status": "completed",
  "result": "// ERC-20 Token Contract\npragma solidity ^0.8.0;\n\ncontract DOGE { ... }",
  "invoice": {
    "amount": "0.01",
    "currency": "ETH",
    "to": "0x0000000000000000000000000000000000000000",
    "description": "Work completed by 1 specialist(s)"
  }
}
```

## How the Workflow Works

### 📋 The Request Phase
```
User → Frontend → Manager Agent
"I need a smart contract for a meme coin"
```

### 🤔 The Thought Phase
```
Manager Agent analyzes and determines:
- Skill required: Solidity
- Specialist needed: Coder
```

### 🔍 The Discovery Phase
```
Manager calls: find_worker("solidity")
Registry returns: Solidity Coder's agent card
Price: 0.01 ETH, Contact: http://localhost:8787/specialist/solidity
```

### 💼 The Job Phase
```
Manager → POST /specialist/solidity
Payload: { "job": "Write ERC-20 token named DOGE" }
Specialist processes and returns code
```

### 📄 The Invoice Phase
```
Specialist responds with:
{
  result: "// Smart contract code here",
  invoice: { amount: "0.01", currency: "ETH", to: "0x123..." }
}
```

### 💳 The Settlement Phase
```
Manager → Frontend → Thirdweb SDK
Payment: 0.01 ETH to specialist address on Base Sepolia
Status: Confirmed ✅
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for LLM |
| `MANAGER_AGENT_URL` | No | Manager agent endpoint (default: local) |
| `REGISTRY_URL` | No | Registry endpoint (default: local) |

## Adding New Specialist Types

1. **Create agent card** in `/src/registry/registry.json`:
```json
{
  "id": "specialist-backend",
  "name": "Backend Developer",
  "specialization": "backend",
  "rate": "0.03",
  "currency": "ETH",
  "url": "http://localhost:8787/specialist/backend",
  "capabilities": ["Node.js", "API design", "Database design"]
}
```

2. **Instantiate in** `/src/index.ts`:
```typescript
const backendDev = new SpecialistAgent(
  "backend",
  "0.03",
  GEMINI_API_KEY,
  "http://localhost:8787/specialist/backend"
);
```

3. **Add to handlers** in `handleRequest()`:
```typescript
const agents = {
  solidity: solicityCoder,
  security: securityAuditor,
  frontend: frontendDev,
  backend: backendDev,  // Add this
};
```

## Next Steps

- [ ] Integrate with real Edenlayer for agent discovery
- [ ] Add MCP (Model Context Protocol) tools
- [ ] Implement WebSocket support for real-time job updates
- [ ] Add payment verification with Thirdweb
- [ ] Implement agent-to-agent HTTP calls
- [ ] Add job queuing and persistence
- [ ] Create monitoring and logging
- [ ] Add authentication and authorization

## Troubleshooting

### "GEMINI_API_KEY not set"
- Set the API key in `wrangler.toml` under `[vars]`
- Or set in environment: `export GEMINI_API_KEY=your-key`

### Agent not responding
- Check if the AI SDK is properly installed: `npm install`
- Verify Gemini API key is valid
- Check console logs for errors

### Registry not finding specialists
- Ensure `registry.json` is in `/src/registry/`
- Restart the dev server after changes

## License

MIT - Built with ❤️ for the Agentic Economy

## Resources

- [NullShot Framework](https://github.com/null-shot/typescript-agent-framework)
- [Gemini API](https://ai.google.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Thirdweb SDK](https://thirdweb.com/)
