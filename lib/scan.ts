import axios from 'axios';
import { ethers } from 'ethers';

export interface TokenScanResult {
  name: string;
  symbol: string;
  address: string;
  price: number;
  marketCap: number;
  liquidity: number;
  volume: number;
  holderCount: number;
  riskLevel: 'Safe' | 'Risky';
  aegisScore: number;
  emojis: string;
  warnings: string[];
}

export interface WalletActivity {
  hash: string;
  timeStamp: number;
  valueEth: number;
  direction: 'IN' | 'OUT';
  to: string | null;
  from: string | null;
}

export interface WalletScanResult {
  wallet: string;
  balance: number;
  txCount: number;
  tokenContractCount: number;
  riskScore: number;
  status: 'Legit' | 'Suspicious' | 'Scammer';
  recentActivity: WalletActivity[];
  flags: string[];
  analytics: {
    knownScamInteractions: number;
    averageDailyTx: number;
  };
}

export interface AutoScanResult {
  type: 'token' | 'wallet';
  data: TokenScanResult | WalletScanResult;
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex';
const KNOWN_SCAM_SYMBOLS = ['SCAM', 'RUG', 'FLOKI', 'SAFEMOON', 'HONEY', 'RUGPULL'];
const KNOWN_SCAM_CONTRACTS = ['0x0000000000000000000000000000000000000000'];

function isEthereumAddress(value: string): boolean {
  return ethers.isAddress(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function fetchDexscreenerToken(address: string) {
  try {
    const result = await axios.get(`${DEXSCREENER_BASE}/tokens/${address}`, { timeout: 12000 });
    return result.data;
  } catch (error) {
    return null;
  }
}

async function searchDexscreenerToken(query: string) {
  try {
    const result = await axios.get(`${DEXSCREENER_BASE}/search?q=${encodeURIComponent(query)}`, { timeout: 12000 });
    return result.data;
  } catch (error) {
    return null;
  }
}

async function fetchTokenHolders(contractAddress: string): Promise<number> {
  if (!ETHERSCAN_API_KEY) {
    return 0;
  }

  try {
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'tokentx',
        contractaddress: contractAddress,
        page: 1,
        offset: 200,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      },
      timeout: 12000
    });

    const transactions = Array.isArray(response.data.result) ? response.data.result : [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx: any) => {
      if (tx.to) uniqueAddresses.add(tx.to.toLowerCase());
      if (tx.from) uniqueAddresses.add(tx.from.toLowerCase());
    });

    return uniqueAddresses.size;
  } catch (error) {
    return 0;
  }
}

async function fetchWalletTxList(address: string) {
  if (!ETHERSCAN_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 100,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      },
      timeout: 12000
    });

    return Array.isArray(response.data.result) ? response.data.result : [];
  } catch (error) {
    return [];
  }
}

async function fetchWalletTokenTxList(address: string) {
  if (!ETHERSCAN_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'tokentx',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 100,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      },
      timeout: 12000
    });

    return Array.isArray(response.data.result) ? response.data.result : [];
  } catch (error) {
    return [];
  }
}

async function fetchWalletBalance(address: string): Promise<number> {
  if (!ETHERSCAN_API_KEY) {
    return 0;
  }

  try {
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      },
      timeout: 12000
    });

    return Number(response.data.result || 0) / 1e18;
  } catch (error) {
    return 0;
  }
}

async function normalizeTokenPair(data: any) {
  const pair = data?.pairs?.[0] || data;
  if (!pair) return null;

  const token = pair.baseToken || pair.token || {};
  const price = Number(pair.priceUsd || 0);
  const marketCap = Number(pair.fdv || pair.marketCap || 0);
  const liquidity = Number(pair.liquidity?.usd || 0);
  const volume = Number(pair.volume?.h24 || 0);
  const holderCount = await fetchTokenHolders((token.address || '').toString());

  return {
    name: token.name || token.symbol || 'Unknown Token',
    symbol: token.symbol || 'UNKNOWN',
    address: (token.address || '').toString(),
    price,
    marketCap,
    liquidity,
    volume,
    holderCount
  };
}

export async function scanToken(input: string): Promise<TokenScanResult | null> {
  const normalized = input.trim();
  let data = null;

  if (isEthereumAddress(normalized)) {
    data = await fetchDexscreenerToken(normalized);
  }

  if (!data) {
    data = await searchDexscreenerToken(normalized);
  }

  if (!data) {
    return null;
  }

  const token = await normalizeTokenPair(data);
  if (!token) {
    return null;
  }

  const scoreComponents = [] as number[];
  if (token.liquidity > 0) scoreComponents.push(clamp(Math.log10(Math.max(token.liquidity, 1)) * 16, 0, 100));
  if (token.volume > 0) scoreComponents.push(clamp(Math.log10(Math.max(token.volume, 1)) * 14, 0, 100));
  scoreComponents.push(clamp((token.holderCount / 1000) * 100, 0, 100));
  scoreComponents.push(clamp(Math.log10(Math.max(token.marketCap, 1)) * 12, 0, 100));

  let aegisScore = Math.round(scoreComponents.reduce((sum, value) => sum + value, 0) / Math.max(scoreComponents.length, 1));
  if (token.liquidity < 15000) aegisScore -= 12;
  if (token.volume < 25000) aegisScore -= 10;
  if (token.holderCount < 100) aegisScore -= 15;
  if (token.marketCap < 100000) aegisScore -= 10;
  const warnings: string[] = [];

  if (token.liquidity < 10000) warnings.push('Low liquidity may increase slippage.');
  if (token.volume < 25000) warnings.push('Low 24h volume may signal limited market depth.');
  if (token.holderCount < 100) warnings.push('Small holder base may increase manipulation risk.');
  if (token.marketCap < 50000) warnings.push('Very low market cap detected.');
  if (!token.address) warnings.push('Token contract not available.');

  aegisScore = clamp(aegisScore, 0, 100);
  const riskLevel = aegisScore >= 70 ? 'Safe' : 'Risky';
  const emojis = aegisScore >= 70 ? '🟢' : aegisScore >= 50 ? '🟡' : '🔴';

  return {
    name: token.name,
    symbol: token.symbol,
    address: token.address,
    price: token.price,
    marketCap: token.marketCap,
    liquidity: token.liquidity,
    volume: token.volume,
    holderCount: token.holderCount,
    riskLevel,
    aegisScore,
    emojis,
    warnings
  };
}

export async function scanWallet(address: string): Promise<WalletScanResult | null> {
  const normalized = address.trim();
  if (!isEthereumAddress(normalized)) {
    return null;
  }

  const txList = await fetchWalletTxList(normalized);
  const tokenTxList = await fetchWalletTokenTxList(normalized);
  const balance = await fetchWalletBalance(normalized);

  const txCount = txList.length;
  const uniqueContracts = new Set<string>();

  tokenTxList.forEach((tx: any) => {
    if (tx.contractAddress) {
      uniqueContracts.add((tx.contractAddress as string).toLowerCase());
    }
  });

  const suspiciousTransfers = tokenTxList.filter((tx: any) => {
    const symbol = String(tx.tokenSymbol || '').toUpperCase();
    const contract = String(tx.contractAddress || '').toLowerCase();
    return KNOWN_SCAM_SYMBOLS.some((scam) => symbol.includes(scam)) || KNOWN_SCAM_CONTRACTS.includes(contract);
  });

  const recentActivity = txList.slice(0, 4).map((tx: any) => ({
    hash: tx.hash,
    timeStamp: Number(tx.timeStamp) * 1000,
    valueEth: Number(ethers.formatEther(tx.value || '0')),
    direction: tx.from?.toLowerCase() === normalized.toLowerCase() ? 'OUT' : 'IN',
    to: tx.to || null,
    from: tx.from || null
  }));

  const firstTxTime = txList.length ? Number(txList[txList.length - 1].timeStamp) * 1000 : Date.now();
  const activeDays = Math.max(1, (Date.now() - firstTxTime) / 1000 / 60 / 60 / 24);
  const averageDailyTx = Number((txCount / activeDays).toFixed(1));

  let riskScore = 25;
  if (txCount > 50) riskScore += 15;
  if (averageDailyTx > 5) riskScore += 15;
  if (uniqueContracts.size > 20) riskScore += 12;
  if (balance < 0.1) riskScore += 15;
  riskScore += suspiciousTransfers.length * 20;

  riskScore = clamp(riskScore, 0, 100);
  let status: WalletScanResult['status'] = 'Legit';
  if (riskScore >= 70) status = 'Scammer';
  else if (riskScore >= 40) status = 'Suspicious';

  const flags: string[] = [];
  if (balance < 0.1) flags.push('Low ether balance compared to transaction volume.');
  if (uniqueContracts.size > 20) flags.push('High cross-contract activity may indicate automated or risky behavior.');
  if (suspiciousTransfers.length > 0) flags.push('Interacted with potentially risky token contracts.');
  if (averageDailyTx > 5) flags.push('Above average transaction frequency detected.');
  if (!flags.length) flags.push('No strong risk flags detected.');

  return {
    wallet: normalized,
    balance: Number(balance.toFixed(6)),
    txCount,
    tokenContractCount: uniqueContracts.size,
    riskScore,
    status,
    recentActivity,
    flags,
    analytics: {
      knownScamInteractions: suspiciousTransfers.length,
      averageDailyTx: averageDailyTx
    }
  };
}

export async function scanAuto(input: string): Promise<AutoScanResult | null> {
  const normalized = input.trim();
  if (!normalized) {
    return null;
  }

  if (isEthereumAddress(normalized)) {
    const tokenResult = await scanToken(normalized);
    if (tokenResult && tokenResult.marketCap > 0) {
      return { type: 'token', data: tokenResult };
    }

    const walletResult = await scanWallet(normalized);
    if (walletResult) {
      return { type: 'wallet', data: walletResult };
    }
  }

  const tokenResult = await scanToken(normalized);
  if (tokenResult) {
    return { type: 'token', data: tokenResult };
  }

  return null;
}
