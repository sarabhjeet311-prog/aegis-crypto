/**
 * Leaderboard System for AEGIS Crypto Scanner (TypeScript Version)
 * Tracks scan history using localStorage
 */

export interface LeaderboardEntry {
  name: string;
  symbol: string;
  logo: string;
  scans: number;
  aegisScore: number;
  type: 'token' | 'wallet';
  lastScan: number;
}

export interface LeaderboardEntryWithKey extends LeaderboardEntry {
  key: string;
}

type LeaderboardStorage = Record<string, LeaderboardEntry>;

const LEADERBOARD_KEY = 'aegis_leaderboard';
const LAST_SCAN_KEY = 'aegis_last_scan';
const isBrowser = typeof window !== 'undefined';

const DEMO_DATA: LeaderboardStorage = {
  WETH: { name: 'WETH', symbol: 'WETH', logo: 'https://assets.coingecko.com/coins/images/2518/large/weth.png', scans: 156, aegisScore: 85, type: 'token', lastScan: Date.now() - 3600000 },
  USDT: { name: 'USDT', symbol: 'USDT', logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', scans: 142, aegisScore: 90, type: 'token', lastScan: Date.now() - 7200000 },
  USDC: { name: 'USDC', symbol: 'USDC', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png', scans: 138, aegisScore: 88, type: 'token', lastScan: Date.now() - 10800000 },
  DAI: { name: 'DAI', symbol: 'DAI', logo: 'https://assets.coingecko.com/coins/images/9956/large/4943.png', scans: 95, aegisScore: 82, type: 'token', lastScan: Date.now() - 14400000 },
  PEPE: { name: 'PEPE', symbol: 'PEPE', logo: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg', scans: 87, aegisScore: 45, type: 'token', lastScan: Date.now() - 18000000 },
  ETH: { name: 'Ethereum', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', scans: 234, aegisScore: 95, type: 'token', lastScan: Date.now() - 1800000 },
  BTC: { name: 'Bitcoin (Wrapped)', symbol: 'BTC', logo: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png', scans: 189, aegisScore: 92, type: 'token', lastScan: Date.now() - 5400000 },
  LINK: { name: 'Chainlink', symbol: 'LINK', logo: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', scans: 76, aegisScore: 78, type: 'token', lastScan: Date.now() - 21600000 },
  UNI: { name: 'Uniswap', symbol: 'UNI', logo: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png', scans: 65, aegisScore: 80, type: 'token', lastScan: Date.now() - 25200000 },
  AAVE: { name: 'Aave', symbol: 'AAVE', logo: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png', scans: 54, aegisScore: 83, type: 'token', lastScan: Date.now() - 28800000 }
};

export function getLeaderboardData(): LeaderboardStorage {
  if (!isBrowser) {
    return DEMO_DATA;
  }

  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LeaderboardStorage;
      return { ...DEMO_DATA, ...parsed };
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }

  return DEMO_DATA;
}

export function getLeaderboard(): LeaderboardEntryWithKey[] {
  const data = getLeaderboardData();
  return Object.entries(data as LeaderboardStorage)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.scans - a.scans);
}

export function getTopEntries(limit = 10): LeaderboardEntryWithKey[] {
  return getLeaderboard().slice(0, limit);
}

export type LeaderboardEntryPayload = {
  name?: string;
  symbol?: string;
  logo?: string;
  aegisScore?: number;
  type?: 'token' | 'wallet';
};

export function updateLeaderboard(
  token: string | { name: string; symbol: string; logo?: string; aegisScore?: number; type?: 'token' | 'wallet' },
  data?: LeaderboardEntryPayload
): void {
  if (!isBrowser) {
    return;
  }

  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);
    const leaderboard = stored ? (JSON.parse(stored) as LeaderboardStorage) : {};

    let key: string;
    let entryData: LeaderboardEntryPayload = {};

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
      scans: (existing.scans || 0) + 1,
      aegisScore: entryData.aegisScore || existing.aegisScore || 50,
      type: entryData.type || existing.type || 'token',
      lastScan: Date.now()
    };

    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

export function getEntry(key: string): LeaderboardEntry | null {
  const data = getLeaderboardData();
  return data[key] || null;
}

export function clearLeaderboard(): void {
  if (!isBrowser) {
    return;
  }
  window.localStorage.removeItem(LEADERBOARD_KEY);
}

export function getLastScan(): unknown | null {
  if (!isBrowser) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LAST_SCAN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading last scan:', error);
    return null;
  }
}

export function saveLastScan(result: unknown): void {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(result));
  } catch (error) {
    console.error('Error saving last scan:', error);
  }
}

export function getStats(): {
  totalEntries: number;
  totalScans: number;
  tokenScans: number;
  walletScans: number;
  avgScore: number;
} {
  const data = getLeaderboardData();
  const entries = Object.values(data as LeaderboardStorage);

  const totalScans = entries.reduce((sum, entry) => sum + entry.scans, 0);
  const tokenScans = entries.filter((entry) => entry.type === 'token').reduce((sum, entry) => sum + entry.scans, 0);
  const walletScans = entries.filter((entry) => entry.type === 'wallet').reduce((sum, entry) => sum + entry.scans, 0);

  return {
    totalEntries: entries.length,
    totalScans,
    tokenScans,
    walletScans,
    avgScore: entries.length > 0 ? Math.round(entries.reduce((sum, entry) => sum + entry.aegisScore, 0) / entries.length) : 0
  };
}
