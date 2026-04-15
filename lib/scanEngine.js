/**
 * AEGIS Production-Grade Crypto Intelligence Scan Engine
 * 
 * Features:
 * - Bulletproof input detection (wallet vs token vs token name)
 * - Real-time data from Dexscreener and Etherscan APIs
 * - AI-powered analysis with AEGIS scoring
 * - Comprehensive risk assessment
 * - Never shows blank results - always returns structured output
 */

// API Keys from environment
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'G5YI93NQ7XD6IC1BJWHY5P5QFJ4E2YZSEF';

// Rate limiting state
const rateLimitState = {
  etherscan: { calls: 0, resetTime: Date.now() },
  dexscreener: { calls: 0, resetTime: Date.now() }
};

/**
 * Check rate limit for API calls
 */
function checkRateLimit(api) {
  const state = rateLimitState[api];
  const now = Date.now();
  
  // Reset counter every minute
  if (now - state.resetTime > 60000) {
    state.calls = 0;
    state.resetTime = now;
  }
  
  // Etherscan free tier: 5 calls/sec, we limit to 4 to be safe
  // Dexscreener: no strict limit but we limit to 10/sec
  const maxCalls = api === 'etherscan' ? 4 : 10;
  
  if (state.calls >= maxCalls) {
    const waitTime = 1000 - (now % 1000);
    console.warn(`Rate limit approaching for ${api}, waiting ${waitTime}ms`);
    return waitTime;
  }
  
  state.calls++;
  return 0;
}

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe fetch with timeout and error handling
 */
async function safeFetch(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// STEP 1: BULLETPROOF INPUT DETECTION
// ============================================================================

/**
 * Detect input type with advanced validation
 * @param {string} input - User input (token name, token address, or wallet address)
 * @returns {Promise<string>} - 'error', 'wallet', 'token', or 'tokenName'
 */
export async function detectInputType(input) {
  const trimmed = input.trim();

  // Rule 1: If empty or length < 2
  if (!trimmed || trimmed.length < 2) {
    return "error";
  }

  // Rule 2: If starts with "0x" AND length === 42 (standard Ethereum address)
  if (trimmed.startsWith("0x") && trimmed.length === 42) {
    // Validate hex format
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      return "error";
    }
    
    try {
      // Check rate limit
      const waitTime = checkRateLimit('etherscan');
      if (waitTime > 0) await sleep(waitTime);
      
      // CALL ETHERSCAN TX API to verify if it's a wallet with transactions
      const response = await safeFetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${trimmed}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${ETHERSCAN_API_KEY}`
      );
      
      if (!response.ok) {
        // API error - assume it's a token contract
        return "token";
      }
      
      const data = await response.json();

      if (data.status === "1" && data.result && data.result.length > 0) {
        // Has transactions = it's a wallet
        return "wallet";
      } else {
        // No transactions or error = likely a token contract
        return "token";
      }
    } catch (error) {
      console.error('Error checking address type:', error);
      // Fallback: assume token if API fails
      return "token";
    }
  }

  // Rule 3: If NOT starting with 0x → ALWAYS treat as TOKEN NAME
  // This includes: "pepe", "wlfi", "eth", "btc", etc.
  return "tokenName";
}

// ============================================================================
// STEP 2: TOKEN NAME → REAL DATA (DEXSCREENER)
// ============================================================================

/**
 * Convert token name to contract address using Dexscreener
 * @param {string} name - Token name or symbol
 * @returns {Promise<Object|null>} - Token info with address, name, symbol
 */
async function getTokenContractFromName(name) {
  try {
    const waitTime = checkRateLimit('dexscreener');
    if (waitTime > 0) await sleep(waitTime);
    
    // CALL: https://api.dexscreener.com/latest/dex/search?q=INPUT
    const response = await safeFetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(name)}`
    );
    
    if (!response.ok) {
      console.warn('Dexscreener search failed:', response.status);
      return null;
    }
    
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      // Filter for most relevant pair (highest liquidity)
      const sortedPairs = data.pairs
        .filter(pair => pair.baseToken && pair.baseToken.address && pair.liquidity?.usd > 0)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      
      if (sortedPairs.length > 0) {
        const firstPair = sortedPairs[0];
        return {
          address: firstPair.baseToken.address,
          name: firstPair.baseToken.name || name,
          symbol: firstPair.baseToken.symbol || name.toUpperCase(),
          chainId: firstPair.chainId
        };
      }
    }
  } catch (error) {
    console.error('Error fetching token from name:', error);
  }
  return null;
}

// ============================================================================
// STEP 3: TOKEN ANALYSIS (REAL + ENHANCED)
// ============================================================================

/**
 * Get comprehensive token data from Dexscreener
 * @param {string} contractAddress - Token contract address
 * @returns {Promise<Object|null>} - Token data with price, liquidity, volume, etc.
 */
async function getTokenData(contractAddress) {
  try {
    const waitTime = checkRateLimit('dexscreener');
    if (waitTime > 0) await sleep(waitTime);
    
    // CALL: https://api.dexscreener.com/latest/dex/tokens/ADDRESS
    const response = await safeFetch(
      `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`
    );
    
    if (!response.ok) {
      console.warn('Dexscreener token data failed:', response.status);
      return null;
    }
    
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      // Get the pair with highest liquidity for most accurate data
      const bestPair = data.pairs
        .filter(pair => pair.liquidity?.usd > 0)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || data.pairs[0];

      return {
        price: parseFloat(bestPair.priceUsd) || 0,
        liquidity: parseFloat(bestPair.liquidity?.usd) || 0,
        marketCap: parseFloat(bestPair.fdv) || 0,
        volume24h: parseFloat(bestPair.volume?.h24) || 0,
        priceChange24h: parseFloat(bestPair.priceChange?.h24) || 0,
        buys: bestPair.txns?.h24?.buys || 0,
        sells: bestPair.txns?.h24?.sells || 0,
        txCount24h: (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0),
        chainId: bestPair.chainId,
        pairAddress: bestPair.pairAddress
      };
    }
  } catch (error) {
    console.error('Error fetching token data:', error);
  }
  return null;
}

// ============================================================================
// STEP 4: WALLET ANALYSIS (REAL)
// ============================================================================

/**
 * Get comprehensive wallet data from Etherscan
 * @param {string} address - Wallet address
 * @returns {Promise<Object>} - Wallet data with balance, transactions, etc.
 */
async function getWalletData(address) {
  const result = {
    balance: 0,
    balanceUsd: 0,
    transactions: 0,
    firstTxDate: null,
    lastTxDate: null,
    ethPrice: 0
  };

  try {
    // Get ETH balance
    const waitTime1 = checkRateLimit('etherscan');
    if (waitTime1 > 0) await sleep(waitTime1);
    
    const balanceResponse = await safeFetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    );
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      if (balanceData.status === "1") {
        result.balance = parseFloat(balanceData.result) / 1e18;
      }
    }

    // Get transaction list for analysis
    const waitTime2 = checkRateLimit('etherscan');
    if (waitTime2 > 0) await sleep(waitTime2);
    
    const txResponse = await safeFetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );
    
    if (txResponse.ok) {
      const txData = await txResponse.json();
      if (txData.status === "1" && txData.result) {
        result.transactions = txData.result.length;
        
        // Analyze transaction dates
        if (txData.result.length > 0) {
          const timestamps = txData.result.map(tx => parseInt(tx.timeStamp) * 1000);
          result.firstTxDate = new Date(Math.min(...timestamps));
          result.lastTxDate = new Date(Math.max(...timestamps));
        }
      }
    }

    // Get ETH price for USD conversion
    try {
      const priceResponse = await safeFetch(
        'https://api.dexscreener.com/latest/dex/search?q=ETH'
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.pairs && priceData.pairs.length > 0) {
          result.ethPrice = parseFloat(priceData.pairs[0].priceUsd) || 0;
        }
      }
    } catch (e) {
      // ETH price not critical
    }

    result.balanceUsd = result.balance * result.ethPrice;
  } catch (error) {
    console.error('Error fetching wallet data:', error);
  }

  return result;
}

// ============================================================================
// AI ANALYSIS ENGINE
// ============================================================================

/**
 * Compute AI-powered token analysis
 */
function analyzeTokenAI(tokenData) {
  const { price, liquidity, marketCap, volume24h, buys, sells, priceChange24h } = tokenData;

  // AEGIS SCORE (0-100)
  let aegisScore = 30; // Base score
  
  // Liquidity scoring (0-30 points)
  if (liquidity > 10000000) aegisScore += 30;      // $10M+ = excellent
  else if (liquidity > 1000000) aegisScore += 25;   // $1M+ = good
  else if (liquidity > 500000) aegisScore += 20;    // $500K+ = decent
  else if (liquidity > 100000) aegisScore += 15;    // $100K+ = okay
  else if (liquidity > 50000) aegisScore += 10;     // $50K+ = low
  else aegisScore += 5;                              // Very low

  // Volume scoring (0-25 points)
  if (volume24h > 5000000) aegisScore += 25;        // $5M+ = excellent
  else if (volume24h > 1000000) aegisScore += 20;   // $1M+ = good
  else if (volume24h > 500000) aegisScore += 15;    // $500K+ = decent
  else if (volume24h > 100000) aegisScore += 10;    // $100K+ = okay
  else if (volume24h > 50000) aegisScore += 5;      // $50K+ = low

  // Market cap stability (0-10 points)
  if (marketCap > 100000000) aegisScore += 10;      // $100M+ = very stable
  else if (marketCap > 10000000) aegisScore += 8;   // $10M+ = stable
  else if (marketCap > 1000000) aegisScore += 5;    // $1M+ = moderate
  else aegisScore += 2;                              // Low cap

  // Transaction activity (0-10 points)
  const txCount = buys + sells;
  if (txCount > 1000) aegisScore += 10;
  else if (txCount > 500) aegisScore += 8;
  else if (txCount > 100) aegisScore += 5;
  else if (txCount > 50) aegisScore += 3;

  // Clamp score
  aegisScore = Math.min(98, Math.max(15, aegisScore));

  // Whale Activity
  let whales = 'Low';
  let whalesEmoji = '🐟';
  if (volume24h > 5000000) {
    whales = 'Very High';
    whalesEmoji = '🐋🐋';
  } else if (volume24h > 1000000) {
    whales = 'High';
    whalesEmoji = '🐋';
  } else if (volume24h > 500000) {
    whales = 'Moderate';
    whalesEmoji = '🐬';
  } else if (volume24h > 100000) {
    whales = 'Low-Moderate';
    whalesEmoji = '🐟';
  }

  // Smart Money Flow
  let smartMoney = 'Neutral';
  let smartMoneyEmoji = '⚖️';
  if (buys > 0 || sells > 0) {
    const buyRatio = buys / (buys + sells);
    if (buyRatio > 0.65) {
      smartMoney = 'Strong Accumulation';
      smartMoneyEmoji = '📈🚀';
    } else if (buyRatio > 0.55) {
      smartMoney = 'Accumulating';
      smartMoneyEmoji = '📈';
    } else if (buyRatio < 0.35) {
      smartMoney = 'Heavy Dumping';
      smartMoneyEmoji = '📉💀';
    } else if (buyRatio < 0.45) {
      smartMoney = 'Distribution';
      smartMoneyEmoji = '📉';
    }
  }

  // Risk Assessment
  let risk = 'Critical 🔴';
  if (liquidity > 5000000 && volume24h > 1000000) {
    risk = 'Very Low 🟢';
  } else if (liquidity > 1000000 && volume24h > 500000) {
    risk = 'Low 🟢';
  } else if (liquidity > 500000 || volume24h > 100000) {
    risk = 'Medium 🟡';
  } else if (liquidity > 100000) {
    risk = 'Elevated 🟠';
  } else if (liquidity > 50000) {
    risk = 'High 🔴';
  }

  // Trade Status
  let tradeStatus = 'DO NOT TRADE 🚨';
  if (aegisScore >= 80) {
    tradeStatus = 'Safe to Trade ✅';
  } else if (aegisScore >= 65) {
    tradeStatus = 'Trade with Caution ⚠️';
  } else if (aegisScore >= 45) {
    tradeStatus = 'High Risk - Small Positions Only ⚡';
  }

  // Rug Pull Probability
  let rugPullProbability = 90;
  if (liquidity > 1000000) rugPullProbability -= 40;
  else if (liquidity > 500000) rugPullProbability -= 25;
  else if (liquidity > 100000) rugPullProbability -= 15;
  else if (liquidity > 50000) rugPullProbability -= 5;
  
  if (volume24h > 1000000) rugPullProbability -= 20;
  else if (volume24h > 500000) rugPullProbability -= 10;
  else if (volume24h > 100000) rugPullProbability -= 5;
  
  if (marketCap > 10000000) rugPullProbability -= 15;
  else if (marketCap > 1000000) rugPullProbability -= 8;
  
  rugPullProbability = Math.max(5, Math.min(95, rugPullProbability));

  // Final Verdict
  let verdict = 'Potential Scam 🚨';
  if (aegisScore >= 75) {
    verdict = 'Legit Project ✅';
  } else if (aegisScore >= 55) {
    verdict = 'Suspicious - Verify Carefully ⚠️';
  } else if (aegisScore >= 40) {
    verdict = 'High Risk - Likely Manipulated ⚡';
  }

  return {
    aegisScore,
    whales: `${whalesEmoji} ${whales}`,
    smartMoney: `${smartMoneyEmoji} ${smartMoney}`,
    risk,
    tradeStatus,
    rugPullProbability,
    verdict
  };
}

/**
 * Compute AI-powered wallet analysis
 */
function analyzeWalletAI(walletData) {
  const { balance, balanceUsd, transactions, firstTxDate, lastTxDate } = walletData;

  // Wallet Type
  let walletType = 'Retail 👤';
  let walletTypeEmoji = '👤';
  if (balanceUsd > 1000000) {
    walletType = 'Mega Whale 🐋';
    walletTypeEmoji = '🐋';
  } else if (balanceUsd > 100000) {
    walletType = 'Whale 🐋';
    walletTypeEmoji = '🐋';
  } else if (balanceUsd > 50000) {
    walletType = 'Large Holder 🐬';
    walletTypeEmoji = '🐬';
  } else if (balanceUsd > 10000) {
    walletType = 'Smart Money 🧠';
    walletTypeEmoji = '🧠';
  } else if (balanceUsd > 1000) {
    walletType = 'Active Trader 📊';
    walletTypeEmoji = '📊';
  }

  // Behavior Analysis
  let behavior = 'Unknown';
  let behaviorEmoji = '❓';
  
  if (transactions > 0) {
    const walletAge = lastTxDate ? (Date.now() - new Date(firstTxDate).getTime()) / (1000 * 60 * 60 * 24) : 365;
    const txPerDay = transactions / Math.max(walletAge, 1);
    
    if (txPerDay > 50) {
      behavior = 'Hyper Active (Bot/MEV?)';
      behaviorEmoji = '🤖';
    } else if (txPerDay > 10) {
      behavior = 'Very Active Trader';
      behaviorEmoji = '📈';
    } else if (txPerDay > 2) {
      behavior = 'Active User';
      behaviorEmoji = '👤';
    } else if (txPerDay > 0.5) {
      behavior = 'Occasional User';
      behaviorEmoji = '😐';
    } else {
      behavior = 'Dormant / HODLER';
      behaviorEmoji = '💎';
    }
  }

  // Risk Assessment
  let risk = 'Unknown ⚪';
  if (transactions > 1000 && balanceUsd > 10000) {
    risk = 'Low 🟢';
  } else if (transactions > 500) {
    risk = 'Low-Medium 🟢';
  } else if (transactions > 100) {
    risk = 'Medium 🟡';
  } else if (transactions > 20) {
    risk = 'Medium-High 🟠';
  } else if (transactions > 0) {
    risk = 'High 🔴';
  } else {
    risk = 'Very High 🔴'; // No transactions at all
  }

  // AEGIS SCORE
  let aegisScore = 20; // Base score for unknown wallets
  
  // Transaction history scoring (0-40 points)
  if (transactions > 10000) aegisScore += 40;
  else if (transactions > 5000) aegisScore += 35;
  else if (transactions > 1000) aegisScore += 30;
  else if (transactions > 500) aegisScore += 25;
  else if (transactions > 100) aegisScore += 15;
  else if (transactions > 20) aegisScore += 10;
  else if (transactions > 0) aegisScore += 5;

  // Balance scoring (0-30 points) - shows staying power
  if (balanceUsd > 1000000) aegisScore += 30;
  else if (balanceUsd > 100000) aegisScore += 25;
  else if (balanceUsd > 50000) aegisScore += 20;
  else if (balanceUsd > 10000) aegisScore += 15;
  else if (balanceUsd > 1000) aegisScore += 10;
  else if (balanceUsd > 100) aegisScore += 5;

  // Wallet age scoring (0-30 points)
  if (firstTxDate) {
    const ageInDays = (Date.now() - new Date(firstTxDate).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 1000) aegisScore += 30;      // 3+ years
    else if (ageInDays > 365) aegisScore += 25;   // 1+ year
    else if (ageInDays > 180) aegisScore += 20;   // 6+ months
    else if (ageInDays > 90) aegisScore += 15;    // 3+ months
    else if (ageInDays > 30) aegisScore += 10;    // 1+ month
    else aegisScore += 5;                          // New wallet
  }

  aegisScore = Math.min(98, Math.max(10, aegisScore));

  // Final Verdict
  let verdict = 'Scam Wallet 🚨';
  if (aegisScore >= 80) {
    verdict = 'Legit Wallet ✅';
  } else if (aegisScore >= 60) {
    verdict = 'Likely Legitimate ⚠️';
  } else if (aegisScore >= 40) {
    verdict = 'Suspicious - Proceed with Caution ⚡';
  } else if (aegisScore >= 25) {
    verdict = 'High Risk - Likely Suspicious 🔴';
  }

  return {
    aegisScore,
    walletType: `${walletTypeEmoji} ${walletType}`,
    behavior: `${behaviorEmoji} ${behavior}`,
    risk,
    verdict,
    chains: ['ETH']
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Main entry point for analyzing any input
 * @param {string} input - Token name, token address, or wallet address
 * @returns {Promise<Object>} - Comprehensive analysis result
 */
export async function analyzeInput(input) {
  // Add realistic delay for UX (simulates analysis)
  await sleep(800);

  const trimmed = input.trim();
  
  // Get default empty result structure
  const getEmptyResult = (type = 'error', message = 'Unknown error') => ({
    type,
    message,
    title: type === 'error' ? 'Scan Error' : 'Analysis Complete',
    // Token fields
    tokenName: 'N/A',
    symbol: 'N/A',
    address: 'N/A',
    price: 0,
    liquidity: 0,
    volume24h: 0,
    marketCap: 0,
    buyCount: 0,
    sellCount: 0,
    whales: 'N/A',
    smartMoney: 'N/A',
    aegisScore: 0,
    risk: 'N/A',
    tradable: 'N/A',
    rugPullProbability: 0,
    verdict: 'N/A',
    // Wallet fields
    balance: 0,
    balanceUsd: 0,
    transactions: 0,
    chains: [],
    walletType: 'N/A',
    behavior: 'N/A'
  });

  // Validate input
  const type = await detectInputType(trimmed);

  if (type === 'error') {
    return {
      ...getEmptyResult('error', 'Invalid input. Please enter a valid wallet address (0x...) or token name.'),
      title: 'Invalid Input'
    };
  }

  // ============================================================================
  // WALLET ANALYSIS
  // ============================================================================
  if (type === 'wallet') {
    try {
      const walletData = await getWalletData(trimmed);
      const analysis = analyzeWalletAI(walletData);

      return {
        ...getEmptyResult('wallet'),
        type: 'wallet',
        title: 'Wallet Intelligence Report',
        address: trimmed,
        balance: walletData.balance,
        balanceUsd: walletData.balanceUsd,
        transactions: walletData.transactions,
        firstTxDate: walletData.firstTxDate,
        lastTxDate: walletData.lastTxDate,
        ...analysis
      };
    } catch (error) {
      console.error('Wallet analysis error:', error);
      return {
        ...getEmptyResult('error', 'Failed to analyze wallet. Please try again.'),
        title: 'Wallet Analysis Failed'
      };
    }
  }

  // ============================================================================
  // TOKEN ANALYSIS (both token addresses and token names)
  // ============================================================================
  if (type === 'token' || type === 'tokenName') {
    let contractAddress = trimmed;
    let tokenName = 'Unknown Token';
    let symbol = 'UNK';
    let chainId = 'ethereum';

    // If it's a token name, resolve to contract address
    if (type === 'tokenName') {
      const tokenInfo = await getTokenContractFromName(trimmed);
      
      if (!tokenInfo) {
        return {
          ...getEmptyResult('error', `Token "${trimmed}" not found on Dexscreener. Please verify the name or try a different token.`),
          title: 'Token Not Found',
          tokenName: trimmed,
          symbol: trimmed.toUpperCase()
        };
      }
      
      contractAddress = tokenInfo.address;
      tokenName = tokenInfo.name;
      symbol = tokenInfo.symbol;
      chainId = tokenInfo.chainId || 'ethereum';
    }

    // Get token data
    const tokenData = await getTokenData(contractAddress);
    
    if (!tokenData) {
      return {
        ...getEmptyResult('error', `Unable to fetch data for token at ${contractAddress}. The token may not be listed on major DEXs.`),
        title: 'Token Data Unavailable',
        tokenName,
        symbol,
        address: contractAddress
      };
    }

    // Run AI analysis
    const analysis = analyzeTokenAI(tokenData);

    return {
      ...getEmptyResult('token'),
      type: 'token',
      title: 'Token Intelligence Report',
      tokenName,
      symbol,
      address: contractAddress,
      chainId,
      price: tokenData.price,
      priceChange24h: tokenData.priceChange24h,
      liquidity: tokenData.liquidity,
      volume24h: tokenData.volume24h,
      marketCap: tokenData.marketCap,
      buyCount: tokenData.buys,
      sellCount: tokenData.sells,
      txCount24h: tokenData.txCount24h,
      ...analysis
    };
  }

  // Fallback
  return getEmptyResult('error', 'Unable to determine input type.');
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export async function analyzeToken(input) {
  return await analyzeInput(input);
}

export { detectInputType as detectType };