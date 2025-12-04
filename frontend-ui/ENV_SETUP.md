# Environment Variables Setup

Create a `.env.local` file in the `frontend-ui` directory with the following variables:

```env
# Thirdweb Client ID
# Get this from: https://thirdweb.com/dashboard
# 1. Sign in to Thirdweb Dashboard
# 2. Go to Projects
# 3. Create a new project or select existing one
# 4. Add "localhost" to allowed domains
# 5. Copy your Client ID and paste it below
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here

# Backend API URL (optional - defaults to localhost)
# For local development: http://localhost:8787
# For production: your Cloudflare Workers URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

## Required Variables

### `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` (Required)
- **Purpose**: Thirdweb client ID for wallet and payment functionality
- **How to get**: 
  1. Visit https://thirdweb.com/dashboard
  2. Sign in or create account
  3. Click "Projects" → Create new project or select existing
  4. Add `localhost` to allowed domains
  5. Copy the Client ID from the project settings
- **Example**: `NEXT_PUBLIC_THIRDWEB_CLIENT_ID=abc123def456...`

## Optional Variables

### `NEXT_PUBLIC_BACKEND_URL` (Optional)
- **Purpose**: Backend API endpoint URL
- **Default**: `http://localhost:8787` (if not set)
- **Production**: Your Cloudflare Workers URL (e.g., `https://agentlink-backend.agentlink.workers.dev`)
- **Example**: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8787`

## Notes

- All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never commit `.env.local` to version control (it's in .gitignore)
- Restart the Next.js dev server after changing environment variables


