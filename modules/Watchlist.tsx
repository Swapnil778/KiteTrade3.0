
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Menu, X, Sparkles, Loader2, TrendingUp, BarChart3, Newspaper, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
  Cell
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
        backgroundColor: flash === 'up' ? 'rgba(16, 185, 129, 0.15)' : flash === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0)',
        color: flash === 'up' ? '#10b981' : flash === 'down' ? '#ef4444' : (isUp ? '#10b981' : '#ef4444')
      }}
      transition={{ duration: 0.3 }}
      className="text-base font-bold px-1.5 py-0.5 rounded-md tabular-nums"
    >
      {formatPrice(price, symbol)}
    </motion.span>
  );
};

const Watchlist: React.FC<WatchlistProps> = ({ onOrderPlaced }) => {
  const [stocks, setStocks] = useState<Stock[]>(MOCK_WATCHLIST);
  const [activeTab, setActiveTab] = useState(1);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [insightStock, setInsightStock] = useState<Stock | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  // News state
  const [news, setNews] = useState<{ title: string, source: string, time: string, summary: string }[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  const fetchNews = async (stock: Stock) => {
    setIsNewsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate 3 realistic, recent-sounding financial news headlines and summaries for ${stock.symbol} (${stock.exchange}). 
      Format as a JSON array of objects with keys: title, source, time (e.g. "2h ago"), summary. 
      Make them sound like real market news.`;
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const newsData = JSON.parse(response.text || "[]");
      setNews(newsData);
    } catch (err) {
      console.error("Failed to fetch news:", err);
      // Fallback mock news if AI fails
      setNews([
        { title: `${stock.symbol} showing strong resistance at current levels`, source: "MarketWatch", time: "1h ago", summary: "Analysts suggest that the current price level is a critical point for the stock's short-term trajectory." },
        { title: `Institutional investors increase stake in ${stock.symbol}`, source: "Reuters", time: "3h ago", summary: "Recent filings show a significant uptick in institutional buying over the last quarter." },
        { title: `What's next for ${stock.symbol} after recent volatility?`, source: "Bloomberg", time: "5h ago", summary: "Market experts weigh in on the potential impact of upcoming economic data on the stock." }
      ]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Fetch news when a stock is selected
  useEffect(() => {
    if (selectedStock) {
      fetchNews(selectedStock);
    }
  }, [selectedStock?.symbol]);

  // Real-time price history state
  const [priceHistory, setPriceHistory] = useState<Record<string, { time: string, price: number }[]>>({});
  const historyLimit = 60; // 1 minute of 1s updates

  // Update history when stocks change
  useEffect(() => {
    if (stocks.length === 0) return;

    setPriceHistory(prev => {
      const next = { ...prev };
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      stocks.forEach(stock => {
        const history = next[stock.symbol] || [];
        const lastPrice = history.length > 0 ? history[history.length - 1].price : null;

        if (stock.ltp !== lastPrice) {
          const newHistory = [...history, { time: now, price: stock.ltp }].slice(-historyLimit);
          next[stock.symbol] = newHistory;
        }
      });

      return next;
    });
  }, [stocks]);

  // Sync selectedStock with updated stocks from WebSocket
  const currentSelectedStock = useMemo(() => {
    if (!selectedStock) return null;
    return stocks.find(s => s.symbol === selectedStock.symbol) || selectedStock;
  }, [stocks, selectedStock]);

  const handleGetInsight = async (stock: Stock) => {
    setInsightStock(stock);
    setIsInsightLoading(true);
    setInsightText(null);
    setInsightError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

  const currentHistory = useMemo(() => {
    if (!currentSelectedStock) return [];
    const history = priceHistory[currentSelectedStock.symbol] || [];
    
    // If history is too short, pre-fill with some mock data to make it look better
    if (history.length < 10) {
      const mockPoints = [];
      const now = Date.now();
      const basePrice = currentSelectedStock.ltp;
      for (let i = 20; i > 0; i--) {
        mockPoints.push({
          time: new Date(now - i * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: basePrice + (Math.random() - 0.5) * (basePrice * 0.001)
        });
      }
      return [...mockPoints, ...history].slice(-historyLimit);
    }
    return history;
  }, [currentSelectedStock?.symbol, priceHistory, currentSelectedStock?.ltp]);

  const candleData = useMemo(() => {
    if (!currentSelectedStock) return [];
    // We'll group the 1s history into 5s candles for the candle chart
    const data = currentHistory;
    const candles = [];
    const groupSize = 5;

    for (let i = 0; i < data.length; i += groupSize) {
      const chunk = data.slice(i, i + groupSize);
      if (chunk.length === 0) continue;

      const prices = chunk.map(p => p.price);
      candles.push({
        time: chunk[0].time,
        open: chunk[0].price,
        high: Math.max(...prices),
        low: Math.min(...prices),
        close: chunk[chunk.length - 1].price
      });
    }
    return candles;
  }, [currentHistory]);

  const chartData = currentHistory;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-gray-400 mb-2">{data.time}</p>
          {chartType === 'line' ? (
            <p className="text-brand-500 font-extrabold text-sm">${data.price}</p>
          ) : (
            <div className="space-y-1">
              <p className="flex justify-between gap-6"><span>O:</span> <span className="font-bold text-gray-900 dark:text-gray-100">${data.open}</span></p>
              <p className="flex justify-between gap-6"><span>H:</span> <span className="font-bold text-gray-900 dark:text-gray-100">${data.high}</span></p>
              <p className="flex justify-between gap-6"><span>L:</span> <span className="font-bold text-gray-900 dark:text-gray-100">${data.low}</span></p>
              <p className="flex justify-between gap-6"><span>C:</span> <span className="font-bold text-brand-500">${data.close}</span></p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors relative">
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-40">
        <div className="flex px-2 overflow-x-auto hide-scrollbar border-b border-gray-100 dark:border-gray-900">
          {[1, 2, 3, 4, 5].map(i => (
            <button 
              key={i}
              onClick={() => setActiveTab(i)}
              className={`py-4 px-5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === i ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              Watchlist {i}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-900/50">
        <AnimatePresence initial={false}>
          {stocks.map((stock, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={stock.symbol} 
              onClick={() => setSelectedStock(stock)}
              className="px-5 py-5 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-900 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">{stock.symbol}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleGetInsight(stock); }}
                    className="p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    title="Get AI Insight"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-widest font-black mt-0.5">{stock.exchange === 'FOREX' ? 'NSE' : stock.exchange}</span>
              </div>
              <div className="flex flex-col items-end">
                <PriceDisplay price={stock.ltp} symbol={stock.symbol} isUp={stock.isUp} />
                <div className="flex items-center gap-1.5 text-xs font-bold mt-1 tabular-nums">
                  <motion.span
                    key={`${stock.symbol}-change`}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className={stock.isUp ? 'text-kiteGreen' : 'text-kiteRed'}
                  >
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(stock.symbol.includes('JPY') ? 2 : 4)}
                  </motion.span>
                  <motion.span
                    key={`${stock.symbol}-percent`}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${stock.isUp ? 'bg-kiteGreen/10 text-kiteGreen' : 'bg-kiteRed/10 text-kiteRed'}`}
                  >
                    {stock.percentChange > 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                  </motion.span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Order Bottom Sheet Overlay */}
      {currentSelectedStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col justify-end" onClick={() => setSelectedStock(null)}>
          <motion.div 
            initial={{ translateY: '100%' }}
            animate={{ translateY: 0 }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white dark:bg-gray-950 rounded-t-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border-t border-gray-100 dark:border-gray-800" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-4 mb-2" />
            
            <div className="px-8 py-6 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">{currentSelectedStock.symbol}</h2>
                  <p className="text-[11px] text-gray-400 mt-1 uppercase font-black tracking-[0.2em]">{currentSelectedStock.exchange}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStock(null)} 
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-8 space-y-8 pb-12">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">
                    {formatPrice(currentSelectedStock.ltp, currentSelectedStock.symbol)}
                  </div>
                  <div className={`flex items-center gap-2 text-base font-bold mt-2 ${currentSelectedStock.isUp ? 'text-kiteGreen' : 'text-kiteRed'}`}>
                    <span>{currentSelectedStock.change > 0 ? '+' : ''}{currentSelectedStock.change.toFixed(4)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${currentSelectedStock.isUp ? 'bg-kiteGreen/10' : 'bg-kiteRed/10'}`}>
                      {currentSelectedStock.percentChange > 0 ? '+' : ''}{currentSelectedStock.percentChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl">
                  <button 
                    onClick={() => setChartType('line')}
                    className={`p-2.5 rounded-xl transition-all ${chartType === 'line' ? 'bg-white dark:bg-gray-800 text-brand-500 shadow-sm' : 'text-gray-400'}`}
                  >
                    <TrendingUp size={20} />
                  </button>
                  <button 
                    onClick={() => setChartType('candle')}
                    className={`p-2.5 rounded-xl transition-all ${chartType === 'candle' ? 'bg-white dark:bg-gray-800 text-brand-500 shadow-sm' : 'text-gray-400'}`}
                  >
                    <BarChart3 size={20} />
                  </button>
                </div>
              </div>

              <div className="h-64 w-full bg-gray-50/50 dark:bg-gray-900/20 rounded-[24px] overflow-hidden pt-6 relative border border-gray-100 dark:border-gray-800/50">
                {chartType === 'line' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#387ed1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#387ed1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#387ed1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#387ed1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candleData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip 
                          content={<CustomTooltip />}
                          cursor={{ stroke: '#387ed1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />
                        <Bar 
                          dataKey="close" 
                          animationDuration={800}
                          shape={(props: any) => {
                            const { x, width, payload, yAxis } = props;
                            const { open, close, high, low } = payload;
                            const isUp = close >= open;
                            const color = isUp ? '#10b981' : '#ef4444';
                            
                            const openY = yAxis.scale(open);
                            const closeY = yAxis.scale(close);
                            const highY = yAxis.scale(high);
                            const lowY = yAxis.scale(low);
                            
                            const wickX = x + width / 2;
                            const bodyWidth = Math.max(3, width - 4);
                            const bodyX = x + (width - bodyWidth) / 2;
                            
                            return (
                              <g>
                                <line 
                                  x1={wickX} 
                                  y1={highY} 
                                  x2={wickX} 
                                  y2={lowY} 
                                  stroke={color} 
                                  strokeWidth={1.5} 
                                  strokeLinecap="round"
                                />
                                <rect 
                                  x={bodyX} 
                                  y={Math.min(openY, closeY)} 
                                  width={bodyWidth} 
                                  height={Math.max(2, Math.abs(openY - closeY))} 
                                  fill={color} 
                                  rx={1}
                                />
                              </g>
                            );
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => onOrderPlaced()}
                  className="flex-1 bg-brand-500 text-white py-4.5 rounded-2xl font-black text-lg active:scale-[0.98] transition-all shadow-xl shadow-brand-500/25 uppercase tracking-widest"
                >
                  BUY
                </button>
                <button 
                  onClick={() => onOrderPlaced()}
                  className="flex-1 bg-kiteRed text-white py-4.5 rounded-2xl font-black text-lg active:scale-[0.98] transition-all shadow-xl shadow-red-500/25 uppercase tracking-widest"
                >
                  SELL
                </button>
              </div>

              {/* News Feed Section */}
              <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Newspaper size={14} /> Latest News
                  </h3>
                  {isNewsLoading && <Loader2 size={14} className="animate-spin text-brand-500" />}
                </div>

                <div className="space-y-6">
                  {isNewsLoading && news.length === 0 ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-50 dark:bg-gray-900 rounded w-1/2" />
                      </div>
                    ))
                  ) : (
                    news.map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="group cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-500 transition-colors leading-snug">
                            {item.title}
                          </h4>
                          <ExternalLink size={14} className="text-gray-300 dark:text-gray-700 group-hover:text-brand-500 shrink-0 mt-1" />
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{item.source}</span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <Clock size={10} />
                            {item.time}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
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
