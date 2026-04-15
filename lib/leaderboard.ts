/**
 * Leaderboard System for AEGIS Crypto Scanner (TypeScript Version)
 * Tracks scan history using localStorage
 * 
 * Features:
 * - Persistent storage in localStorage
 * - Automatic sorting by scan count
 * - Support for both tokens and wallets
 * - Demo data for initial display
 */

export interface LeaderboardEntry {
  name: string;
  symbol: string;
  logo: string;
  scans: number;
  aegisScore: number;
  type?: string;
  lastScan?: number;
}

const LEADERBOARD_KEY = "aegis_leaderboard";
const LAST_SCAN_KEY = "aegis_last_scan";

// Demo data for initial display
const DEMO_DATA: Record<string, LeaderboardEntry> = {
  "WETH": { name: "WETH", symbol: "WETH", logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", scans: 156, aegisScore: 85, type: "token", lastScan: Date.now() - 3600000 },
  "USDT": { name: "USDT", symbol: "USDT", logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png", scans: 142, aegisScore: 90, type: "token", lastScan: Date.now() - 7200000 },
  "USDC": { name: "USDC", symbol: "USDC", logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", scans: 138, aegisScore: 88, type: "token", lastScan: Date.now() - 10800000 },
  "DAI": { name: "DAI", symbol: "DAI", logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", scans: 95, aegisScore: 82, type: "token", lastScan: Date.now() - 14400000 },
  "PEPE": { name: "PEPE", symbol: "PEPE", logo: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", scans: 87, aegisScore: 45, type: "token", lastScan: Date.now() - 18000000 },
  "ETH": { name: "Ethereum", symbol: "ETH", logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", scans: 234, aegisScore: 95, type: "token", lastScan: Date.now() - 1800000 },
  "BTC": { name: "Bitcoin (Wrapped)", symbol: "BTC", logo: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", scans: 189, aegisScore: 92, type: "token", lastScan: Date.now() - 5400000 },
  "LINK": { name: "Chainlink", symbol: "LINK", logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", scans: 76, aegisScore: 78, type: "token", lastScan: Date.now() - 21600000 },
  "UNI": { name: "Uniswap", symbol: "UNI", logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", scans: 65, aegisScore: 80, type: "token", lastScan: Date.now() - 25200000 },
  "AAVE": { name: "Aave", symbol: "AAVE", logo: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", scans: 54, aegisScore: 83, type: "token", lastScan: Date.now() - 28800000 }
};

/**
 * Get the leaderboard data from localStorage or use demo data
 */
export function getLeaderboardData(): Record<string, LeaderboardEntry> {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEMO_DATA, ...parsed };
    }
  } catch (e) {
    console.error('Error loading leaderboard:', e);
  }
  return DEMO_DATA;
}

/**
 * Get sorted leaderboard entries
 */
export function getLeaderboard(): LeaderboardEntry[] {
  const data = getLeaderboardData();
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.scans - a.scans);
}

/**
 * Get top entries from the leaderboard
 */
export function getTopEntries(limit = 10): LeaderboardEntry[] {
  return getLeaderboard().slice(0, limit);
}

/**
 * Updates the leaderboard with a new scan
 */
export function updateLeaderboard(token: string | { name: string; symbol: string; logo?: string; aegisScore?: number; type?: string }, data?: { name?: string; aegisScore?: number; type?: string; logo?: string }) {
  try {
    let leaderboard: Record<string, any> = {};
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      try {
        leaderboard = JSON.parse(stored);
      } catch {
        leaderboard = {};
      }
    }

    // Handle both string key and object parameter
    let key: string;
let entryData: { name?: string; aegisScore?: number; type?: string; logo?: string };
    
    if (typeof token === 'string') {
      key = token;
      entryData = data || {};
    } else {
      key = token.symbol;
      entryData = token;
    }

    const existing = leaderboard[key] || {};
    
    leaderboard[key] = {
      name: entryData.name || existing.name || key,
      symbol: key,
      logo: entryData.logo || existing.logo || '',
      scans: (existing.scans || 0) + 2,
      aegisScore: entryData.aegisScore || existing.aegisScore || 50,
      type: entryData.type || existing.type || 'token',
      lastScan: Date.now()
    };

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (e) {
    console.error('Error updating leaderboard:', e);
  }
}

/**
 * Get a specific leaderboard entry
 */
export function getEntry(key: string): LeaderboardEntry | null {
  const data = getLeaderboardData();
  return data[key] || null;
}

/**
 * Clear the leaderboard
 */
export function clearLeaderboard(): void {
  localStorage.removeItem(LEADERBOARD_KEY);
}

/**
 * Get the last scan result from localStorage
 */
export function getLastScan(): any | null {
  try {
    const stored = localStorage.getItem(LAST_SCAN_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading last scan:', e);
  }
  return null;
}

/**
 * Save the last scan result to localStorage
 */
export function saveLastScan(result: any): void {
  try {
    localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(result));
  } catch (e) {
    console.error('Error saving last scan:', e);
  }
}

/**
 * Get scan statistics
 */
export function getStats(): { totalEntries: number; totalScans: number; tokenScans: number; walletScans: number; avgScore: number } {
  const data = getLeaderboardData();
  const entries = Object.values(data);
  
  const totalScans = entries.reduce((sum, entry) => sum + (entry.scans || 0), 0);
  const tokenScans = entries.filter(e => e.type === 'token').reduce((sum, e) => sum + (e.scans || 0), 0);
  const walletScans = entries.filter(e => e.type === 'wallet').reduce((sum, e) => sum + (e.scans || 0), 0);
  
  return {
    totalEntries: entries.length,
    totalScans,
    tokenScans,
    walletScans,
    avgScore: entries.length > 0 
      ? Math.round(entries.reduce((sum, e) => sum + (e.aegisScore || 50), 0) / entries.length)
      : 0
  };
}