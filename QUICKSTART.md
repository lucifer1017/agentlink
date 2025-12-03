# 🚀 AgentLink Quick Start Guide

Welcome to AgentLink Backend! This guide will get you up and running in 5 minutes.

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Create API Key"
3. Copy your API key

## Step 2: Set Up Environment

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and paste your Gemini API key:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

3. Or add it to `wrangler.toml`:
   ```toml
   [vars]
   GEMINI_API_KEY = "your-api-key-here"
   ```

## Step 3: Start the Development Server

```bash
npm run dev
```

You should see:
```
🚀 AgentLink Backend running on http://localhost:8787
```

## Step 4: Test the Workflow

Open a new terminal and try these commands:

### Test 1: Check Health
```bash
curl http://localhost:8787/health
```

### Test 2: Get Registry of Specialists
```bash
curl http://localhost:8787/registry
```

### Test 3: Send a Request to Manager Agent
```bash
curl -X POST http://localhost:8787/manager \
  -H "Content-Type: application/json" \
  -d '{"message": "I need a smart contract for a meme coin"}'
```

### Test 4: Get a Specialist Card
```bash
curl http://localhost:8787/specialist/solidity
```

### Test 5: Full End-to-End Workflow
```bash
curl -X POST http://localhost:8787/process \
  -H "Content-Type: application/json" \
  -d '{"request": "I need a smart contract that creates an ERC-20 token named DOGE with 1 million supply"}'
```

## Understanding the Response

When you send a request, you'll get back something like:

```json
{
  "jobId": "job-001",
  "status": "completed",
  "result": "// Solidity code here...",
  "invoice": {
    "amount": "0.01",
    "currency": "ETH",
    "to": "0x0000000000000000000000000000000000000000",
    "description": "Work completed by 1 specialist(s)"
  }
}
```

## Project Structure

- **Manager Agent**: Reads your request, decides what skills are needed, finds specialists
- **Specialist Agents**: Do the actual work (coding, auditing, etc.)
- **Registry**: Lists all available specialists and their rates
- **Main Server**: Handles HTTP requests and routes them to agents

## Available Specialists

| Specialist | Rate | Capabilities |
|-----------|------|--------------|
| Solidity Coder | 0.01 ETH | ERC-20, NFTs, DeFi contracts |
| Security Auditor | 0.05 ETH | Vulnerability analysis, audits |
| Frontend Dev | 0.02 ETH | React, Web3, Wallet integration |

## Next Steps

1. ✅ Run `npm run dev`
2. ✅ Test with curl commands above
3. ✅ Check console output to see agent reasoning
4. ✅ Integrate with frontend-ui folder
5. ✅ Deploy to Cloudflare Workers with `npm run deploy`

## Troubleshooting

**Error: "GEMINI_API_KEY not set"**
- Make sure you added it to `.env.local` or `wrangler.toml`
- Restart the dev server

**Error: "Cannot find module"**
- Run `npm install` again
- Make sure you're in the `backend-agents` directory

**Agent not responding**
- Check your Gemini API key is valid
- Check internet connection
- Look at console output for error details

## Architecture

```
Frontend User
    ↓
Manager Agent (reads request, finds specialists)
    ↓
Specialist Agent (does the work)
    ↓
Return Code + Invoice
    ↓
Frontend (shows code, user approves payment)
    ↓
Blockchain (payment settlement on Base Sepolia)
```

## What's Happening Under the Hood

1. **Manager receives**: "I need a smart contract for a meme coin"
2. **Manager thinks**: "This needs Solidity expertise"
3. **Manager searches**: Registry finds Solidity Coder (0.01 ETH)
4. **Manager hires**: Sends job to Solidity Coder
5. **Specialist works**: Generates ERC-20 contract code
6. **Specialist invoices**: Returns code + 0.01 ETH invoice
7. **Manager returns**: Result with total cost to frontend
8. **Frontend shows**: Code and "Pay 0.01 ETH" button
9. **User approves**: Signs transaction on Base Sepolia
10. **Payment settles**: Specialist receives ETH ✅

## API Reference

Full API documentation is in `README.md`. Key endpoints:

- `GET /health` - Check if backend is running
- `POST /manager` - Send request to Manager Agent
- `GET /specialist/{type}` - Get specialist info
- `POST /specialist/{type}` - Send job to specialist
- `GET /registry` - List all specialists
- `POST /process` - Full end-to-end workflow

## Customization

### Add a New Specialist Type

1. Edit `/src/registry/registry.json` and add new entry
2. Edit `/src/index.ts` and create new `SpecialistAgent` instance
3. Restart dev server

### Change Rates

Edit `/src/registry/registry.json` and update the `rate` field.

### Add More Capabilities

Edit `/src/agents/SpecialistAgent.ts` and update the capabilities list.

## Questions?

Check the full `README.md` in this directory for more details!

Happy building! 🚀
