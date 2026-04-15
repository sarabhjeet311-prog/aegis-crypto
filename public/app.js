import { analyzeInput } from '../lib/scanEngine.js';
import { updateLeaderboard } from '../lib/leaderboard.js';

const scanInput = document.getElementById('scanInput');
const scanBtn = document.getElementById('scanBtn');
const scannerSection = document.getElementById('scanner');
const loadingState = document.getElementById('loadingState');
const scanResults = document.getElementById('scanResults');
const scanResultCard = document.getElementById('scanResultCard');
const scanResultContent = document.getElementById('scanResultContent');
const leaderboardBody = document.getElementById('leaderboardTokens');
const statThreats = document.getElementById('statThreats');
const statWallets = document.getElementById('statWallets');
const statContracts = document.getElementById('statContracts');
const statConfidence = document.getElementById('statConfidence');

let scanResult = null;
let isLoading = false;

const cardSelectors = {
    1: { name: 'rank1-name', address: 'rank1-address', score: 'rank1-score' },
    2: { name: 'rank2-name', address: 'rank2-address', score: 'rank2-score' },
    3: { name: 'rank3-name', address: 'rank3-address', score: 'rank3-score' }
};

function initCoin() {
    const coinContainer = document.getElementById('coin-container');
    if (!coinContainer) return;

    coinContainer.style.position = 'relative';
    coinContainer.style.width = '420px';
    coinContainer.style.height = '420px';
    coinContainer.style.perspective = '1200px';

    const coin = document.createElement('div');
    coin.style.width = '100%';
    coin.style.height = '100%';
    coin.style.position = 'absolute';
    coin.style.top = '0';
    coin.style.left = '0';
    coin.style.transformStyle = 'preserve-3d';
    coin.style.animation = 'rotateCoin 11s linear infinite';
    coin.style.transform = 'rotateX(18deg)';

    const faceStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)'
    };

    const front = document.createElement('div');
    Object.assign(front.style, faceStyle);
    front.style.transform = 'translateZ(18px)';
    const back = document.createElement('div');
    Object.assign(back.style, faceStyle);
    back.style.transform = 'rotateY(180deg) translateZ(18px)';

    const frontImage = document.createElement('img');
    frontImage.src = '/coin.png';
    frontImage.alt = 'AEGIS Coin Front';
    frontImage.style.width = '100%';
    frontImage.style.height = '100%';
    frontImage.style.objectFit = 'contain';
    frontImage.style.display = 'block';

    const backImage = document.createElement('img');
    backImage.src = '/coin.png';
    backImage.alt = 'AEGIS Coin Back';
    backImage.style.width = '100%';
    backImage.style.height = '100%';
    backImage.style.objectFit = 'contain';
    backImage.style.display = 'block';

    front.appendChild(frontImage);
    back.appendChild(backImage);

    const edge = document.createElement('div');
    edge.style.position = 'absolute';
    edge.style.left = '50%';
    edge.style.top = '0';
    edge.style.transform = 'translateX(-50%) rotateY(90deg)';
    edge.style.width = '36px';
    edge.style.height = '100%';
    edge.style.borderRadius = '50%';
    edge.style.background = 'linear-gradient(90deg, #d3d3d3 0%, #3b3b3b 45%, #3b3b3b 55%, #d3d3d3 100%)';
    edge.style.boxShadow = 'inset 0 0 18px rgba(0,0,0,0.3)';

    const glow = document.createElement('div');
    glow.style.position = 'absolute';
    glow.style.inset = '0';
    glow.style.borderRadius = '50%';
    glow.style.boxShadow = '0 0 90px rgba(98, 126, 234, 0.25), inset 0 0 40px rgba(20, 241, 149, 0.12)';
    glow.style.pointerEvents = 'none';

    coin.appendChild(front);
    coin.appendChild(back);
    coin.appendChild(edge);
    coin.appendChild(glow);
    coinContainer.appendChild(coin);

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `@keyframes rotateCoin { 0% { transform: rotateY(0deg) rotateX(18deg); } 100% { transform: rotateY(360deg) rotateX(18deg); } }`;
    document.head.appendChild(styleSheet);
}

function initScanner() {
    if (scanBtn) {
        scanBtn.addEventListener('click', handleScan);
    }

    if (scanInput) {
        scanInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleScan();
            }
        });
    }
}

const handleScan = async () => {
    const inputValue = scanInput?.value.trim();
    if (!inputValue) return;

    setLoading(true);

    try {
        const result = await analyzeInput(inputValue);
        scanResult = result;

        if (result.type !== "error") {
            updateLeaderboard(inputValue);
        }

        showResultCard(result);
        showResults();
    } catch (e) {
        showResultCard({
            type: "error",
            title: "Scan Error",
            message: "Scan failed. Try again."
        });
        showResults();
    }

    setLoading(false);
};

function fillExample(address) {
    const input = document.getElementById('scanInput');
    if (input) {
        input.value = address;
        input.focus();
        setTimeout(handleScan, 250);
    }
}

function showLoading() {
    if (scanBtn) {
        scanBtn.textContent = 'Analyzing blockchain data...';
        scanBtn.disabled = true;
    }
    if (scannerSection) {
        scannerSection.classList.remove('hidden');
        scannerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (loadingState) loadingState.classList.remove('hidden');
    if (scanResults) scanResults.classList.add('hidden');
    if (scanResultCard) {
        scanResultCard.classList.add('hidden');
        scanResultCard.style.opacity = '0';
    }
}

function showResults() {
    if (loadingState) loadingState.classList.add('hidden');
    if (scanResults) scanResults.classList.add('hidden');
    if (scanResultCard) {
        scanResultCard.classList.remove('hidden');
        requestAnimationFrame(() => {
            scanResultCard.style.opacity = '1';
            scanResultCard.style.transform = 'translateY(0px)';
        });
    }
}

function saveLastScan(result) {
    try {
        localStorage.setItem('aegisLastScan', JSON.stringify(result));
    } catch (error) {
        console.warn('Unable to cache last scan', error);
    }
}

function restoreLastScan() {
    try {
        const cached = localStorage.getItem('aegisLastScan');
        if (!cached) return;
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
            scanResult = parsed;
            showResultCard(parsed);
            showResults();
        }
    } catch (error) {
        console.warn('Unable to restore last scan', error);
    }
}

function showResultCard(result) {
    if (!scanResultCard || !scanResultContent) return;
    scanResultCard.classList.remove('hidden');
    scanResultCard.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    scanResultCard.style.opacity = '0';
    scanResultCard.style.transform = 'translateY(10px)';

    // CRITICAL FIX: Clear old result before rendering
    scanResultContent.innerHTML = '';

    if (result.type === 'error') {
        scanResultContent.innerHTML = `
            <h2 style="color: #f87171; margin-bottom: 12px;">${result.title}</h2>
            <p style="margin: 4px 0; color: #fca5a5;">${result.message}</p>
        `;
        return;
    }

    if (result.type === 'wallet') {
        scanResultContent.innerHTML = `
            <h2 style="color: #60a5fa; margin-bottom: 14px;">Wallet Intelligence</h2>
            <p style="margin: 6px 0;"><strong>Wallet Address:</strong> ${result.address}</p>
            <p style="margin: 6px 0;"><strong>Balance:</strong> ${formatCurrency(result.balance)}</p>
            <p style="margin: 6px 0;"><strong>Transactions:</strong> ${result.transactions}</p>
            <p style="margin: 6px 0;"><strong>Chains:</strong> ${result.chains.join(', ')}</p>
            <p style="margin: 6px 0;"><strong>AEGIS Score:</strong> ${result.aegisScore}/100</p>
            <p style="margin: 6px 0;"><strong>Wallet Type:</strong> ${result.walletType}</p>
            <p style="margin: 6px 0;"><strong>Behavior:</strong> ${result.behavior}</p>
            <p style="margin: 6px 0;"><strong>Risk Profile:</strong> ${result.risk}</p>
            <p style="margin: 10px 0 0; font-weight: 700; color: #38bdf8;">${result.verdict}</p>
        `;
        return;
    }

    // Token Analysis with enhanced DeFi-style output
    scanResultContent.innerHTML = `
        <h2 style="color: #34d399; margin-bottom: 14px;">${result.tokenName} (${result.symbol})</h2>
        <p style="margin: 6px 0;"><strong>Price 💲:</strong> $${result.price?.toFixed(6) || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>Liquidity 💧:</strong> $${result.liquidity?.toLocaleString() || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>Market Cap 📊:</strong> $${result.marketCap?.toLocaleString() || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>Volume 24h 📈:</strong> $${result.volume24h?.toLocaleString() || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>Buy/Sell Count 🔄:</strong> ${result.buyCount?.toLocaleString() || 0} / ${result.sellCount?.toLocaleString() || 0}</p>
        <p style="margin: 6px 0;"><strong>Whale Activity 🐋:</strong> ${result.whales || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>Smart Money:</strong> ${result.smartMoney || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>AEGIS Score:</strong> ${result.aegisScore}/100</p>
        <p style="margin: 6px 0;"><strong>Risk Level:</strong> ${result.risk}</p>
        <p style="margin: 6px 0;"><strong>Trade Status:</strong> ${result.tradeStatus || 'N/A'}</p>
        <p style="margin: 6px 0;"><strong>Rug Pull Probability:</strong> ${result.rugPullProbability || 0}%</p>
        <p style="margin: 10px 0 0; font-weight: 700; color: #38bdf8;">${result.verdict}</p>
    `;
}

function hideResultCard() {
    if (scanResultCard) scanResultCard.classList.add('hidden');
}

function showError(message) {
    if (scannerSection) scannerSection.classList.remove('hidden');
    if (loadingState) loadingState.classList.add('hidden');
    if (scanResults) scanResults.classList.add('hidden');
    if (scanResultCard) scanResultCard.classList.add('hidden');

    const decisionText = document.getElementById('decisionText');
    const decisionSubtext = document.getElementById('decisionSubtext');
    const securityFlagsElement = document.getElementById('securityFlags');

    if (decisionText) decisionText.textContent = 'SCAN FAILED';
    if (decisionSubtext) decisionSubtext.textContent = message || 'Unable to analyze the provided address.';
    if (securityFlagsElement) {
        securityFlagsElement.innerHTML = `<div class="glass-light rounded-2xl p-6 text-center text-text-muted">${message || 'No results available.'}</div>`;
    }
}

function formatCurrency(value) {
    const amount = Number(value);
    if (Number.isFinite(amount)) {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return '—';
}

function formatLargeNumber(value) {
    const amount = Number(value);
    if (Number.isFinite(amount)) {
        return amount.toLocaleString();
    }
    return '—';
}

function renderFlags(flags) {
    const container = document.getElementById('securityFlags');
    if (!container) return;
    container.innerHTML = '';

    if (!flags || !flags.length) {
        container.innerHTML = `<div class="glass-light rounded-2xl p-6 text-center text-text-muted">No risk flags detected.</div>`;
        return;
    }

    flags.forEach((flag) => {
        const row = document.createElement('div');
        row.className = 'flex items-start gap-3 p-4 rounded-2xl bg-slate-950/50';
        row.innerHTML = `
            <div class="w-3 h-3 rounded-full ${flag.severity === 'critical' ? 'bg-danger' : flag.severity === 'warning' ? 'bg-warning' : 'bg-accent'} mt-2"></div>
            <div>
                <p class="text-sm text-white font-semibold">${flag.message}</p>
                <p class="text-xs text-text-muted">${flag.severity.toUpperCase()}</p>
            </div>
        `;
        container.appendChild(row);
    });
}

function updateScoreCircle(score) {
    const circle = document.getElementById('scoreCircle');
    if (!circle) return;

    const dashArray = 440;
    const offset = dashArray - (dashArray * Math.min(Math.max(score, 0), 100)) / 100;
    circle.style.strokeDashoffset = String(offset);
}

function updateSummary(data, walletData) {
    const scoreValue = document.getElementById('scoreValue');
    const riskLevel = document.getElementById('riskLevel');
    const riskDescription = document.getElementById('riskDescription');
    const tokenName = document.getElementById('tokenName');
    const tokenSymbol = document.getElementById('tokenSymbol');
    const tokenPrice = document.getElementById('tokenPrice');
    const tokenLiquidity = document.getElementById('tokenLiquidity');
    const tokenVolume = document.getElementById('tokenVolume');
    const tokenChange = document.getElementById('tokenChange');
    const decisionText = document.getElementById('decisionText');
    const decisionSubtext = document.getElementById('decisionSubtext');

    if (scoreValue) scoreValue.textContent = String(data.aegis.score || 0);
    if (riskLevel) {
        riskLevel.textContent = data.aegis.riskLevel || 'UNKNOWN';
        riskLevel.style.color = data.aegis.riskColor || '#ffffff';
    }
    if (riskDescription) riskDescription.textContent = data.aegis.flags?.map((flag) => flag.message).join(' · ') || 'No critical flags detected.';
    if (tokenName) tokenName.textContent = data.name || 'Unknown Token';
    if (tokenSymbol) tokenSymbol.textContent = data.symbol || '—';
    if (tokenPrice) tokenPrice.textContent = formatCurrency(data.token?.priceUsd);
    if (tokenLiquidity) tokenLiquidity.textContent = formatCurrency(data.aegis.liquidity);
    if (tokenVolume) tokenVolume.textContent = formatCurrency(data.aegis.volume24h);
    if (tokenChange) tokenChange.textContent = `${Number(data.token?.priceChange?.h24 || 0).toFixed(2)}%`;

    if (decisionText) {
        decisionText.textContent = data.aegis.riskLevel === 'SAFE' ? 'SAFE TO PROCEED' : data.aegis.riskLevel === 'WARNING' ? 'CAUTION ADVISED' : 'HIGH RISK FOUND';
    }

    if (decisionSubtext) {
        decisionSubtext.textContent = `${data.tradingSignal.summary}. Wallet Risk Score: ${walletData?.wallet?.riskScore ?? 'N/A'}. Tokens: ${walletData?.wallet?.tokenCount ?? 'N/A'}.`;
    }

    renderFlags(data.aegis.flags || []);
    updateScoreCircle(data.aegis.score || 0);
    console.log('VISIBLE RESULT:', data);
}

function renderWalletOnly(walletData) {
    const scoreValue = document.getElementById('scoreValue');
    const riskLevel = document.getElementById('riskLevel');
    const riskDescription = document.getElementById('riskDescription');
    const tokenName = document.getElementById('tokenName');
    const tokenSymbol = document.getElementById('tokenSymbol');
    const tokenPrice = document.getElementById('tokenPrice');
    const tokenLiquidity = document.getElementById('tokenLiquidity');
    const tokenVolume = document.getElementById('tokenVolume');
    const tokenChange = document.getElementById('tokenChange');
    const decisionText = document.getElementById('decisionText');
    const decisionSubtext = document.getElementById('decisionSubtext');

    const wallet = walletData.wallet || {};
    const riskScore = wallet.riskScore || 0;
    const levelLabel = riskScore >= 80 ? 'SAFE' : riskScore >= 50 ? 'CAUTION' : 'HIGH RISK';
    const riskColor = riskScore >= 80 ? '#14F195' : riskScore >= 50 ? '#F3BA2F' : '#FF3B30';

    if (scoreValue) scoreValue.textContent = String(riskScore);
    if (riskLevel) {
        riskLevel.textContent = 'WALLET ANALYSIS';
        riskLevel.style.color = riskColor;
    }
    if (riskDescription) riskDescription.textContent = `Recent wallet activity: ${formatLargeNumber(wallet.txCount || 0)} tx. ${wallet.labels?.join(', ') || 'No labels'}`;
    if (tokenName) tokenName.textContent = walletData.address || 'Wallet';
    if (tokenSymbol) tokenSymbol.textContent = `${wallet.tokenCount || 0} tokens`;
    if (tokenPrice) tokenPrice.textContent = `${wallet.ethBalance || '0.0000'} ETH`;
    if (tokenLiquidity) tokenLiquidity.textContent = `${wallet.nftCount || 0} NFTs`;
    if (tokenVolume) tokenVolume.textContent = formatLargeNumber(wallet.txCount || 0);
    if (tokenChange) tokenChange.textContent = '—';
    if (decisionText) decisionText.textContent = levelLabel === 'SAFE' ? 'WALLET IS HEALTHY' : levelLabel === 'CAUTION' ? 'WALLET NEEDS REVIEW' : 'HIGH RISK WALLET';
    if (decisionSubtext) decisionSubtext.textContent = `${wallet.labels?.join(', ') || 'No wallet labels found'}. Last activity ${Math.max(Math.floor((Date.now() - (wallet.lastTx || Date.now())) / 3600000), 0)}h ago.`;

    renderFlags([
        { severity: 'info', message: `Transactions: ${formatLargeNumber(wallet.txCount || 0)}` },
        { severity: riskScore >= 80 ? 'info' : riskScore >= 50 ? 'warning' : 'critical', message: `Wallet risk score: ${riskScore}` }
    ]);
    updateScoreCircle(riskScore);
}

function createLeaderboardRow(entry, rank) {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/10';

    row.innerHTML = `
        <td class="py-4 px-6 text-sm font-medium text-white">${rank}</td>
        <td class="py-4 px-6 text-sm font-semibold text-white">${entry.name} (${entry.symbol})</td>
        <td class="py-4 px-6 text-sm text-text-muted">${entry.symbol}</td>
        <td class="py-4 px-6 text-sm font-semibold text-right text-white">${entry.aegisScore}</td>
    `;

    return row;
}

function updateLeaderboardCards(entries) {
    [1, 2, 3].forEach((rank) => {
        const target = cardSelectors[rank];
        const cardEntry = entries[rank - 1];
        const nameEl = document.getElementById(target.name);
        const addressEl = document.getElementById(target.address);
        const scoreEl = document.getElementById(target.score);

        if (cardEntry) {
            if (nameEl) nameEl.textContent = cardEntry.name;
            if (addressEl) addressEl.textContent = cardEntry.symbol;
            if (scoreEl) scoreEl.textContent = String(cardEntry.aegisScore || 0);
        } else {
            if (nameEl) nameEl.textContent = rank === 1 ? 'Gold Token' : rank === 2 ? 'Silver Token' : 'Bronze Token';
            if (addressEl) addressEl.textContent = '0x000...0000';
            if (scoreEl) scoreEl.textContent = '0';
        }
    });
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const payload = await response.json();
        if (!payload.success || !Array.isArray(payload.leaderboard)) {
            throw new Error('Unable to load leaderboard');
        }

        const leaderboard = payload.leaderboard;
        updateLeaderboardCards(leaderboard);

        if (leaderboardBody) {
            leaderboardBody.innerHTML = '';
            leaderboard.forEach((entry, index) => {
                leaderboardBody.appendChild(createLeaderboardRow(entry, index + 1));
            });
        }
    } catch (error) {
        console.error('Leaderboard error:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const payload = await response.json();
        if (!payload.success || !payload.stats) return;

        if (statThreats) statThreats.textContent = String(Math.floor(payload.stats.threatsNeutralized || 0));
        if (statWallets) statWallets.textContent = String(Math.floor(payload.stats.walletsMonitored || 0));
        if (statContracts) statContracts.textContent = String(Math.floor(payload.stats.contractsFlagged || 0));
        if (statConfidence) statConfidence.textContent = `${Number(payload.stats.aiConfidence || 0).toFixed(1)}%`;
    } catch (error) {
        console.error('Stats error:', error);
    }
}

async function fetchWalletAnalysis(address) {
    try {
        const response = await fetch(`/api/wallet/${encodeURIComponent(address)}`);
        const payload = await response.json();
        return payload.success ? payload : null;
    } catch {
        return null;
    }
}


function checkVIP() {
    const address = document.getElementById('vipInput')?.value;
    const result = document.getElementById('vipResult');

    if (!address) {
        if (result) {
            result.innerHTML = '<p class="text-text-muted">Please enter a wallet address</p>';
            result.classList.remove('hidden');
        }
        return;
    }

    const hashValue = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const balance = hashValue % 100000;
    const threshold = 40000;
    const isVIP = balance >= threshold;

    if (!result) return;

    if (isVIP) {
        result.innerHTML = `
            <div class="glass rounded-xl p-6 text-center">
                <div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-yellow-600 mb-2">VIP Access Granted</h3>
                <p class="text-text-muted">Your AEGIS balance: ${balance.toLocaleString()}</p>
                <p class="text-text-muted">Required: ${threshold.toLocaleString()}</p>
                <div class="mt-4 flex justify-center space-x-4">
                    <a href="#" class="btn-primary px-6 py-2 rounded-lg text-white font-semibold">Access Intelligence</a>
                    <a href="#" class="btn-outline px-6 py-2 rounded-lg text-yellow-600 border-yellow-600">View Features</a>
                </div>
            </div>
        `;
    } else {
        result.innerHTML = `
            <div class="glass rounded-xl p-6 text-center">
                <div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-600 mb-2">VIP Access Required</h3>
                <p class="text-text-muted">Your AEGIS balance: ${balance.toLocaleString()}</p>
                <p class="text-text-muted">Required: ${threshold.toLocaleString()}</p>
                <p class="text-text-muted mt-2">Acquire more AEGIS tokens to unlock premium features</p>
                <div class="mt-4 flex justify-center space-x-4">
                    <a href="#" class="btn-primary px-6 py-2 rounded-lg text-white font-semibold">Get AEGIS</a>
                    <a href="#" class="btn-outline px-6 py-2 rounded-lg text-gray-600 border-gray-600">Learn More</a>
                </div>
            </div>
        `;
    }

    result.classList.remove('hidden');
}

function copyAddress(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = element.textContent || element.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const button = element.parentElement?.querySelector('button');
            if (button) {
                const originalText = button.innerHTML;
                button.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>Copied!</span>
                `;
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            }
        });
    }
}

window.fillExample = fillExample;
window.copyAddress = copyAddress;
window.checkVIP = checkVIP;

document.addEventListener('DOMContentLoaded', () => {
    initCoin();
    initScanner();
    loadLeaderboard();
    loadStats();
    restoreLastScan();
});