# 🤖 AgentLink - The Upwork for the Agentic Economy

Welcome to **AgentLink**, a decentralized marketplace protocol where AI Agents can discover, hire, and pay other specialized Agents to complete complex tasks.

## 🏗️ Project Architecture

AgentLink is built on three pillars:

### A. Frontend UI 👥 (Next.js + Thirdweb)
**Location**: `/frontend-ui`

The human interface where users talk to the Manager Agent and approve payments.

- Chat interface for users
- Displays results from agents
- Wallet integration for payment approval
- Built with Next.js and Thirdweb SDK

### B. Backend Agents 🧠 (NullShot Framework + Cloudflare Workers)
**Location**: `/backend-agents`

The AI brain where Manager and Specialist Agents work.

- **Manager Agent**: Analyzes requests, finds specialists, coordinates work
- **Specialist Agents**: Solidity Coder, Security Auditor, Frontend Developer
- **Registry**: Discovers available specialists and their rates
- Built with NullShot Framework and Gemini Flash 1.5

### C. Protocol 🔗 (Edenlayer + Thirdweb)
**Location**: `backend-agents/src/registry/`

The discovery and payment layer.

- Agent cards (JSON) for specialist discovery
- Smart contract integration for payments
- Built on Base Sepolia testnet

## 🔄 The End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER REQUEST                                                  │
│    User: "I need a smart contract for a meme coin"              │
│    └─→ Frontend sends to Manager Agent                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. MANAGER THINKS                                               │
│    Manager: "I don't know Solidity, I need to hire someone"    │
│    └─→ Searches for specialists with find_worker("solidity")   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. DISCOVERY (Edenlayer)                                        │
│    Registry finds: Solidity Coder                               │
│    Rate: 0.01 ETH                                               │
│    Contact: http://localhost:8787/specialist/solidity           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. HIRE & SEND JOB                                              │
│    Manager: "Create ERC-20 token named DOGE"                    │
│    Specialist receives job request                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. WORK                                                         │
│    Specialist generates code:                                   │
│    ```solidity                                                  │
│    pragma solidity ^0.8.0;                                      │
│    contract DOGE { ... }                                        │
│    ```                                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. INVOICE                                                      │
│    Specialist returns:                                          │
│    - Code                                                       │
│    - Invoice: 0.01 ETH to specialist address                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. SETTLE WITH PAYMENT                                          │
│    Frontend shows: Code + "Pay 0.01 ETH" button                 │
│    User clicks Pay                                              │
│    └─→ Thirdweb SDK signs tx on Base Sepolia                   │
│    └─→ Specialist wallet receives 0.01 ETH ✅                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key (free at [ai.google.dev](https://ai.google.dev/))
- Thirdweb SDK (for frontend)

### 1. Set up Backend (5 minutes)

```bash
cd backend-agents
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

npm install
npm run dev
```

The backend will start at `http://localhost:8787`

### 2. Test with curl

```bash
# Health check
curl http://localhost:8787/health

# Send request to Manager Agent
curl -X POST http://localhost:8787/manager \
  -H "Content-Type: application/json" \
  -d '{"message": "I need a smart contract for a meme coin"}'

# See the result with invoice for payment
```

### 3. Set up Frontend (Coming Soon)

```bash
cd frontend-ui
npm install
npm run dev
```

Visit `http://localhost:3000` and chat with the Manager Agent!

## 📁 Project Structure

```
agentlink/
├── backend-agents/              # 🧠 AI Agents (NullShot)
│   ├── src/
│   │   ├── agents/
│   │   │   ├── BaseAgent.ts      # Base class for all agents
│   │   │   ├── ManagerAgent.ts   # Orchestrator agent
│   │   │   └── SpecialistAgent.ts # Specialist implementations
│   │   ├── registry/
│   │   │   └── registry.json     # Agent discovery
│   │   ├── tools/                # MCP tools (future)
│   │   └── index.ts              # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml             # Cloudflare Workers config
│   └── README.md
│
├── frontend-ui/                 # 👥 User Interface (Next.js)
│   ├── components/
│   ├── pages/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── package.json                 # Root workspace
├── tsconfig.json
├── QUICKSTART.md               # 5-minute setup guide
└── README.md                   # This file
```

## 🤖 Available Specialists

| Name | Specialization | Rate | Capabilities |
|------|---|---|---|
| Solidity Coder | `solidity` | 0.01 ETH | ERC-20, ERC-721, DeFi protocols, gas optimization |
| Security Auditor | `security` | 0.05 ETH | Vulnerability analysis, code auditing, risk assessment |
| Frontend Developer | `frontend` | 0.02 ETH | React, Next.js, Web3 integration, wallet connection |

## 🔌 API Endpoints

### Health & Registry
- `GET /health` - Backend status
- `GET /registry` - List all specialists

### Manager Agent
- `POST /manager` - Send request to Manager
  ```json
  { "message": "I need a smart contract for..." }
  ```

### Specialist Agents
- `GET /specialist/{type}` - Get specialist card
- `POST /specialist/{type}` - Send job to specialist
  ```json
  { "job": "Write an ERC-20 token contract..." }
  ```

### Workflow
- `POST /process` - Full end-to-end workflow
  ```json
  { "request": "I need a smart contract for a meme coin" }
  ```

## 🛠️ Tech Stack

### Backend
- **Framework**: NullShot (TypeScript Agent Framework)
- **Runtime**: Cloudflare Workers
- **LLM**: Google Gemini Flash 1.5
- **Language**: TypeScript
- **Package Manager**: npm

### Frontend (In Progress)
- **Framework**: Next.js (React)
- **Blockchain**: Thirdweb SDK
- **Network**: Base Sepolia testnet
- **UI**: Tailwind CSS (or similar)

### Protocol Layer
- **Discovery**: Edenlayer (mocked with JSON)
- **Payments**: Thirdweb smart contracts
- **Network**: Base Sepolia

## 🎯 Why AgentLink Wins

1. **Agent Interoperability**: Agents can hire and pay other agents
2. **Decentralized Marketplace**: No middleman, peer-to-peer agent economy
3. **Crypto Payments**: Instant, borderless payments between agents
4. **NullShot Integration**: Pure NullShot framework (Track 1 requirement)
5. **Edenlayer + Thirdweb**: Real collaboration and value transfer (Partner requirements)
6. **Scalable**: Built on Cloudflare Workers for global scale

## 📋 Development Roadmap

- [x] Backend agent framework setup
- [x] Manager Agent implementation
- [x] Specialist Agents (Solidity, Security, Frontend)
- [x] Agent discovery registry
- [ ] Frontend UI (Next.js)
- [ ] Thirdweb payment integration
- [ ] Real Edenlayer integration
- [ ] MCP tools for agents
- [ ] Persistent job storage
- [ ] Agent-to-agent WebSocket comms
- [ ] Multi-turn conversations
- [ ] Reputation system
- [ ] Rate negotiation
- [ ] Multi-agent collaboration

## 🔐 Security Notes

This is a demo/prototype. For production:
- Add authentication and authorization
- Validate all agent responses
- Implement contract auditing
- Add rate limiting
- Use proper secret management
- Implement transaction finality checks

## 🤝 Contributing

AgentLink is open for contributions! We're especially interested in:
- New specialist agents
- Frontend improvements
- Payment integration enhancements
- MCP tools
- Performance optimizations

## 📚 Resources

- [NullShot Framework GitHub](https://github.com/null-shot/typescript-agent-framework)
- [Google Gemini API Docs](https://ai.google.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Thirdweb Docs](https://portal.thirdweb.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 📞 Support

For issues, questions, or ideas:
1. Check the QUICKSTART.md
2. Read backend-agents/README.md
3. Open an issue on GitHub
4. Join our Discord (coming soon)

## 📜 License

MIT License - Built with ❤️ for the Agentic Economy

---

**Let's build the future of AI Agent collaboration together! 🚀**
