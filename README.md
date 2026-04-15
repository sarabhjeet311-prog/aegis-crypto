# 🛡️ AEGIS AI Shield

**The Divine Shield of Wealth**

AI-powered crypto threat intelligence and autonomous asset protection platform.

## Features

- 🔍 **Token Scanner** - Scan any ERC-20 token for security risks
- 💼 **Wallet Analysis** - Analyze wallet behavior and risk patterns
- 🚨 **Live Threat Feed** - Real-time alerts for honeypots, rugs, and exploits
- 📊 **AEGIS Score** - Proprietary 0-100 security scoring algorithm
- 🔒 **VIP Access** - Token-gated premium features (40,000 AEGIS required)
- 🤖 **Telegram Bot** - Command terminal for on-the-go intelligence

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment (copy .env.example to .env and add your API keys)
cp .env.example .env

# Start the server
npm start

# Start the Telegram bot (optional)
npm run bot
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ALCHEMY_API_KEY` | Alchemy API key for blockchain data |
| `ETHERSCAN_API_KEY` | Etherscan API key |
| `GOPLUS_API_KEY` | GoPlus Security API key |
| `NEWS_API_KEY` | NewsAPI key for crypto news |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `PORT` | Server port (default: 3000) |
| `VIP_THRESHOLD` | AEGIS tokens required for VIP (default: 40000) |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/scan/:address` | Scan token or wallet address |
| `GET /api/wallet/:address` | Full wallet analysis |
| `GET /api/check-vip/:address` | Check VIP access status |
| `GET /api/alerts` | Get live threat alerts |
| `GET /api/trending` | Get trending tokens |
| `GET /api/news` | Get crypto security news |
| `GET /api/stats` | Get system statistics |

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and menu |
| `/scan [address]` | Full security scan |
| `/score [address]` | Quick AEGIS Score |
| `/wallet [address]` | Wallet analysis |
| `/alerts` | Latest threat alerts |
| `/vip [address]` | Check VIP status |
| `/whale` | Whale movement alerts |
| `/stats` | System statistics |
| `/help` | Help message |

## AEGIS Score Algorithm

The AEGIS Score (0-100) is calculated based on:

- **Honeypot Detection** (-60 points)
- **Blacklist Status** (-30 points)
- **Mintable Token** (-15 points)
- **Proxy Contract** (-10 points)
- **Low Liquidity** (-10 to -25 points)
- **High Volume** (+5 to +10 points)
- **Holder Distribution** (-10 to -20 points)

### Risk Levels

- **80-100**: ✅ SAFE
- **50-79**: ⚠️ CAUTION
- **0-49**: 🚨 HIGH RISK

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JS, TailwindCSS
- **Blockchain**: ethers.js
- **Security APIs**: GoPlus, Dexscreener
- **Bot**: node-telegram-bot-api

## Design Philosophy

Inspired by Ethereum.org's clean, authoritative design:

- Minimalist layout with high information clarity
- Clean typography (Inter font)
- No cheap marketing elements
- Spacious sections with clear hierarchy
- Emotions: Trust, Control, Exclusivity, Intelligence, Power

## Team

- **Kenji Tanaka** - CEO & Founder (Tokyo Lab)
- **Fatima Al-Mansoori** - Lead Designer (Dubai HQ)
- **Hiroshi Nakamura** - Head of Security

## License

MIT License

---

> *"Most react to the market. A few see it before it moves. AEGIS was built for the latter."*

> *"Access is not purchased. It is held."*