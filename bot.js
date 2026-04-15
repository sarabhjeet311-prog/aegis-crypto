require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN || TOKEN === 'demo') {
    console.log('⚠️  Telegram Bot: Demo mode (set TELEGRAM_BOT_TOKEN to enable)');
    // Create a demo bot that explains setup
    console.log('\n📡 AEGIS Telegram Bot Setup:');
    console.log('1. Get bot token from @BotFather on Telegram');
    console.log('2. Add TELEGRAM_BOT_TOKEN=your_token to .env');
    console.log('3. Run: node bot.js\n');
}

const bot = TOKEN && TOKEN !== 'demo' ? new TelegramBot(TOKEN, { polling: true }) : null;

// ============================================
// AEGIS Score Calculation (same as server)
// ============================================
function calculateAEGISScore(tokenData, securityData) {
    let score = 100;
    const flags = [];
    const pair = tokenData?.pair || tokenData;
    const security = securityData || {};

    if (security.is_honeypot === "1" || security.is_honeypot === true) {
        score -= 60;
        flags.push('🚨 HONEYPOT DETECTED');
    }
    if (security.is_blacklisted === "1" || security.is_blacklisted === true) {
        score -= 30;
        flags.push('🚫 BLACKLISTED CONTRACT');
    }
    if (security.is_mintable === "1" || security.is_mintable === true) {
        score -= 15;
        flags.push('⚠️ MINTABLE TOKEN');
    }

    const liquidity = pair?.liquidity?.usd || 0;
    if (liquidity < 1000) {
        score -= 25;
        flags.push('💧 EXTREMELY LOW LIQUIDITY');
    } else if (liquidity < 10000) {
        score -= 20;
        flags.push('💧 LOW LIQUIDITY');
    }

    score = Math.max(0, Math.min(100, score));

    let riskLevel;
    if (score >= 80) riskLevel = '✅ SAFE';
    else if (score >= 50) riskLevel = '⚠️ CAUTION';
    else riskLevel = '🚨 HIGH RISK';

    return { score, riskLevel, flags };
}

// ============================================
// Bot Commands
// ============================================
if (bot) {
    // /start command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 
            `🛡️ <b>AEGIS AI Shield</b>

Welcome to the Command Terminal.

I am your AI-powered crypto security assistant. I can help you:

🔍 <b>Scan tokens</b> - Check for honeypots, rugs, and risks
💼 <b>Analyze wallets</b> - Get wallet risk assessment  
🐋 <b>Track whales</b> - Monitor large wallet movements
🚨 <b>Get alerts</b> - Real-time threat notifications

<b>Available Commands:</b>
/scan [address] - Scan a token or wallet
/score [address] - Get AEGIS Score only
/wallet [address] - Full wallet analysis
/alerts - Latest threat alerts
/vip - Check VIP status
/whale - Whale movement alerts
/stats - System statistics
/help - Show this message

<i>Access is not purchased. It is held.</i>

🔗 <a href="http://localhost:3000">Web Platform</a>`, 
            { parse_mode: 'HTML', disable_web_page_preview: true }
        );
    });

    // /help command
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 
            `🛡️ <b>AEGIS AI Shield - Help</b>

<b>Core Commands:</b>
/scan [address] - Full security scan of token/wallet
/score [address] - Quick AEGIS Score (0-100)
/wallet [address] - Detailed wallet analysis
/alerts - Latest threat intelligence
/vip - Check VIP access status
/whale - Recent whale movements
/stats - System statistics
/help - This help message

<b>Examples:</b>
/scan 0x627EEA... - Scan a token
/wallet 0xd8dA6B... - Analyze a wallet

<b>VIP Features:</b>
• Real-time alerts
• Whale tracking
• Deep contract audits
• Priority processing

Hold 40,000+ AEGIS tokens for VIP access.

🔗 <a href="http://localhost:3000">aegis-ai.shield</a>`,
            { parse_mode: 'HTML', disable_web_page_preview: true }
        );
    });

    // /scan command
    bot.onText(/\/scan (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const address = match[1].trim();

        // Send typing indicator
        bot.sendChatAction(chatId, 'typing');

        try {
            const response = await axios.get(`http://localhost:3000/api/scan/${address}`);
            const data = response.data;

            if (data.success) {
                const { token, aegis } = data;
                
                let message = `🔍 <b>SCAN RESULTS</b>\n\n`;
                message += `<b>Token:</b> ${token?.baseToken?.name || 'Unknown'} (${token?.baseToken?.symbol || 'N/A'})\n`;
                message += `<b>Price:</b> $${parseFloat(token?.priceUsd || 0).toFixed(8)}\n`;
                message += `<b>Liquidity:</b> $${aegis.liquidity.toLocaleString()}\n`;
                message += `<b>24h Volume:</b> $${aegis.volume24h.toLocaleString()}\n\n`;
                message += `<b>━━━━━━━━━━━━━━━━</b>\n`;
                message += `<b>AEGIS Score: ${aegis.score}/100</b>\n`;
                message += `<b>Risk Level: ${aegis.riskLevel}</b>\n\n`;

                if (aegis.flags.length > 0) {
                    message += `<b>⚠️ Security Flags:</b>\n`;
                    aegis.flags.forEach(flag => {
                        message += `• ${flag.message}\n`;
                    });
                } else {
                    message += `✅ No security issues detected\n`;
                }

                message += `\n<b>Decision: </b>`;
                if (aegis.score >= 80) message += '✅ SAFE TO INTERACT';
                else if (aegis.score >= 50) message += '⚠️ PROCEED WITH CAUTION';
                else message += '🚫 HIGH RISK - AVOID';

                bot.sendMessage(chatId, message, { parse_mode: 'HTML' });

                // VIP push
                setTimeout(() => {
                    bot.sendMessage(chatId, 
                        `💎 <i>Want deeper analysis? Upgrade to VIP for full contract audits and real-time alerts.</i>\n\nUse /vip to check your status.`,
                        { parse_mode: 'HTML' }
                    );
                }, 2000);
            }
        } catch (error) {
            bot.sendMessage(chatId, '❌ Scan failed. Please check the address and try again.');
        }
    });

    // /score command
    bot.onText(/\/score (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const address = match[1].trim();

        bot.sendChatAction(chatId, 'typing');

        try {
            const response = await axios.get(`http://localhost:3000/api/scan/${address}`);
            const data = response.data;

            if (data.success) {
                const aegis = data.aegis;
                const scoreBar = '█'.repeat(Math.floor(aegis.score / 10)) + '░'.repeat(10 - Math.floor(aegis.score / 10));
                
                let color;
                if (aegis.score >= 80) color = '🟢';
                else if (aegis.score >= 50) color = '🟡';
                else color = '🔴';

                bot.sendMessage(chatId, 
                    `${color} <b>AEGIS Score: ${aegis.score}/100</b>\n\n` +
                    `<code>[${scoreBar}]</code>\n\n` +
                    `<b>Risk: ${aegis.riskLevel}</b>\n\n` +
                    `<i>Use /scan for full analysis</i>`,
                    { parse_mode: 'HTML' }
                );
            }
        } catch (error) {
            bot.sendMessage(chatId, '❌ Score lookup failed.');
        }
    });

    // /wallet command
    bot.onText(/\/wallet (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const address = match[1].trim();

        bot.sendChatAction(chatId, 'typing');

        try {
            const response = await axios.get(`http://localhost:3000/api/wallet/${address}`);
            const data = response.data;

            if (data.success) {
                const wallet = data.wallet;
                
                bot.sendMessage(chatId, 
                    `💼 <b>WALLET ANALYSIS</b>\n\n` +
                    `<b>Address:</b> \`${address}\`\n\n` +
                    `<b>Transactions:</b> ${wallet.txCount}\n` +
                    `<b>Tokens:</b> ${wallet.tokenCount}\n` +
                    `<b>NFTs:</b> ${wallet.nftCount}\n` +
                    `<b>ETH Balance:</b> ${wallet.ethBalance} ETH\n\n` +
                    `<b>Risk Score:</b> ${wallet.riskScore}/100\n` +
                    `<b>Labels:</b> ${wallet.labels.join(', ')}\n\n` +
                    `<i>Use /vip to check premium access</i>`,
                    { parse_mode: 'HTML' }
                );
            }
        } catch (error) {
            bot.sendMessage(chatId, '❌ Wallet analysis failed.');
        }
    });

    // /alerts command
    bot.onText(/\/alerts/, async (msg) => {
        const chatId = msg.chat.id;

        bot.sendChatAction(chatId, 'typing');

        try {
            const response = await axios.get('http://localhost:3000/api/alerts');
            const data = response.data;

            let message = `🚨 <b>LATEST THREAT ALERTS</b>\n\n`;
            
            data.alerts.slice(0, 5).forEach((alert, i) => {
                const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : '📡';
                message += `${emoji} <b>${i + 1}.</b> ${alert.message}\n`;
                message += `<i>${alert.time}</i>\n\n`;
            });

            bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        } catch (error) {
            bot.sendMessage(chatId, '❌ Failed to fetch alerts.');
        }
    });

    // /vip command
    bot.onText(/\/vip(.*)/, async (msg, match) => {
        const chatId = msg.chat.id;
        
        if (match[1]) {
            const address = match[1].trim();
            
            bot.sendChatAction(chatId, 'typing');
            
            try {
                const response = await axios.get(`http://localhost:3000/api/check-vip/${address}`);
                const data = response.data;

                if (data.isVIP) {
                    bot.sendMessage(chatId, 
                        `💎 <b>VIP ACCESS GRANTED</b>\n\n` +
                        `✅ Your wallet holds <b>${data.balance.toLocaleString()}</b> AEGIS tokens\n\n` +
                        `<b>Premium Features Unlocked:</b>\n` +
                        `• Real-time threat alerts\n` +
                        `• Whale tracking\n` +
                        `• Deep contract audits\n` +
                        `• Priority AI processing\n\n` +
                        `<i>Thank you for being part of AEGIS.</i>`,
                        { parse_mode: 'HTML' }
                    );
                } else {
                    bot.sendMessage(chatId, 
                        `🔒 <b>VIP ACCESS DENIED</b>\n\n` +
                        `Your wallet holds <b>${data.balance.toLocaleString()}</b> AEGIS tokens\n\n` +
                        `<b>Required:</b> 40,000 AEGIS\n` +
                        `<b>Missing:</b> ${data.required.toLocaleString()} AEGIS\n\n` +
                        `<i>Acquire more AEGIS tokens to unlock premium features.</i>\n\n` +
                        `<a href="http://localhost:3000">Get AEGIS →</a>`,
                        { parse_mode: 'HTML', disable_web_page_preview: true }
                    );
                }
            } catch (error) {
                bot.sendMessage(chatId, '❌ VIP check failed.');
            }
        } else {
            bot.sendMessage(chatId, 
                `🔒 <b>VIP Access Check</b>\n\n` +
                `Send your wallet address to check VIP status:\n\n` +
                `<code>/vip 0xyourwalletaddress</code>\n\n` +
                `<b>Requirements:</b>\n` +
                `• Hold 40,000+ AEGIS tokens\n` +
                `• Maintain minimum balance\n\n` +
                `<b>Premium Features:</b>\n` +
                `• Real-time threat alerts\n` +
                `• Whale movement tracking\n` +
                `• Deep contract audits\n` +
                `• Priority AI processing\n` +
                `• Private intelligence feeds`,
                { parse_mode: 'HTML' }
            );
        }
    });

    // /whale command
    bot.onText(/\/whale/, async (msg) => {
        const chatId = msg.chat.id;

        bot.sendChatAction(chatId, 'typing');

        // Demo whale alerts
        const whaleAlerts = [
            { amount: '2,500 ETH', value: '$8.2M', from: '0x742d35Cc...', to: 'Unknown Wallet', time: '2 min ago' },
            { amount: '15,000,000 USDT', value: '$15M', from: 'Binance Hot Wallet', to: '0x8f3Cf7...', to: 'Unknown', time: '8 min ago' },
            { amount: '500 BTC', value: '$32M', from: '0xd8dA6BF...', to: 'Coinbase', time: '15 min ago' },
        ];

        let message = `🐋 <b>RECENT WHALE MOVEMENTS</b>\n\n`;
        
        whaleAlerts.forEach((alert, i) => {
            message += `<b>${i + 1}.</b> ${alert.amount} (${alert.value})\n`;
            message += `From: \`${alert.from}\`\n`;
            message += `To: \`${alert.to}\`\n`;
            message += `<i>${alert.time}</i>\n\n`;
        });

        message += `<i>VIP members get real-time whale alerts. Use /vip to upgrade.</i>`;

        bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    });

    // /arbitrage command (VIP only - 4 checks/week)
    bot.onText(/\/arbitrage/, (msg) => {
        const userId = msg.from.id;
        const chatId = msg.chat.id;

        // Simulate user tier check (in production, this would check actual holdings)
        const users = {};
        if (!users[userId]) {
            users[userId] = { arb: 0, lastReset: Date.now() };
        }

        // Check if user is PLATINUM tier (40K+ holders)
        const tier = "PLATINUM"; // Demo mode - in production check actual balance

        if (tier !== "PLATINUM") {
            return bot.sendMessage(chatId, 
                `🔒 <b>Arbitrage Locked</b>\n\n` +
                `Available only for 40,000+ AEGIS holders.\n\n` +
                `<i>Use /vip to check your status.</i>`,
                { parse_mode: 'HTML' }
            );
        }

        if (!users[userId].arb) {
            users[userId].arb = 0;
        }

        if (users[userId].arb >= 4) {
            return bot.sendMessage(chatId, 
                `⚠️ <b>Limit Reached</b>\n\n` +
                `You've used your 4 arbitrage checks for this week.\n\n` +
                `<i>Checks reset every Monday.</i>`,
                { parse_mode: 'HTML' }
            );
        }

        users[userId].arb++;

        // Demo arbitrage signals
        const signals = [
            { buy: 'Uniswap', sell: 'Binance', spread: '+3.8%', token: 'ETH/USDT' },
            { buy: 'SushiSwap', sell: 'Coinbase', spread: '+2.1%', token: 'LINK/ETH' },
            { buy: 'PancakeSwap', sell: 'Kraken', spread: '+4.2%', token: 'BNB/BUSD' },
        ];
        const signal = signals[Math.floor(Math.random() * signals.length)];

        bot.sendMessage(chatId, 
            `💰 <b>ARBITRAGE SIGNAL</b>\n\n` +
            `<b>Token:</b> ${signal.token}\n` +
            `<b>Buy:</b> ${signal.buy}\n` +
            `<b>Sell:</b> ${signal.sell}\n` +
            `<b>Spread:</b> ${signal.spread}\n\n` +
            `<b>Remaining this week:</b> ${4 - users[userId].arb}/4\n\n` +
            `<i>⚡ Opportunity detected. Act fast — spreads close quickly.</i>`,
            { parse_mode: 'HTML' }
        );
    });

    // /stats command
    bot.onText(/\/stats/, async (msg) => {
        const chatId = msg.chat.id;

        bot.sendChatAction(chatId, 'typing');

        try {
            const response = await axios.get('http://localhost:3000/api/stats');
            const data = response.data.stats;

            bot.sendMessage(chatId, 
                `📊 <b>AEGIS SYSTEM STATISTICS</b>\n\n` +
                `🛡️ <b>Threats Neutralized:</b> ${data.threatsNeutralized.toLocaleString()}\n` +
                `👁️ <b>Wallets Monitored:</b> ${data.walletsMonitored.toLocaleString()}\n` +
                `🚩 <b>Contracts Flagged:</b> ${data.contractsFlagged.toLocaleString()}\n` +
                `🤖 <b>AI Confidence:</b> ${data.aiConfidence.toFixed(1)}%\n` +
                `🔍 <b>Active Scans:</b> ${data.activeScans}\n\n` +
                `<i>Last updated: ${new Date().toLocaleTimeString()}</i>`,
                { parse_mode: 'HTML' }
            );
        } catch (error) {
            bot.sendMessage(chatId, '❌ Failed to fetch stats.');
        }
    });

    // Handle any message that looks like an address
    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;
        
        // Skip commands
        if (text.startsWith('/')) return;
        
        // Check if it looks like an Ethereum address
        if (text.length === 42 && text.startsWith('0x')) {
            bot.sendMessage(chatId, 
                `🔍 I see an Ethereum address. What would you like to do?\n\n` +
                `Use these commands:\n` +
                `<code>/scan ${text}</code> - Full security scan\n` +
                `<code>/score ${text}</code> - Quick AEGIS Score\n` +
                `<code>/wallet ${text}</code> - Wallet analysis\n` +
                `<code>/vip ${text}</code> - Check VIP status`,
                { parse_mode: 'HTML' }
            );
        }
    });

    console.log('🤖 AEGIS Telegram Bot is running...');
}

// ============================================
// Export for potential use in server.js
// ============================================
module.exports = { bot };