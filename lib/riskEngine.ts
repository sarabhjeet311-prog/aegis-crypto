export interface RiskData {
  liquidity?: number;
  holders?: number;
  whaleActivity?: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    transactions: number;
  };
  marketCap?: number;
  volume24h?: number;
}

export interface RiskResult {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  reasons: string[];
}

const LIQUIDITY_THRESHOLD_LOW = 10000;
const LIQUIDITY_THRESHOLD_HIGH = 100000;
const HOLDERS_THRESHOLD_LOW = 50;
const HOLDERS_THRESHOLD_HIGH = 200;

export function calculateRisk(data: RiskData): RiskResult {
  let score = 0;
  const reasons: string[] = [];

  if (data.liquidity !== undefined) {
    if (data.liquidity < LIQUIDITY_THRESHOLD_LOW) {
      score += 40;
      reasons.push('Extremely low liquidity');
    } else if (data.liquidity < LIQUIDITY_THRESHOLD_HIGH) {
      score += 20;
      reasons.push('Low liquidity');
    }
  }

  if (data.holders !== undefined) {
    if (data.holders < HOLDERS_THRESHOLD_LOW) {
      score += 30;
      reasons.push('Very few holders');
    } else if (data.holders < HOLDERS_THRESHOLD_HIGH) {
      score += 15;
      reasons.push('Limited holder distribution');
    }
  }

  if (data.whaleActivity) {
    if (data.whaleActivity.level === 'HIGH') {
      score += 25;
      reasons.push('High whale activity detected');
    } else if (data.whaleActivity.level === 'MEDIUM') {
      score += 15;
      reasons.push('Moderate whale activity');
    }
  }

  if (data.marketCap && data.volume24h) {
    const volumeRatio = data.volume24h / data.marketCap;
    if (volumeRatio < 0.01) {
      score += 20;
      reasons.push('Low trading volume relative to market cap');
    }
  }

  score = Math.max(0, Math.min(100, score));

  let level: RiskResult['level'] = 'LOW';
  if (score >= 70) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';

  return { level, score, reasons };
}
