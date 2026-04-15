export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasUsed?: string;
  timeStamp?: string;
  isError?: string;
}

export interface WhaleResult {
  detected: boolean;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  transactions: number;
  volume: number;
  trend: 'ACCUMULATING' | 'DUMPING' | 'NEUTRAL';
}

const WHALE_THRESHOLD = 100000; // $100,000

export function detectWhales(transactions: WhaleTransaction[]): WhaleResult {
  if (!transactions || transactions.length === 0) {
    return {
      detected: false,
      level: 'LOW',
      transactions: 0,
      volume: 0,
      trend: 'NEUTRAL'
    };
  }

  const whaleTxs = transactions.filter(tx => {
    const value = parseFloat(tx.value) / 1e18;
    const usdValue = value * 3000;
    return usdValue > WHALE_THRESHOLD && tx.isError === '0';
  });

  const whaleCount = whaleTxs.length;
  const totalVolume = whaleTxs.reduce((sum, tx) => {
    const value = parseFloat(tx.value) / 1e18 * 3000;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  let level: WhaleResult['level'] = 'LOW';
  if (whaleCount >= 10) level = 'HIGH';
  else if (whaleCount >= 5) level = 'MEDIUM';

  const now = Date.now();
  const recent24h = whaleTxs.filter(tx => now - Number(tx.timeStamp || '0') * 1000 < 24 * 60 * 60 * 1000);
  const prior24h = whaleTxs.filter(tx => {
    const age = now - Number(tx.timeStamp || '0') * 1000;
    return age >= 24 * 60 * 60 * 1000 && age < 48 * 60 * 60 * 1000;
  });

  const volumeSum = (items: WhaleTransaction[]) => items.reduce((sum, tx) => {
    const value = parseFloat(tx.value) / 1e18 * 3000;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const recentVolume = volumeSum(recent24h);
  const priorVolume = volumeSum(prior24h);

  let trend: WhaleResult['trend'] = 'NEUTRAL';
  if (recentVolume > priorVolume * 1.2 && recentVolume > 0) trend = 'ACCUMULATING';
  else if (priorVolume > recentVolume * 1.2 && priorVolume > 0) trend = 'DUMPING';

  return {
    detected: whaleCount > 0,
    level,
    transactions: whaleCount,
    volume: Math.round(totalVolume),
    trend
  };
}
