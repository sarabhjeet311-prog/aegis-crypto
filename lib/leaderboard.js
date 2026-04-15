/**
 * Leaderboard System for AEGIS Crypto Scanner
 * Tracks scan history using localStorage
 * 
 * Features:
 * - Persistent storage in localStorage
 * - Automatic sorting by scan count
 * - Support for both tokens and wallets
 * - Demo data for initial display
 */

const LEADERBOARD_KEY = "aegis_leaderboard";
const LAST_SCAN_KEY = "aegis_last_scan";

// Demo data for initial display
const DEMO_DATA = {
  "WETH": { name: "WETH", scans: 156, aegisScore: 85, type: "token", lastScan: Date.now() - 3600000 },
  "USDT": { name: "USDT", scans: 142, aegisScore: 90, type: "token", lastScan: Date.now() - 7200000 },
  "USDC": { name: "USDC", scans: 138, aegisScore: 88, type: "token", lastScan: Date.now() - 10800000 },
  "DAI": { name: "DAI", scans: 95, aegisScore: 82, type: "token", lastScan: Date.now() - 14400000 },
  "PEPE": { name: "PEPE", scans: 87, aegisScore: 45, type: "token", lastScan: Date.now() - 18000000 },
  "ETH": { name: "Ethereum", scans: 234, aegisScore: 95, type: "token", lastScan: Date.now() - 1800000 },
  "BTC": { name: "Bitcoin (Wrapped)", scans: 189, aegisScore: 92, type: "token", lastScan: Date.now() - 5400000 },
  "LINK": { name: "Chainlink", scans: 76, aegisScore: 78, type: "token", lastScan: Date.now() - 21600000 },
  "UNI": { name: "Uniswap", scans: 65, aegisScore: 80, type: "token", lastScan: Date.now() - 25200000 },
  "AAVE": { name: "Aave", scans: 54, aegisScore: 83, type: "token", lastScan: Date.now() - 28800000 }
};

/**
 * Get the leaderboard data from localStorage or use demo data
 * @returns {Object} Leaderboard data with token symbols and scores
 */
export function getLeaderboardData() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with demo data, user data takes precedence
      return { ...DEMO_DATA, ...parsed };
    }
  } catch (e) {
    console.error('Error loading leaderboard:', e);
  }
  return DEMO_DATA;
}

/**
 * Get sorted leaderboard entries
 * @returns {Array} Sorted array of leaderboard entries
 */
export function getLeaderboard() {
  const data = getLeaderboardData();
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.scans - a.scans);
}

/**
 * Get top entries from the leaderboard
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} Top entries sorted by scan count
 */
export function getTopEntries(limit = 10) {
  return getLeaderboard().slice(0, limit);
}

/**
 * Updates the leaderboard with a new scan
 * @param {string} key - The token symbol or wallet address to add
 * @param {Object} data - Optional additional data (name, aegisScore, type)
 */
export function updateLeaderboard(key, data = {}) {
  try {
    let leaderboard = {};
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      try {
        leaderboard = JSON.parse(stored);
      } catch {
        leaderboard = {};
      }
    }

    const existing = leaderboard[key] || {};
    
    leaderboard[key] = {
      name: data.name || key,
      scans: (existing.scans || 0) + 2,
      aegisScore: data.aegisScore || existing.aegisScore || 50,
      type: data.type || existing.type || 'token',
      lastScan: Date.now()
    };

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (e) {
    console.error('Error updating leaderboard:', e);
  }
}

/**
 * Get a specific leaderboard entry
 * @param {string} key - The token symbol or wallet address
 * @returns {Object|null} The entry or null if not found
 */
export function getEntry(key) {
  const data = getLeaderboardData();
  return data[key] || null;
}

/**
 * Clear the leaderboard (useful for testing)
 */
export function clearLeaderboard() {
  localStorage.removeItem(LEADERBOARD_KEY);
}

/**
 * Get the last scan result from localStorage
 * @returns {Object|null} The last scan result or null
 */
export function getLastScan() {
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
 * @param {Object} result - The scan result to save
 */
export function saveLastScan(result) {
  try {
    localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(result));
  } catch (e) {
    console.error('Error saving last scan:', e);
  }
}

/**
 * Get scan statistics
 * @returns {Object} Statistics about scans
 */
export function getStats() {
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