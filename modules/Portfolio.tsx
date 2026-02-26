
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
  ArrowDownRight
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
  const [tradeHistory, setTradeHistory] = useState<Order[]>(MOCK_TRADE_HISTORY);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL' | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<string>('');
  const [tradeStopLoss, setTradeStopLoss] = useState<string>('');

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
            setHoldings(prev => prev.map(holding => {
              const stock = stocks.find(s => s.symbol === holding.symbol);
              if (stock) {
                const currentValue = stock.ltp * holding.quantity;
                
                // Check Stop-Loss
                if (holding.stopLoss && stock.ltp <= holding.stopLoss) {
                  alert(`STOP-LOSS TRIGGERED: ${holding.symbol} has dropped to ${stock.ltp}. Your stop-loss was set at ${holding.stopLoss}.`);
                  // Optionally clear stop-loss after trigger to avoid repeated alerts
                  holding.stopLoss = undefined;
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
            }));
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
        id: `th-${Date.now()}`,
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      <div className="sticky top-0 bg-white dark:bg-black z-40">
        <div className="flex px-4 border-b border-gray-100 dark:border-gray-900">
          <button 
            onClick={() => setActiveTab('holdings')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'holdings' ? 'border-[#387ed1] text-[#387ed1]' : 'border-transparent text-gray-500'}`}
          >
            Holdings ({holdings.length})
          </button>
          <button 
            onClick={() => setActiveTab('positions')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'positions' ? 'border-[#387ed1] text-[#387ed1]' : 'border-transparent text-gray-500'}`}
          >
            Positions (0)
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'history' ? 'border-[#387ed1] text-[#387ed1]' : 'border-transparent text-gray-500'}`}
          >
            Trade History
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto hide-scrollbar pb-40">
        {activeTab === 'history' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <History size={16} className="text-[#387ed1]" />
                Recent Transactions
              </h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tradeHistory.length} Trades</span>
            </div>
            
            {tradeHistory.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-900 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-900 overflow-hidden">
                {tradeHistory.map((trade) => (
                  <div key={trade.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trade.type === 'BUY' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                        {trade.type === 'BUY' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{trade.symbol}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${trade.type === 'BUY' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                            {trade.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{trade.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {trade.quantity.toLocaleString()} @ {trade.price.toFixed(4)}
                      </p>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                        ${(trade.quantity * trade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <History size={40} className="opacity-20 mb-3" />
                <p className="text-sm font-medium uppercase tracking-widest">No Trade History</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Summary Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-900 transition-colors">
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-bold mb-1">Invested</p>
              <p className="text-[17px] font-bold text-gray-800 dark:text-gray-100">${totalInvested.toLocaleString('en-US')}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 uppercase font-bold mb-1">Current</p>
              <p className="text-[17px] font-bold text-gray-800 dark:text-gray-100">${currentValue.toLocaleString('en-US')}</p>
            </div>
            <div className="col-span-2 pt-4 border-t border-gray-50 dark:border-gray-900">
              <div className="flex justify-between items-center">
                <p className="text-[13px] font-bold text-gray-400 uppercase">Total P&L</p>
                <div className="text-right">
                  <p className={`text-[17px] font-bold ${totalPnL >= 0 ? 'text-[#4caf50]' : 'text-[#df514c]'}`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US')}
                  </p>
                  <p className={`text-[11px] font-bold ${totalPnL >= 0 ? 'text-[#4caf50]' : 'text-[#df514c]'}`}>
                    {totalPnL >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical P&L Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-900 transition-colors">
          <h3 className="text-[11px] text-gray-400 uppercase font-bold mb-4 tracking-widest">7-Day P&L History</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalPnL}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                />
                <YAxis 
                  hide
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-gray-800 text-white px-2 py-1 rounded text-[10px] font-bold shadow-xl">
                          {val >= 0 ? '+' : ''}${val.toLocaleString()}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {historicalPnL.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#4caf50' : '#df514c'} 
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holdings List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-900">
          {holdings.length > 0 ? (
            holdings.map((holding) => (
              <div 
                key={holding.symbol} 
                className="py-5 flex flex-col active:bg-gray-50 dark:active:bg-gray-900 cursor-pointer"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">{holding.symbol}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 px-1 py-0.5 rounded">Qty. {holding.quantity}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteHolding(holding.symbol); }}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-medium">Avg. {holding.avgPrice.toFixed(4)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md mb-1 ${holding.totalPnL >= 0 ? 'bg-[#4caf50]/10 text-[#4caf50]' : 'bg-[#df514c]/10 text-[#df514c]'}`}>
                      {holding.totalPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="text-[14px] font-bold">
                        {holding.totalPnL >= 0 ? '+' : ''}{holding.totalPnL.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 uppercase font-medium">LTP {holding.ltp.toFixed(4)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTrade(holding, 'BUY'); }}
                    className="flex-1 bg-[#387ed1]/10 text-[#387ed1] py-3 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Buy More
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTrade(holding, 'SELL'); }}
                    className="flex-1 bg-[#df514c]/10 text-[#df514c] py-3 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Sell / Exit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Inbox size={40} className="opacity-20 mb-3" />
              <p className="text-sm font-medium uppercase tracking-widest">Empty Portfolio</p>
              <button onClick={handleResetHoldings} className="mt-4 text-[#387ed1] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                 <RefreshCcw size={12} /> Load Defaults
              </button>
            </div>
          )}
          <div className="p-6 flex justify-center">
            <button 
              onClick={handleClearHoldings}
              disabled={holdings.length === 0 && tradeHistory.length === 0}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <Trash2 size={14} /> Clear All Data
            </button>
          </div>
        </div>
      </>
    )}
  </div>
      
      {/* Footer P&L & AI button */}
      {activeTab !== 'history' && (
        <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-900 px-6 py-4 flex justify-between items-center z-40 max-w-md mx-auto">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Total P&L</p>
            <p className={`text-[17px] font-bold ${totalPnL >= 0 ? 'text-[#4caf50]' : 'text-[#df514c]'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US')}
            </p>
          </div>
          <button 
            onClick={handleAnalyze}
            className="bg-[#387ed1] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            ANALYZE
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
                  <p className="text-sm text-gray-400 mt-1">LTP: ${selectedHolding.ltp.toFixed(4)}</p>
                </div>
                <button onClick={() => { setSelectedHolding(null); setTradeType(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Quantity</label>
                  <input 
                    type="number" 
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-4 px-5 text-lg font-bold focus:ring-2 focus:ring-[#387ed1] transition-all"
                    autoFocus
                  />
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
                      <AlertCircle size={10} /> Must be lower than LTP (${selectedHolding.ltp.toFixed(4)})
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Triggers alert if price falls below this value.</p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Estimated Value</span>
                  <span className="text-lg font-bold text-gray-800 dark:text-white">
                    ${((parseFloat(tradeQuantity) || 0) * selectedHolding.ltp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>
  );
};

export default Portfolio;
