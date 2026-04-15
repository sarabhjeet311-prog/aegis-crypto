import React, { useEffect, useState } from 'react';
import { analyzeInput } from '../lib/scanEngine.js';
import { updateLeaderboard, getLastScan } from '../lib/leaderboard.js';
import RotatingCoin3D from '../components/RotatingCoin3D';

export default function ScannerPage() {
  const [inputValue, setInputValue] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanPhase, setScanPhase] = useState(''); // For detailed loading messages

  const handleScan = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    setScanResult(null); // Clear old result

    try {
      const result = await analyzeInput(inputValue.trim().toLowerCase());
      console.log('SCAN RESULT:', result);
      setScanResult(result);

      // Update leaderboard if successful scan
      if (result.type !== 'error') {
        updateLeaderboard(result.type === 'wallet' ? result.address : result.symbol, {
          name: result.tokenName || result.address,
          aegisScore: result.aegisScore,
          type: result.type
        });
        localStorage.setItem('aegisLastScan', JSON.stringify(result));
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setScanResult({
        type: 'error',
        title: 'Scan Failed',
        message: 'Unable to complete scan. Please check your connection and try again.',
        address: 'N/A',
        balance: 0,
        balanceUsd: 0,
        transactions: 0,
        chains: [],
        aegisScore: 0,
        walletType: 'N/A',
        behavior: 'N/A',
        risk: 'N/A',
        verdict: 'N/A',
        tokenName: 'N/A',
        symbol: 'N/A',
        liquidity: 0,
        volume24h: 0,
        marketCap: 0,
        buyCount: 0,
        sellCount: 0,
        whales: 'N/A',
        smartMoney: 'N/A',
        tradeStatus: 'N/A',
        rugPullProbability: 0
      });
    } finally {
      setLoading(false);
      setScanPhase('');
    }
  };

  const handleQuickScan = (value) => {
    setInputValue(value);
    setTimeout(() => handleScan(), 100);
  };

  useEffect(() => {
    const cached = getLastScan();
    if (cached) {
      setScanResult(cached);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 013 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">AEGIS</span>
            </div>
            
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Scanner */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
                  The Divine Shield<br />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">of Wealth</span>
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
                  AI-powered crypto intelligence system with advanced 3D visualization. 
                  Experience the future of digital asset protection with our premium rotating coin animation.
                </p>
              </div>

              {/* Scanner Input */}
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
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-xl"
                  >
                    {loading ? "Scanning..." : "Scan Now →"}
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      setInputValue("eth");
                      setTimeout(() => handleScan(), 100);
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/40 transition-all duration-200"
                  >
                    🪙 Demo Token
                  </button>
                  <button 
                    onClick={() => {
                      setInputValue("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
                      setTimeout(() => handleScan(), 100);
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/40 transition-all duration-200"
                  >
                    💼 Example Wallet
                  </button>
                </div>
                {loading && (
                  <p className="text-sm text-slate-400 mt-2">Analyzing on-chain data, liquidity depth and wallet behavior...</p>
                )}
              </div>

              {/* Scan Result */}
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
                  animation: !loading ? 'fadeIn 0.5s ease-out' : 'none',
                }}>
                  <style>{`
                    @keyframes fadeIn {
                      from { opacity: 0; transform: translateY(16px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                  `}</style>

                  {scanResult.type === 'error' && (
                    <>
                      <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#ef4444', fontWeight: 'bold' }}>
                        {scanResult.title}
                      </h2>
                      <p style={{ color: '#9ca3af' }}>{scanResult.message}</p>
                    </>
                  )}

                  {scanResult.type === 'token' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>
                          {scanResult.tokenName} ({scanResult.symbol})
                        </h2>
                        <span style={{ 
                          fontSize: '12px', 
                          padding: '4px 8px', 
                          background: '#1e3a5f', 
                          borderRadius: '6px',
                          color: '#60a5fa'
                        }}>
                          Token Analysis
                        </span>
                      </div>

                      {/* Market Data */}
                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <p><strong>Price 💲:</strong> ${scanResult.price?.toFixed(8) || 'N/A'}</p>
                        <p><strong>Market Cap 📊:</strong> ${scanResult.marketCap?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Liquidity 💧:</strong> ${scanResult.liquidity?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Volume 24h 📈:</strong> ${scanResult.volume24h?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Buy/Sell Count 🔄:</strong> {scanResult.buyCount?.toLocaleString() || 0} / {scanResult.sellCount?.toLocaleString() || 0}</p>
                      </div>

                      {/* AI Analysis */}
                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>
                          🧠 AI Analysis
                        </h3>
                        <p><strong>Whale Activity 🐋:</strong> {scanResult.whales || 'N/A'}</p>
                        <p><strong>Smart Money 💰:</strong> {scanResult.smartMoney || 'N/A'}</p>
                        <p><strong>AEGIS Score:</strong> <span style={{ 
                          color: scanResult.aegisScore >= 75 ? '#22c55e' : scanResult.aegisScore >= 50 ? '#eab308' : '#ef4444',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>{scanResult.aegisScore}/100</span></p>
                        <p><strong>Rug Pull Probability ⚠️:</strong> {scanResult.rugPullProbability}%</p>
                      </div>

                      {/* Risk Assessment */}
                      <div>
                        <p><strong>Risk Level:</strong> <span style={{ 
                          color: scanResult.risk.includes('🟢') ? '#22c55e' : scanResult.risk.includes('🟡') ? '#eab308' : '#ef4444'
                        }}>{scanResult.risk}</span></p>
                        <p><strong>Trade Status:</strong> <span style={{ 
                          color: scanResult.tradable.includes('✅') ? '#22c55e' : scanResult.tradable.includes('⚠️') ? '#eab308' : '#ef4444',
                          fontWeight: 'bold'
                        }}>{scanResult.tradable}</span></p>
                        <p style={{ marginTop: '12px', fontWeight: 'bold', fontSize: '16px', color: scanResult.verdict.includes('✅') ? '#22c55e' : scanResult.verdict.includes('⚠️') ? '#eab308' : '#ef4444' }}>
                          🎯 {scanResult.verdict}
                        </p>
                      </div>
                    </>
                  )}

                  {scanResult.type === 'wallet' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>
                          Wallet Intelligence
                        </h2>
                        <span style={{ 
                          fontSize: '12px', 
                          padding: '4px 8px', 
                          background: '#1e3a5f', 
                          borderRadius: '6px',
                          color: '#60a5fa'
                        }}>
                          Wallet Analysis
                        </span>
                      </div>

                      {/* Wallet Data */}
                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <p style={{ wordBreak: 'break-all' }}><strong>Address:</strong> <span style={{ color: '#9ca3af' }}>{scanResult.address}</span></p>
                        <p><strong>Balance:</strong> {scanResult.balance?.toFixed(6) || 0} ETH (${scanResult.balanceUsd?.toLocaleString() || '0'})</p>
                        <p><strong>Transactions:</strong> {scanResult.transactions?.toLocaleString() || 0}</p>
                        <p><strong>Chains:</strong> {scanResult.chains?.join(', ') || 'N/A'}</p>
                      </div>

                      {/* AI Analysis */}
                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#60a5fa' }}>
                          🧠 AI Analysis
                        </h3>
                        <p><strong>Wallet Type:</strong> {scanResult.walletType}</p>
                        <p><strong>Behavior:</strong> {scanResult.behavior}</p>
                        <p><strong>AEGIS Score:</strong> <span style={{ 
                          color: scanResult.aegisScore >= 75 ? '#22c55e' : scanResult.aegisScore >= 50 ? '#eab308' : '#ef4444',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>{scanResult.aegisScore}/100</span></p>
                      </div>

                      {/* Risk Assessment */}
                      <div>
                        <p><strong>Risk Profile:</strong> <span style={{ 
                          color: scanResult.risk.includes('🟢') ? '#22c55e' : scanResult.risk.includes('🟡') ? '#eab308' : '#ef4444'
                        }}>{scanResult.risk}</span></p>
                        <p style={{ marginTop: '12px', fontWeight: 'bold', fontSize: '16px', color: scanResult.verdict.includes('✅') ? '#22c55e' : scanResult.verdict.includes('⚠️') ? '#eab308' : '#ef4444' }}>
                          🎯 {scanResult.verdict}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: 3D Rotating Coin */}
            <div className="flex justify-center lg:justify-end">
              <RotatingCoin3D size={400} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}