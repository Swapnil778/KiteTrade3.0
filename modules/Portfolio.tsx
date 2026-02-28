
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_HOLDINGS, MOCK_TRADE_HISTORY } from '../constants';
import { 
  BarChart3, 
  Inbox, 
  RefreshCcw, 
  Sparkles, 
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  Trash2,
  AlertCircle,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Holding, Stock, Order } from '../types';
import { GoogleGenAI } from "@google/genai";

const Portfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'positions' | 'history'>('holdings');
  const [holdings, setHoldings] = useState<Holding[]>(MOCK_HOLDINGS);
  const [tradeHistory, setTradeHistory] = useState<Order[]>([]);
  const userId = localStorage.getItem('kite_current_user_id') || 'demo_user';

  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        const res = await fetch(`/api/user/trade-history?userId=${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTradeHistory(data);
        }
      } catch (err) {
        console.error("Failed to fetch trade history:", err);
      }
    };
    fetchTradeHistory();
  }, [userId]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL' | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<string>('');
  const [tradeStopLoss, setTradeStopLoss] = useState<string>('');
  const [isSettingSL, setIsSettingSL] = useState<Holding | null>(null);
  const [tempSL, setTempSL] = useState<string>('');

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'UPDATE' || message.type === 'INITIAL_STATE') {
            const stocks: Stock[] = message.data;
            setHoldings(prev => {
              let updated = [...prev];
              const triggers: Holding[] = [];

              updated = updated.map(holding => {
                const stock = stocks.find(s => s.symbol === holding.symbol);
                if (stock) {
                  const currentValue = stock.ltp * holding.quantity;
                  
                  // Check Stop-Loss
                  if (holding.stopLoss && stock.ltp <= holding.stopLoss) {
                    triggers.push({ ...holding, ltp: stock.ltp });
                  }

                  return {
                    ...holding,
                    ltp: stock.ltp,
                    currentValue: currentValue,
                    totalPnL: currentValue - holding.investedValue,
                    isUp: stock.isUp
                  };
                }
                return holding;
              });

              if (triggers.length > 0) {
                triggers.forEach(h => {
                  const sellOrder: Order = {
                    id: `sl-${Date.now()}-${h.symbol}-${Math.random().toString(36).substr(2, 5)}`,
                    symbol: h.symbol,
                    type: 'SELL',
                    status: 'COMPLETED',
                    price: h.ltp,
                    quantity: h.quantity,
                    time: new Date().toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) + ' (Auto SL)'
                  };
                  setTradeHistory(prevHistory => [sellOrder, ...prevHistory]);
                });
                
                // Show a combined alert or notification if possible, but for now alert is fine
                if (triggers.length === 1) {
                  alert(`AUTO-SELL TRIGGERED: ${triggers[0].symbol} sold at ${triggers[0].ltp} (Stop-Loss: ${triggers[0].stopLoss})`);
                } else {
                  alert(`AUTO-SELL TRIGGERED for ${triggers.length} holdings due to stop-loss breach.`);
                }

                return updated.filter(h => !triggers.some(t => t.symbol === h.symbol));
              }

              return updated;
            });
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      };

      socket.onopen = () => console.log('Portfolio connected to price feed');
      socket.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleTrade = (holding: Holding, type: 'BUY' | 'SELL') => {
    setSelectedHolding(holding);
    setTradeType(type);
    setTradeQuantity('');
    setTradeStopLoss(holding.stopLoss?.toString() || '');
  };

  const handleOpenSLModal = (holding: Holding) => {
    setIsSettingSL(holding);
    setTempSL(holding.stopLoss?.toString() || '');
  };

  const handleSaveSL = () => {
    if (!isSettingSL) return;
    const sl = parseFloat(tempSL);
    
    if (!isNaN(sl) && sl > 0 && sl >= isSettingSL.ltp) {
      alert("Stop-loss must be lower than the current market price (LTP).");
      return;
    }

    setHoldings(prev => prev.map(h => 
      h.symbol === isSettingSL.symbol 
        ? { ...h, stopLoss: !isNaN(sl) && sl > 0 ? sl : undefined } 
        : h
    ));
    setIsSettingSL(null);
  };

  const handleConfirmTrade = () => {
    if (!selectedHolding || !tradeType || !tradeQuantity) return;
    const qty = parseInt(tradeQuantity);
    if (isNaN(qty) || qty <= 0) return;
    const sl = parseFloat(tradeStopLoss);

    // Validation: Stop loss should be below LTP for long positions
    if (!isNaN(sl) && sl > 0 && sl >= selectedHolding.ltp) {
      alert("Stop-loss must be lower than the current market price (LTP).");
      return;
    }

    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === selectedHolding.symbol);
      
      // Record trade in history
      const newTrade: Order = {
        id: `th-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        symbol: selectedHolding.symbol,
        type: tradeType,
        status: 'COMPLETED',
        price: selectedHolding.ltp,
        quantity: qty,
        time: new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setTradeHistory(prevHistory => [newTrade, ...prevHistory]);

      if (existing) {
        if (tradeType === 'BUY') {
          const newQty = existing.quantity + qty;
          const newInvested = existing.investedValue + (qty * existing.ltp);
          return prev.map(h => h.symbol === selectedHolding.symbol ? {
            ...h,
            quantity: newQty,
            investedValue: newInvested,
            avgPrice: newInvested / newQty,
            currentValue: newQty * h.ltp,
            totalPnL: (newQty * h.ltp) - newInvested,
            stopLoss: !isNaN(sl) && sl > 0 ? sl : h.stopLoss
          } : h);
        } else {
          const newQty = Math.max(0, existing.quantity - qty);
          if (newQty === 0) return prev.filter(h => h.symbol !== selectedHolding.symbol);
          const ratio = newQty / existing.quantity;
          const newInvested = existing.investedValue * ratio;
          return prev.map(h => h.symbol === selectedHolding.symbol ? {
            ...h,
            quantity: newQty,
            investedValue: newInvested,
            currentValue: newQty * h.ltp,
            totalPnL: (newQty * h.ltp) - newInvested,
            stopLoss: !isNaN(sl) && sl > 0 ? sl : h.stopLoss
          } : h);
        }
      }
      return prev;
    });

    setSelectedHolding(null);
    setTradeType(null);
    setTradeStopLoss('');
  };

  const historicalPnL = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      pnl: parseFloat(((Math.random() - 0.3) * 500 + (i * 50)).toFixed(2))
    }));
  }, []);

  const totalInvested = holdings.reduce((acc, h) => acc + h.investedValue, 0);
  const currentValue = holdings.reduce((acc, h) => acc + h.currentValue, 0);
  const totalPnL = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const handleResetHoldings = () => {
    setHoldings(MOCK_HOLDINGS);
    setTradeHistory(MOCK_TRADE_HISTORY);
  };
  const handleClearHoldings = () => {
    setHoldings([]);
    setTradeHistory([]);
    setAnalysisResult(null);
    setError(null);
  };

  const handleDeleteHolding = (symbol: string) => {
    if (window.confirm(`Are you sure you want to remove ${symbol} from your portfolio?`)) {
      setHoldings(prev => prev.filter(h => h.symbol !== symbol));
    }
  };

  const handleAnalyze = async () => {
    if (holdings.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const portfolioData = holdings.map(h => ({ pair: h.symbol, currentPnL: h.totalPnL }));
      const prompt = `Act as a senior Forex Portfolio Analyst. Analyze this portfolio concisely: ${JSON.stringify(portfolioData)}. 3 bullet points, under 80 words.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAnalysisResult(response.text || "No insights available.");
    } catch (err) {
      setError("Unable to generate analysis. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors">
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-40">
        <div className="flex px-2 border-b border-gray-100 dark:border-gray-900">
          <button 
            onClick={() => setActiveTab('holdings')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'holdings' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            Holdings ({holdings.length})
          </button>
          <button 
            onClick={() => setActiveTab('positions')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'positions' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            Positions (0)
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            History
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1 overflow-y-auto hide-scrollbar pb-48">
        {activeTab === 'history' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <History size={18} className="text-brand-500" />
                Recent Activity
              </h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">{tradeHistory.length} Trades</span>
            </div>
            
            {tradeHistory.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-900/50 bg-white dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-hidden shadow-soft">
                {tradeHistory.map((trade) => (
                  <div key={trade.id} className="p-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${trade.type === 'BUY' ? 'bg-kiteGreen/10 text-kiteGreen' : 'bg-kiteRed/10 text-kiteRed'}`}>
                        {trade.type === 'BUY' ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">{trade.symbol}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${trade.type === 'BUY' ? 'bg-kiteGreen/10 text-kiteGreen' : 'bg-kiteRed/10 text-kiteRed'}`}>
                            {trade.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">{trade.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                        {trade.quantity.toLocaleString()} @ {trade.price.toFixed(4)}
                      </p>
                      <p className="text-xs font-black text-gray-400 mt-1 tabular-nums">
                        ₹{(trade.quantity * trade.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                <History size={48} className="opacity-20 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">No Trade History</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Summary Card */}
        <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-900 shadow-soft transition-all">
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Invested</p>
              <p className="text-xl font-black text-gray-900 dark:text-gray-100 tabular-nums tracking-tighter">₹{totalInvested.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Current</p>
              <p className="text-xl font-black text-gray-900 dark:text-gray-100 tabular-nums tracking-tighter">₹{currentValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="col-span-2 pt-6 border-t border-gray-50 dark:border-gray-900/50">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total P&L</p>
                <div className="text-right">
                  <p className={`text-2xl font-black tracking-tighter tabular-nums ${totalPnL >= 0 ? 'text-kiteGreen' : 'text-kiteRed'}`}>
                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs font-black mt-1 ${totalPnL >= 0 ? 'text-kiteGreen' : 'text-kiteRed'}`}>
                    {totalPnL >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical P&L Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-900 shadow-soft transition-all">
          <h3 className="text-[11px] text-gray-400 uppercase font-black mb-6 tracking-widest">Performance History</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalPnL}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                />
                <YAxis 
                  hide
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-gray-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-black shadow-2xl border border-white/10">
                          {val >= 0 ? '+' : ''}₹{val.toLocaleString()}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pnl" radius={[6, 6, 6, 6]} barSize={32}>
                  {historicalPnL.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} 
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holdings List */}
        <div className="divide-y divide-gray-50 dark:divide-gray-900/50">
          {holdings.length > 0 ? (
            holdings.map((holding) => (
              <div 
                key={holding.symbol} 
                className="py-6 flex flex-col active:bg-gray-50 dark:active:bg-gray-900 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight italic uppercase">{holding.symbol}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded-full">Qty. {holding.quantity}</span>
                      {holding.stopLoss && (
                        <span className="text-[10px] font-black text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield size={10} /> SL {holding.stopLoss.toFixed(4)}
                        </span>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteHolding(holding.symbol); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 uppercase font-bold tracking-widest">Avg. {holding.avgPrice.toFixed(4)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-1.5 font-black tabular-nums ${holding.totalPnL >= 0 ? 'bg-kiteGreen/10 text-kiteGreen' : 'bg-kiteRed/10 text-kiteRed'}`}>
                      {holding.totalPnL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span className="text-base tracking-tight">
                        {holding.totalPnL >= 0 ? '+' : ''}{holding.totalPnL.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest">LTP {holding.ltp.toFixed(4)}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTrade(holding, 'BUY'); }}
                    className="flex-1 bg-brand-500/10 text-brand-500 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-brand-500 hover:text-white"
                  >
                    Buy More
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenSLModal(holding); }}
                    className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-500 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <Shield size={14} /> {holding.stopLoss ? 'Edit SL' : 'Set SL'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTrade(holding, 'SELL'); }}
                    className="flex-1 bg-kiteRed/10 text-kiteRed py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-kiteRed hover:text-white"
                  >
                    Sell / Exit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
              <Inbox size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">Empty Portfolio</p>
              <button onClick={handleResetHoldings} className="mt-6 text-brand-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-500/10 px-4 py-2 rounded-full transition-all">
                 <RefreshCcw size={14} /> Load Defaults
              </button>
            </div>
          )}
          <div className="p-8 flex justify-center">
            <button 
              onClick={handleClearHoldings}
              disabled={holdings.length === 0 && tradeHistory.length === 0}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <Trash2 size={16} /> Clear All Data
            </button>
          </div>
        </div>
      </>
    )}
  </div>
      
      {/* Footer P&L & AI button */}
      {activeTab !== 'history' && (
        <div className="fixed bottom-20 left-0 right-0 glass border-t border-gray-100/50 dark:border-gray-900/50 px-8 py-5 flex justify-between items-center z-40 max-w-md mx-auto rounded-t-3xl shadow-2xl">
          <div>
            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mb-1">Total P&L</p>
            <p className={`text-xl font-black tracking-tighter tabular-nums ${totalPnL >= 0 ? 'text-kiteGreen' : 'text-kiteRed'}`}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN')}
            </p>
          </div>
          <button 
            onClick={handleAnalyze}
            className="bg-brand-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl shadow-brand-500/25 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Analyze
          </button>
        </div>
      )}

      {/* Trade Modal */}
      {selectedHolding && tradeType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end" onClick={() => { setSelectedHolding(null); setTradeType(null); }}>
           <div className="bg-white dark:bg-black w-full rounded-t-3xl p-8 bottom-sheet-enter pb-12" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {tradeType === 'BUY' ? 'Buy' : 'Sell'} {selectedHolding.symbol}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">LTP: ₹{selectedHolding.ltp.toFixed(4)}</p>
                </div>
                <button onClick={() => { setSelectedHolding(null); setTradeType(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Quantity</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                    <input 
                      type="number" 
                      value={tradeQuantity}
                      onChange={(e) => setTradeQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-4 pl-10 pr-5 text-lg font-bold focus:ring-2 focus:ring-[#387ed1] transition-all"
                      autoFocus
                    />
                  </div>
                  {tradeType === 'SELL' && (
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Available: {selectedHolding.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Stop-Loss (Optional)</label>
                  <input 
                    type="number" 
                    value={tradeStopLoss}
                    onChange={(e) => setTradeStopLoss(e.target.value)}
                    placeholder="Trigger price"
                    className={`w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-4 px-5 text-lg font-bold focus:ring-2 transition-all ${
                      tradeStopLoss && parseFloat(tradeStopLoss) >= selectedHolding.ltp 
                        ? 'focus:ring-red-500 text-red-500' 
                        : 'focus:ring-[#df514c]'
                    }`}
                  />
                  {tradeStopLoss && parseFloat(tradeStopLoss) >= selectedHolding.ltp ? (
                    <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <AlertCircle size={10} /> Must be lower than LTP (₹{selectedHolding.ltp.toFixed(4)})
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Triggers alert if price falls below this value.</p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Estimated Value</span>
                  <span className="text-lg font-bold text-gray-800 dark:text-white">
                    ₹{((parseFloat(tradeQuantity) || 0) * selectedHolding.ltp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button 
                  onClick={handleConfirmTrade}
                  disabled={
                    !tradeQuantity || 
                    parseInt(tradeQuantity) <= 0 || 
                    (tradeStopLoss !== '' && parseFloat(tradeStopLoss) >= selectedHolding.ltp)
                  }
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all active:scale-95 ${
                    tradeType === 'BUY' 
                      ? 'bg-[#387ed1] text-white shadow-blue-500/20' 
                      : 'bg-[#df514c] text-white shadow-red-500/20'
                  } disabled:opacity-50 disabled:shadow-none`}
                >
                  CONFIRM {tradeType}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Stop-Loss Modal */}
      {isSettingSL && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end" onClick={() => setIsSettingSL(null)}>
           <div className="bg-white dark:bg-black w-full rounded-t-3xl p-8 bottom-sheet-enter pb-12" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Set Stop-Loss
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">{isSettingSL.symbol} • LTP: ₹{isSettingSL.ltp.toFixed(4)}</p>
                </div>
                <button onClick={() => setIsSettingSL(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Trigger Price</label>
                  <input 
                    type="number" 
                    value={tempSL}
                    onChange={(e) => setTempSL(e.target.value)}
                    placeholder="Enter SL price"
                    className={`w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-4 px-5 text-lg font-bold focus:ring-2 transition-all ${
                      tempSL && parseFloat(tempSL) >= isSettingSL.ltp 
                        ? 'focus:ring-red-500 text-red-500' 
                        : 'focus:ring-brand-500'
                    }`}
                    autoFocus
                  />
                  {tempSL && parseFloat(tempSL) >= isSettingSL.ltp ? (
                    <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <AlertCircle size={10} /> Must be lower than LTP (₹{isSettingSL.ltp.toFixed(4)})
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Automatic sell will trigger if price falls to or below this value.</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => { setTempSL(''); }}
                    className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-900 transition-all active:scale-95"
                  >
                    CLEAR SL
                  </button>
                  <button 
                    onClick={handleSaveSL}
                    disabled={
                      (tempSL !== '' && parseFloat(tempSL) >= isSettingSL.ltp)
                    }
                    className="flex-[2] py-4 rounded-xl font-bold text-lg bg-brand-500 text-white shadow-xl shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                  >
                    SAVE STOP-LOSS
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
