
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Menu, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MOCK_WATCHLIST } from '../constants';
import { Stock } from '../types';
import { GoogleGenAI } from "@google/genai";

interface WatchlistProps {
  onOrderPlaced: () => void;
}

const PriceDisplay = ({ price, symbol, isUp }: { price: number, symbol: string, isUp: boolean }) => {
  const prevPriceRef = useRef(price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    } else if (price < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price]);

  const formatPrice = (p: number, s: string) => {
    const precision = s.includes('JPY') || s.includes('BTC') ? 2 : 4;
    return p.toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision });
  };

  return (
    <motion.span 
      initial={false}
      animate={{ 
        backgroundColor: flash === 'up' ? 'rgba(76, 175, 80, 0.2)' : flash === 'down' ? 'rgba(223, 81, 76, 0.2)' : 'rgba(0,0,0,0)',
        color: flash === 'up' ? '#4caf50' : flash === 'down' ? '#df514c' : (isUp ? '#4caf50' : '#df514c')
      }}
      transition={{ duration: 0.3 }}
      className="text-[15px] font-bold px-1 rounded"
    >
      {formatPrice(price, symbol)}
    </motion.span>
  );
};

const Watchlist: React.FC<WatchlistProps> = ({ onOrderPlaced }) => {
  const [stocks, setStocks] = useState<Stock[]>(MOCK_WATCHLIST);
  const [activeTab, setActiveTab] = useState(1);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [insightStock, setInsightStock] = useState<Stock | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const handleGetInsight = async (stock: Stock) => {
    setInsightStock(stock);
    setIsInsightLoading(true);
    setInsightText(null);
    setInsightError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Provide a very brief market insight and prediction for ${stock.symbol} (${stock.exchange}). Current price is ${stock.ltp}. 2 sentences max.`;
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt 
      });
      setInsightText(response.text || "No insights available.");
    } catch (err) {
      setInsightError("Unable to fetch insights.");
    } finally {
      setIsInsightLoading(false);
    }
  };

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
          if (message.type === 'INITIAL_STATE' || message.type === 'UPDATE') {
            setStocks(message.data);
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      };

      socket.onopen = () => {
        console.log('Connected to stock price feed');
      };

      socket.onclose = () => {
        console.log('Disconnected from stock price feed, retrying in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket?.close();
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnect on unmount
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const formatPrice = (price: number, symbol: string) => {
    const precision = symbol.includes('JPY') || symbol.includes('BTC') ? 2 : 4;
    return price.toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision });
  };

  const chartData = useMemo(() => {
    if (!selectedStock) return [];
    // Generate 50 points of historical data based on current price
    const points = [];
    let currentPrice = selectedStock.ltp * 0.95;
    const now = Date.now();
    for (let i = 0; i < 50; i++) {
      const time = new Date(now - (50 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const change = (Math.random() - 0.48) * (selectedStock.ltp * 0.01);
      currentPrice += change;
      points.push({
        time,
        price: parseFloat(currentPrice.toFixed(selectedStock.symbol.includes('JPY') || selectedStock.symbol.includes('BTC') ? 2 : 5))
      });
    }
    // Ensure last point is the current ltp
    points[points.length - 1].price = selectedStock.ltp;
    return points;
  }, [selectedStock?.symbol, selectedStock?.ltp]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 rounded shadow-lg text-[10px]">
          <p className="font-bold text-gray-400">{payload[0].payload.time}</p>
          <p className="text-[#387ed1] font-bold">${payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors relative">
      <div className="sticky top-0 bg-white dark:bg-black z-40">
        <div className="flex px-4 overflow-x-auto hide-scrollbar border-b border-gray-100 dark:border-gray-900">
          {[1, 2, 3, 4, 5].map(i => (
            <button 
              key={i}
              onClick={() => setActiveTab(i)}
              className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === i ? 'border-[#387ed1] text-[#387ed1]' : 'border-transparent text-gray-500'
              }`}
            >
              Watchlist {i}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-900">
        <AnimatePresence initial={false}>
          {stocks.map((stock, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={stock.symbol} 
              onClick={() => setSelectedStock(stock)}
              className="px-4 py-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-900 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">{stock.symbol}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleGetInsight(stock); }}
                    className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="Get AI Insight"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-tight font-bold">{stock.exchange === 'FOREX' ? 'NSE' : stock.exchange}</span>
              </div>
              <div className="flex flex-col items-end">
                <PriceDisplay price={stock.ltp} symbol={stock.symbol} isUp={stock.isUp} />
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-0.5">
                  <motion.span
                    key={stock.change}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                  >
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(stock.symbol.includes('JPY') ? 2 : 4)}
                  </motion.span>
                  <motion.span
                    key={stock.percentChange}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                  >
                    ({stock.percentChange > 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%)
                  </motion.span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Order Bottom Sheet Overlay */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end" onClick={() => setSelectedStock(null)}>
          <div 
            className="bg-white dark:bg-black rounded-t-2xl bottom-sheet-enter shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{selectedStock.symbol}</h2>
                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tight">{selectedStock.exchange}</p>
              </div>
              <button onClick={() => setSelectedStock(null)} className="p-1">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-6 space-y-6 pb-10">
              <div className="flex justify-between items-baseline">
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  <PriceDisplay price={selectedStock.ltp} symbol={selectedStock.symbol} isUp={selectedStock.isUp} />
                </div>
                <p className={`text-[15px] font-bold ${selectedStock.isUp ? 'text-[#4caf50]' : 'text-[#df514c]'}`}>
                  {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(4)} ({selectedStock.percentChange.toFixed(2)}%)
                </p>
              </div>

              <div className="h-48 w-full bg-gray-50 dark:bg-gray-900/30 rounded-xl overflow-hidden pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#387ed1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#387ed1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      hide 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      hide 
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#387ed1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#387ed1" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => onOrderPlaced()}
                  className="flex-1 bg-[#387ed1] text-white py-3.5 rounded-lg font-bold text-base active:scale-95 transition-all shadow-lg shadow-blue-500/10"
                >
                  BUY
                </button>
                <button 
                  onClick={() => onOrderPlaced()}
                  className="flex-1 bg-[#df514c] text-white py-3.5 rounded-lg font-bold text-base active:scale-95 transition-all shadow-lg shadow-red-500/10"
                >
                  SELL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Insight Modal */}
      {insightStock && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6" onClick={() => setInsightStock(null)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                <h3 className="font-bold text-gray-800 dark:text-white">{insightStock.symbol} Insight</h3>
              </div>
              <button onClick={() => setInsightStock(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            {isInsightLoading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Consulting Gemini...</p>
              </div>
            ) : insightError ? (
              <div className="py-4 text-center">
                <p className="text-sm text-red-500 font-medium">{insightError}</p>
                <button 
                  onClick={() => handleGetInsight(insightStock)}
                  className="mt-4 text-xs font-bold text-blue-500 uppercase tracking-widest"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{insightText}"
                </p>
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Powered by Gemini AI</span>
                  <button 
                    onClick={() => setInsightStock(null)}
                    className="text-xs font-bold text-blue-500 uppercase tracking-widest"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
