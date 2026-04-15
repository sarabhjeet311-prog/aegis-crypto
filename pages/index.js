import React, { useEffect, useState } from 'react';
import { getLastScan, saveLastScan, updateLeaderboard, getLeaderboard, getStats } from '../lib/leaderboard';
import RotatingCoin3D from '../components/RotatingCoin3D';

const initialStats = {
  totalEntries: 0,
  totalScans: 0,
  tokenScans: 0,
  walletScans: 0,
  avgScore: 0
};

export default function ScannerPage() {
  const [inputValue, setInputValue] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshLeaderboard = () => {
    if (typeof window === 'undefined') return;
    setLeaderboardEntries(getLeaderboard());
    setStats(getStats());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = getLastScan();
    if (cached) {
      setScanResult(cached);
    }
    refreshLeaderboard();
  }, []);

  const handleScan = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setScanResult(null);

    try {
      const response = await fetch('/api/scan/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputValue.trim() })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to complete scan.');
      }

      const result = {
        type: payload.type,
        data: payload.data
      };

      setScanResult(result);
      saveLastScan(result);

      if (result.type === 'wallet') {
        updateLeaderboard(result.data.wallet, {
          name: result.data.wallet,
          aegisScore: result.data.riskScore,
          type: 'wallet'
        });
      } else if (result.type === 'token') {
        updateLeaderboard(result.data.symbol, {
          name: result.data.name,
          aegisScore: result.data.aegisScore,
          type: 'token'
        });
      }

      refreshLeaderboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      setErrorMessage(message);
      setScanResult({ type: 'error', title: 'Scan Failed', message });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = (value) => {
    setInputValue(value);
    setTimeout(() => handleScan(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="fixed top-0 left-0 right-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 013 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">AEGIS</span>
            </div>
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
                  The Divine Shield
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">of Wealth</span>
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
                  AI-powered crypto intelligence system with advanced 3D visualization. Experience the future of digital asset protection with our premium rotating coin animation.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    type="text"
                    placeholder="Enter token or wallet address..."
                    className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    {loading ? 'Scanning...' : 'Scan Now'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleQuickScan('eth')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/40 transition-all duration-200"
                  >
                    🧪 Demo Token
                  </button>
                  <button
                    onClick={() => handleQuickScan('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/40 transition-all duration-200"
                  >
                    👛 Example Wallet
                  </button>
                </div>
                {loading && <p className="text-sm text-slate-400 mt-2">Analyzing on-chain data, liquidity depth and wallet behavior...</p>}
                {errorMessage && <p className="text-sm text-red-400 mt-2">{errorMessage}</p>}
              </div>

              {scanResult && (
                <div style={{
                  marginTop: '25px',
                  padding: '24px',
                  background: '#020617',
                  border: '1px solid #1f2937',
                  borderRadius: '16px',
                  color: '#e5e7eb',
                  lineHeight: '1.8',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: loading ? 0.8 : 1,
                  transform: loading ? 'translateY(8px)' : 'translateY(0)',
                  animation: !loading ? 'fadeIn 0.5s ease-out' : 'none'
                }}>
                  <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                  {scanResult.type === 'error' && (
                    <>
                      <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#ef4444', fontWeight: 'bold' }}>{scanResult.title}</h2>
                      <p style={{ color: '#9ca3af' }}>{scanResult.message}</p>
                    </>
                  )}

                  {scanResult.type === 'token' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>{scanResult.data.name} ({scanResult.data.symbol})</h2>
                        <span style={{ fontSize: '12px', padding: '4px 8px', background: '#1e3a5f', borderRadius: '6px', color: '#60a5fa' }}>Token Analysis</span>
                      </div>

                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <p><strong>Price 💰:</strong> ${scanResult.data.price?.toLocaleString(undefined, { maximumFractionDigits: 8 }) || 'N/A'}</p>
                        <p><strong>Market Cap 📊:</strong> ${scanResult.data.marketCap?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Liquidity 💧:</strong> ${scanResult.data.liquidity?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Volume 24h 📈:</strong> ${scanResult.data.volume?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Holders 👥:</strong> {scanResult.data.holderCount || 'N/A'}</p>
                      </div>

                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>🤖 AI Analysis</h3>
                        <p><strong>AEGIS Score:</strong> <span style={{ color: scanResult.data.aegisScore >= 75 ? '#22c55e' : scanResult.data.aegisScore >= 50 ? '#eab308' : '#ef4444', fontWeight: 'bold', fontSize: '18px' }}>{scanResult.data.aegisScore}/100</span></p>
                        <p><strong>Risk Level:</strong> {scanResult.data.riskLevel} {scanResult.data.emojis}</p>
                        {scanResult.data.warnings?.length > 0 && <p><strong>Warnings:</strong> {scanResult.data.warnings.join(' ')}</p>}
                      </div>
                    </>
                  )}

                  {scanResult.type === 'wallet' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>Wallet Intelligence</h2>
                        <span style={{ fontSize: '12px', padding: '4px 8px', background: '#1e3a5f', borderRadius: '6px', color: '#60a5fa' }}>Wallet Risk</span>
                      </div>

                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <p><strong>Wallet:</strong> {scanResult.data.wallet}</p>
                        <p><strong>Status:</strong> {scanResult.data.status}</p>
                        <p><strong>Risk Score:</strong> {scanResult.data.riskScore}</p>
                        <p><strong>Balance:</strong> {scanResult.data.balance} ETH</p>
                        <p><strong>Transactions:</strong> {scanResult.data.txCount}</p>
                      </div>

                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>🚩 Flags</h3>
                        {scanResult.data.flags?.map((flag, index) => (
                          <p key={index}><strong>-</strong> {flag}</p>
                        ))}
                      </div>

                      {scanResult.data.recentActivity?.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>Recent Activity</h3>
                          {scanResult.data.recentActivity.map((tx, index) => (
                            <p key={index}>{new Date(tx.timeStamp).toLocaleString()} • {tx.direction} • {tx.valueEth.toFixed(4)} ETH</p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative z-10">
              <div className="glass rounded-[40px] p-8 min-h-[540px] flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-blue-300">AEGIS Shield</p>
                    <h2 className="text-4xl font-extrabold text-white">Real-time risk intelligence.</h2>
                    <p className="mt-4 text-gray-300 leading-relaxed">Scan tokens and wallets with our serverless API and get fast, trusted risk signals built for Vercel.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
                      <p className="text-sm text-slate-400">Current scans</p>
                      <p className="mt-4 text-3xl font-semibold text-white">1,482</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
                      <p className="text-sm text-slate-400">Threat accuracy</p>
                      <p className="mt-4 text-3xl font-semibold text-white">93.4%</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-8">
                  <RotatingCoin3D size={280} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 rounded-3xl border border-white/10 bg-slate-950/70 p-8">
                <h3 className="text-xl font-semibold text-white">Leaderboard</h3>
                <p className="mt-2 text-sm text-slate-400">Top tokens and wallets scanned recently.</p>
                <div className="mt-6 space-y-4">
                  {leaderboardEntries.slice(0, 6).map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                      <div>
                        <p className="font-semibold text-white">{entry.name}</p>
                        <p className="text-sm text-slate-400">{entry.type === 'wallet' ? 'Wallet' : entry.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Score</p>
                        <p className="font-semibold text-white">{entry.aegisScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-1/3 rounded-3xl border border-white/10 bg-slate-950/70 p-8">
                <h3 className="text-xl font-semibold text-white">Quick stats</h3>
                <div className="mt-6 space-y-4 text-slate-300">
                  <p><strong>Total scans:</strong> {stats.totalScans}</p>
                  <p><strong>Token scans:</strong> {stats.tokenScans}</p>
                  <p><strong>Wallet scans:</strong> {stats.walletScans}</p>
                  <p><strong>Average score:</strong> {stats.avgScore}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
