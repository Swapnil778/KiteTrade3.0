
import { Stock, Holding, Order } from './types';

export const COLORS = {
  primary: '#387ed1',
  success: '#4caf50',
  danger: '#df514c',
  border: '#eeeeee',
  textMain: '#444444',
  textSecondary: '#9b9b9b'
};

export const MOCK_WATCHLIST: Stock[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'FOREX', ltp: 1.0845, change: 0.0012, percentChange: 0.11, isUp: true },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', exchange: 'FOREX', ltp: 1.2634, change: -0.0045, percentChange: -0.35, isUp: false },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', exchange: 'FOREX', ltp: 150.12, change: 0.42, percentChange: 0.28, isUp: true },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', exchange: 'FOREX', ltp: 0.6542, change: -0.0018, percentChange: -0.27, isUp: false },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', exchange: 'FOREX', ltp: 1.3521, change: 0.0008, percentChange: 0.06, isUp: true },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', exchange: 'FOREX', ltp: 0.8812, change: -0.0022, percentChange: -0.25, isUp: false },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', exchange: 'FOREX', ltp: 162.85, change: 0.15, percentChange: 0.09, isUp: true },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', exchange: 'CRYPTO', ltp: 62450.00, change: -840.40, percentChange: -1.33, isUp: false },
];

export const MOCK_HOLDINGS: Holding[] = [
  { 
    symbol: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'FOREX', ltp: 1.0845, change: 0.0012, percentChange: 0.11, isUp: true,
    quantity: 10000, avgPrice: 1.0750, investedValue: 10750, currentValue: 10845, totalPnL: 95, dayPnL: 12
  },
  { 
    symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', exchange: 'FOREX', ltp: 190.20, change: -0.45, percentChange: -0.24, isUp: false,
    quantity: 5000, avgPrice: 188.00, investedValue: 9400, currentValue: 9510, totalPnL: 110, dayPnL: -22.5
  },
];

export const MOCK_ORDERS: Order[] = [
  { id: '1', symbol: 'EUR/USD', type: 'BUY', status: 'COMPLETED', price: 1.0840, quantity: 1000, time: '10:45 AM' },
  { id: '2', symbol: 'USD/JPY', type: 'SELL', status: 'PENDING', price: 150.50, quantity: 500, time: '11:15 AM' },
  { id: '3', symbol: 'GBP/USD', type: 'BUY', status: 'CANCELLED', price: 1.2600, quantity: 2000, time: '09:30 AM' },
];

export const MOCK_TRADE_HISTORY: Order[] = [
  { id: 'th1', symbol: 'EUR/USD', type: 'BUY', status: 'COMPLETED', price: 1.0750, quantity: 10000, time: '2026-02-20 10:00 AM' },
  { id: 'th2', symbol: 'GBP/JPY', type: 'BUY', status: 'COMPLETED', price: 188.00, quantity: 5000, time: '2026-02-21 02:30 PM' },
];
