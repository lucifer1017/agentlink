# 📝 AgentLink Hackathon - Today's Tasks

## 🎯 Right Now: Complete These 3 Things

### TASK 1: Deploy to Cloudflare (15 min)

**Why:** Judges want to see a working live demo

**Steps:**
```bash
cd backend-agents

# Add your Gemini API key to wrangler.toml
# Open wrangler.toml and make sure you have:
# [vars]
# GEMINI_API_KEY = "your-actual-api-key"

# Deploy
npm run deploy

# Copy your deployment URL - you'll need this!
# It will be: https://agentlink-backend.YOUR_NAME.workers.dev
```

**Test it:**
```bash
# Replace YOUR_URL with your actual URL
curl https://YOUR_URL/health
```

✅ **DONE when:** You get a working response from the live URL

---

### TASK 2: Update README for Judges (10 min)

**Why:** First thing judges will see - must explain NullShot usage

**Steps:**

1. Open `README.md` (the root one in agentlink folder)
2. Add this section right after the title and before the current content:

```markdown
## 🏆 NullShot Hacks Season 0 - Track 1a Submission

**AgentLink** is submitted to the **NullShot Hacks Season 0** hackathon, Track 1a.

### Quick Summary
AgentLink solves the agent isolation problem with a decentralized marketplace where:
- Managers can hire specialized agents (Solidity, Security, Frontend)
- Agents discover each other via a registry
- Payment settles on blockchain
- Built entirely with **NullShot Framework** (Cloudflare Workers + Gemini Flash 1.5)

### Try It Live
```bash
curl https://agentlink-backend.YOUR_NAME.workers.dev/health
```

[Rest of README continues...]
```

✅ **DONE when:** README shows NullShot hackathon submission info

---

### TASK 3: Prepare Demo Script (15 min)

**Why:** You need to know exactly what to record

**Create file:** `DEMO_SCRIPT.txt`

**Copy this into it:**

```
=== AGENTLINK DEMO SCRIPT ===

[0:00-0:30] INTRO
"This is AgentLink, a decentralized marketplace for AI agents, built entirely 
with the NullShot Framework.

Today's problem: AI agents are isolated. A Coder Agent can't hire a Security Agent.

AgentLink fixes this by creating a marketplace where agents discover, hire, and 
pay each other. Let me show you how it works."

[0:30-1:30] MANAGER AGENT
"I'm sending a request to the Manager Agent: 'I need a smart contract for a meme coin'

The Manager analyzes this request... 

(Show terminal output)

It determines this needs Solidity expertise and searches the agent registry.

The registry has agent cards listing their specialization, rate, and capabilities."

[1:30-2:00] DISCOVERY
"Found it! The Solidity Specialist:
- Specialization: Solidity smart contracts
- Rate: 0.01 ETH per job
- Capabilities: ERC-20, ERC-721, DeFi, optimization

The Manager immediately hires this specialist and sends the job."

[2:00-3:00] EXECUTION
"The Solidity Specialist receives the job request. 

Using Gemini Flash 1.5 AI, it generates a production-ready ERC-20 contract:

(Show the code being generated)

It also generates an invoice: 0.01 ETH for this work.

The Manager aggregates the results and returns:
- The smart contract code
- Invoice details
- Agent information"

[3:00-3:30] RESULTS
"The Manager sends everything back to the frontend where the user can:
- Review the contract code
- See the invoice (0.01 ETH)
- Click 'Pay' to approve the transaction
- Payment settles on Base Sepolia blockchain via Thirdweb"

[3:30-4:00] TECH
"Built with:
- NullShot Framework (Cloudflare Workers)
- Google Gemini Flash 1.5
- TypeScript (100% type-safe)
- Thirdweb for payments

Production-ready with zero compilation errors and full documentation."

[4:00-4:10] CLOSING
"This is how the agentic economy will work - agents discovering, hiring, and 
paying each other.

AgentLink is the first implementation of this marketplace.

Built with NullShot."
```

✅ **DONE when:** You have the script ready to read while recording

---

## 📋 Quick Verification

Before moving forward, verify:

- [ ] Gemini API key working (test locally first)
- [ ] Backend deploys without errors
- [ ] Live URL responds to `/health` endpoint
- [ ] README mentions hackathon
- [ ] Demo script is written

---

## ⏭️ Next Steps (This Week)

1. **Record Demo Video** (1 hour)
   - Use OBS Studio (free) or Loom
   - Show 2 terminals (dev + curl requests)
   - Narrate using your script
   - Upload to YouTube (unlisted)

2. **Write Project Description**
   - Use content from HACKATHON_SUBMISSION.md
   - Make it compelling for judges
   - Highlight NullShot framework usage

3. **Submit to NullShot**
   - Go to nullshot.ai/brainstorm
   - Fill out submission form
   - Add "Nullshot Hacks S0" tag
   - Submit!

---

## 💡 Key Points for Judges

Make sure your demo shows:

✅ **NullShot Framework** - Mention Cloudflare Workers + Gemini explicitly
✅ **Working Code** - Show actual agent reasoning in console
✅ **Innovation** - Explain agent discovery & hiring
✅ **Blockchain** - Show payment flow (even if mocked)
✅ **Professional** - Code is clean, documented, type-safe

---

## 🎬 Recording Tips

**What You'll Need:**
- OBS Studio (free, Google "OBS Studio download")
- 2 Terminal windows
- Text editor showing code
- ~15 minute recording time (edit down to 4 min)

**Setup:**
1. Open terminal 1: Show dev server or curl requests
2. Open terminal 2: Send test requests
3. Open text editor: Show ManagerAgent.ts code
4. Open web browser: Show live URL
5. Record everything + narrate

**Don't:**
- ❌ Read directly from script (too robotic)
- ❌ Go too fast (viewers can't follow)
- ❌ Show errors (test before recording)
- ❌ Make it too long (under 5 minutes)

**Do:**
- ✅ Speak naturally
- ✅ Explain what you're doing
- ✅ Show agent reasoning
- ✅ Keep pace steady

---

## 🏆 Remember

You're competing for **$5,000** in a hackathon with:
- Official support from NullShot
- Official support from Edenlayer  
- Official support from Thirdweb
- Only 4 winners in your track

Your advantages:
- ✅ Complete working code
- ✅ Production-ready (zero errors)
- ✅ Novel concept (agent marketplace)
- ✅ Strong NullShot integration

All you need to do:
1. Deploy live ✅ Today
2. Record demo ✅ This week
3. Submit ✅ Next week

**Let's go! 🚀**
