import axios from 'axios';

interface CoinGeckoPriceData {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export interface CoinGeckoTokenData {
  id: string;
  name: string;
  symbol: string;
  image?: {
    large?: string;
    thumb?: string;
  };
  market_data?: {
    current_price?: { usd: number };
    total_volume?: { usd: number };
    market_cap?: { usd: number };
    price_change_percentage_24h?: number;
  };
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasUsed?: string;
  timeStamp?: string;
  isError?: string;
}

const API_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCache(key: string) {
  const cached = API_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  API_CACHE.set(key, { data, timestamp: Date.now() });
}

export async function fetchTokenData(address: string): Promise<CoinGeckoTokenData | null> {
  const cacheKey = `token_${address}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const normalizedAddress = address.toLowerCase();
  const tokenMap: Record<string, string> = {
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'weth',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai',
    '0x29850d235b58abf2b645d3e83a6bf7ef50fd59d5': 'pepe'
  };

  try {
    let response;
    try {
      response = await axios.get<CoinGeckoTokenData>(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${normalizedAddress}`);
    } catch (firstError) {
      const tokenId = tokenMap[normalizedAddress];
      if (!tokenId) {
        throw firstError;
      }
      response = await axios.get<CoinGeckoTokenData>(`https://api.coingecko.com/api/v3/coins/${tokenId}`);
    }

    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching token data:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function fetchTransactions(address: string): Promise<Transaction[]> {
  const cacheKey = `tx_${address}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      },
      timeout: 10000
    });

    const transactions = (response.data?.result || []) as Transaction[];
    setCache(cacheKey, transactions);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function fetchPrice(tokenId: string): Promise<CoinGeckoPriceData | null> {
  const cacheKey = `price_${tokenId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get<CoinGeckoPriceData>('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: tokenId,
        vs_currencies: 'usd',
        include_24hr_change: 'true'
      },
      timeout: 10000
    });

    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching price:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function fetchAllData(address: string) {
  const [tokenData, transactions] = await Promise.all([
    fetchTokenData(address),
    fetchTransactions(address)
  ]);

  const tokenId = tokenData?.id || '';
  const priceData = tokenId ? await fetchPrice(tokenId) : null;

  return { tokenData, transactions, priceData };
}
