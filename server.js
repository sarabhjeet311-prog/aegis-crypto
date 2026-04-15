require('dotenv').config();
require('ts-node/register/transpile-only');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { ethers } = require('ethers');

// Import AEGIS analysis modules
const { analyzeAddress } = require('./lib/analyze');
const { updateLeaderboard } = require('./lib/leaderboard.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/lib', express.static('lib'));

// ============================================
// AEGIS Score Calculation Engine
// ============================================
function calculateAEGISScore(tokenData, securityData) {
    let score = 100;
    const flags = [];
    const pair = tokenData?.pair || tokenData;
    const security = securityData || {};

    // Critical security checks
    if (security.is_honeypot === "1" || security.is_honeypot === true) {
        score -= 60;
        flags.push({ type: 'critical', message: 'Honeypot Detected', severity: 'critical' });
    }

    if (security.is_blacklisted === "1" || security.is_blacklisted === true) {
        score -= 30;
        flags.push({ type: 'critical', message: 'Blacklisted Contract', severity: 'critical' });
    }

    if (security.is_mintable === "1" || security.is_mintable === true) {
        score -= 15;
        flags.push({ type: 'warning', message: 'Mintable Token', severity: 'warning' });
    }

    if (security.is_proxy === "1" || security.is_proxy === true) {
        score -= 10;
        flags.push({ type: 'warning', message: 'Proxy Contract', severity: 'warning' });
    }

    // Liquidity checks
    const liquidity = pair?.liquidity?.usd || tokenData?.liquidity?.usd || 0;
    if (liquidity < 1000) {
        score -= 25;
        flags.push({ type: 'critical', message: 'Extremely Low Liquidity (<$1K)', severity: 'critical' });
    } else if (liquidity < 10000) {
        score -= 20;
        flags.push({ type: 'warning', message: 'Low Liquidity (<$10K)', severity: 'warning' });
    } else if (liquidity < 50000) {
        score -= 10;
        flags.push({ type: 'info', message: 'Moderate Liquidity (<$50K)', severity: 'info' });
    } else if (liquidity > 1000000) {
        score += 5;
    }

    // Volume checks
    const volume24h = pair?.volume?.h24 || tokenData?.volume?.h24 || 0;
    if (volume24h > 1000000) {
        score += 10;
    } else if (volume24h > 100000) {
        score += 5;
    }

    // Age checks
    const age = pair?.fdv || tokenData?.age || 0;
    if (age && age < 3600) {
        score -= 15;
        flags.push({ type: 'warning', message: 'Very New Token (<1 hour)', severity: 'warning' });
    }

    // Holder distribution
    if (security.holder_count !== undefined) {
        const holders = parseInt(security.holder_count);
        if (holders < 10) {
            score -= 20;
            flags.push({ type: 'critical', message: 'Very Few Holders (<10)', severity: 'critical' });
        } else if (holders < 50) {
            score -= 10;
            flags.push({ type: 'warning', message: 'Low Holder Count (<50)', severity: 'warning' });
        }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let riskLevel, riskColor;
    if (score >= 80) {
        riskLevel = 'SAFE';
        riskColor = '#14F195';
    } else if (score >= 50) {
        riskLevel = 'CAUTION';
        riskColor = '#F3BA2F';
    } else {
        riskLevel = 'HIGH RISK';
        riskColor = '#FF3B30';
    }

    return {
        score,
        riskLevel,
        riskColor,
        flags,
        liquidity,
        volume24h,
        timestamp: Date.now()
    };
}

// ============================================
// Mock Data for Demo Mode
// ============================================
const mockAlerts = [
    { id: 1, type: 'whale', message: '🐋 Whale Movement: 2,500 ETH ($8.2M) transferred to unknown wallet', time: '2 min ago', severity: 'high' },
    { id: 2, type: 'honeypot', message: '⚠️ Honeypot Detected: $SCAM token flagged - 847 wallets affected', time: '5 min ago', severity: 'critical' },
    { id: 3, type: 'liquidity', message: '💧 Liquidity Removed: $MOON token - $420K pulled from Uniswap', time: '8 min ago', severity: 'high' },
    { id: 4, type: 'contract', message: '🔒 Contract Renounced: $SAFE token ownership renounced', time: '12 min ago', severity: 'low' },
    { id: 5, type: 'whale', message: '🐋 Smart Money Alert: Known profitable wallet accumulating $AEGIS', time: '15 min ago', severity: 'medium' },
    { id: 6, type: 'blacklist', message: '🚫 Blacklisted: $RUG contract added to threat database', time: '18 min ago', severity: 'critical' },
    { id: 7, type: 'volume', message: '📈 Volume Spike: $PUMP token +340% volume in last hour', time: '22 min ago', severity: 'medium' },
    { id: 8, type: 'audit', message: '✅ Audit Complete: $LEGIT token passed security audit', time: '30 min ago', severity: 'low' }
];

const mockTrendingTokens = [
    { name: 'AEGIS', symbol: 'AEGIS', price: 0.0847, volume24h: 2450000, change24h: 12.4, riskScore: 92 },
    { name: 'Ethereum', symbol: 'ETH', price: 3280.50, volume24h: 15800000000, change24h: 2.1, riskScore: 98 },
    { name: 'Pepe', symbol: 'PEPE', price: 0.00000782, volume24h: 890000000, change24h: -5.2, riskScore: 65 },
    { name: 'Arbitrum', symbol: 'ARB', price: 1.89, volume24h: 450000000, change24h: 8.7, riskScore: 88 },
    { name: 'SafeMoon V2', symbol: 'SFM', price: 0.00012, volume24h: 1200000, change24h: -2.3, riskScore: 34 }
];

const mockNews = [
    { title: 'AI-Powered Security Protocols See 300% Adoption Increase', source: 'CoinDesk', time: '2 hours ago', url: '#' },
    { title: 'New Honeypot Scheme Targets DeFi Users Across Multiple Chains', source: 'The Block', time: '4 hours ago', url: '#' },
    { title: 'Whale Wallets Move $2.3B in Preparation for Market Shift', source: 'Cointelegraph', time: '6 hours ago', url: '#' },
    { title: 'Smart Contract Auditing Firms Report Record Demand', source: 'Decrypt', time: '8 hours ago', url: '#' }
];

// ============================================
// API Routes
// ============================================

// Token Scanner Endpoint
app.get('/api/scan/:address', async (req, res) => {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid Ethereum address format'
        });
    }

    try {
        // Use AEGIS analysis engine
        const result = await analyzeAddress(address);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Token not found or analysis failed'
            });
        }

        // Update leaderboard
        updateLeaderboard({
            name: result.name,
            symbol: result.symbol,
            logo: result.logo,
            aegisScore: result.aegisScore
        });

        res.json({
            success: true,
            address,
            ...result
        });

    } catch (error) {
        console.error('Scan error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Scan failed',
            message: error.message
        });
    }
});

// Leaderboard Endpoint
app.get('/api/leaderboard', (req, res) => {
    try {
        const { getLeaderboard } = require('./lib/leaderboard.js');
        const leaderboard = getLeaderboard();
        res.json({
            success: true,
            leaderboard,
            lastUpdated: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Leaderboard fetch failed',
            message: error.message
        });
    }
});

// Wallet Analysis Endpoint
app.get('/api/wallet/:address', async (req, res) => {
    const { address } = req.params;

    try {
        // Demo wallet data
        const hashValue = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        res.json({
            success: true,
            address,
            wallet: {
                txCount: hashValue % 500 + 50,
                firstTx: Date.now() - (hashValue % 365) * 86400000,
                lastTx: Date.now() - (hashValue % 24) * 3600000,
                ethBalance: (hashValue % 100 / 10).toFixed(4),
                tokenCount: hashValue % 20 + 3,
                nftCount: hashValue % 50,
                riskScore: 70 + (hashValue % 30),
                labels: hashValue % 3 === 0 ? ['Smart Money', 'Early Adopter'] : ['Active Trader']
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Wallet analysis failed',
            message: error.message
        });
    }
});

// VIP Access Check
app.get('/api/check-vip/:address', async (req, res) => {
    const { address } = req.params;
    const threshold = parseInt(process.env.VIP_THRESHOLD) || 40000;

    try {
        // Demo VIP check - in production, this would query actual token balance
        const hashValue = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const balance = hashValue % 100000;
        const isVIP = balance >= threshold;

        res.json({
            success: true,
            address,
            isVIP,
            balance,
            threshold,
            required: threshold - balance > 0 ? threshold - balance : 0
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'VIP check failed',
            message: error.message
        });
    }
});

// Live Alerts Endpoint
app.get('/api/alerts', (req, res) => {
    // Shuffle and return alerts
    const shuffled = [...mockAlerts].sort(() => Math.random() - 0.5);
    res.json({
        success: true,
        alerts: shuffled.slice(0, 8),
        count: shuffled.length,
        lastUpdated: Date.now()
    });
});

// Trending Tokens Endpoint
app.get('/api/trending', (req, res) => {
    res.json({
        success: true,
        tokens: mockTrendingTokens,
        lastUpdated: Date.now()
    });
});

// News Endpoint
app.get('/api/news', async (req, res) => {
    try {
        if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'demo') {
            const response = await axios.get(
                `https://newsapi.org/v2/everything?q=crypto+security+OR+blockchain+threat&apiKey=${process.env.NEWS_API_KEY}&language=en&sortBy=publishedAt&pageSize=10`
            );
            res.json({
                success: true,
                articles: response.data.articles.slice(0, 6),
                lastUpdated: Date.now()
            });
        } else {
            res.json({
                success: true,
                articles: mockNews,
                lastUpdated: Date.now()
            });
        }
    } catch (error) {
        res.json({
            success: true,
            articles: mockNews,
            lastUpdated: Date.now()
        });
    }
});

// Stats Endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            threatsNeutralized: 12847 + Math.floor(Math.random() * 100),
            walletsMonitored: 284521 + Math.floor(Math.random() * 1000),
            contractsFlagged: 3421 + Math.floor(Math.random() * 50),
            aiConfidence: 94.7 + (Math.random() * 2 - 1),
            activeScans: Math.floor(Math.random() * 50) + 20
        }
    });
});

// ============================================
// New Real API Endpoints
// ============================================

// Check if address is wallet
app.get('/api/check-wallet/:address', async (req, res) => {
    const { address } = req.params;
    const apiKey = process.env.ETHERSCAN_API_KEY;

    if (!apiKey || apiKey === 'YourApiKeyToken') {
        return res.json({ isWallet: Math.random() > 0.5 }); // Fallback
    }

    try {
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc&apikey=${apiKey}`);
        const isWallet = response.data.status === '1' && response.data.result && response.data.result.length > 0;
        res.json({ isWallet });
    } catch (error) {
        res.json({ isWallet: Math.random() > 0.5 }); // Fallback
    }
});

// Get token contract from name
app.get('/api/token-search/:name', async (req, res) => {
    const { name } = req.params;

    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(name)}`);
        const data = response.data;

        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            res.json({
                success: true,
                contract: pair.baseToken.address,
                name: pair.baseToken.name,
                symbol: pair.baseToken.symbol
            });
        } else {
            res.json({ success: false, error: 'Token not found' });
        }
    } catch (error) {
        res.json({ success: false, error: 'API error' });
    }
});

// Get token data
app.get('/api/token-data/:contract', async (req, res) => {
    const { contract } = req.params;

    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${contract}`);
        const data = response.data;

        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            res.json({
                success: true,
                price: parseFloat(pair.priceUsd) || 0,
                liquidity: parseFloat(pair.liquidity?.usd) || 0,
                marketCap: parseFloat(pair.fdv) || 0,
                volume24h: parseFloat(pair.volume?.h24) || 0,
                buys: pair.txns?.h24?.buys || 0,
                sells: pair.txns?.h24?.sells || 0
            });
        } else {
            res.json({ success: false, error: 'Token data not found' });
        }
    } catch (error) {
        res.json({ success: false, error: 'API error' });
    }
});

// Get wallet data
app.get('/api/wallet-data/:address', async (req, res) => {
    const { address } = req.params;
    const apiKey = process.env.ETHERSCAN_API_KEY;

    if (!apiKey || apiKey === 'YourApiKeyToken') {
        return res.json({
            success: true,
            balance: Math.random() * 10,
            transactions: Math.floor(Math.random() * 1000) + 50
        }); // Fallback
    }

    try {
        // Get balance
        const balanceResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`);
        const balance = balanceResponse.data.result ? parseFloat(balanceResponse.data.result) / 1e18 : 0;

        // Get transactions
        const txResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`);
        const transactions = txResponse.data.result ? txResponse.data.result.length : 0;

        res.json({
            success: true,
            balance,
            transactions
        });
    } catch (error) {
        res.json({
            success: true,
            balance: Math.random() * 10,
            transactions: Math.floor(Math.random() * 1000) + 50
        }); // Fallback
    }
});

// ============================================
// Serve Frontend
// ============================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
    console.log(`\n🔥 AEGIS AI Shield running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Web: http://localhost:${PORT}\n`);
});