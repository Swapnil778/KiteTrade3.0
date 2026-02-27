
export interface Stock {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'FOREX' | 'CRYPTO';
  ltp: number;
  change: number;
  percentChange: number;
  isUp: boolean;
}

export interface Holding extends Stock {
  quantity: number;
  avgPrice: number;
  investedValue: number;
  currentValue: number;
  totalPnL: number;
  dayPnL: number;
  stopLoss?: number;
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  SIGN_UP = 'SIGN_UP',
  WATCHLIST = 'WATCHLIST',
  ORDERS = 'ORDERS',
  PORTFOLIO = 'PORTFOLIO',
  BIDS = 'BIDS',
  ACCOUNT = 'ACCOUNT',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  FUNDS = 'FUNDS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ADMIN_PANEL = 'ADMIN_PANEL',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_SIGNUP = 'ADMIN_SIGNUP',
  ADMIN_USER_MANAGEMENT = 'ADMIN_USER_MANAGEMENT'
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  registrationDate: string;
  status: 'active' | 'blocked';
  blockedAt?: string;
  blockedBy?: string;
  blockReason?: string;
  role: 'user' | 'admin';
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SUBMITTED';
  kycDocuments?: {
    type: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID';
    number: string;
    frontUrl?: string;
    backUrl?: string;
    submittedAt: string;
  }[];
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  price: number;
  quantity: number;
  time: string;
}

export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE';

export interface AdminStats {
  totalUsers: number;
  activeNow: number;
  totalDeposits: number;
  totalWithdrawals: number;
  revenue: number;
  tradingVolume: number;
  totalOpenTrades: number;
  pendingWithdrawalsCount: number;
  pendingKycCount: number;
  apiUsageCount: number;
  failedLogins: number;
  downloads: {
    total: number;
    ios: number;
    android: number;
  };
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  target?: string;
  timestamp: string;
  ip: string;
}

export interface PaymentDetail {
  id: string;
  userId: string;
  userName: string;
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  cryptoWallet?: string;
  type: 'BANK' | 'UPI' | 'CRYPTO';
  isVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  addedByAdminId: string;
  remarks?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  paymentId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAW';
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'MARKET' | 'TRADE' | 'ACCOUNT' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}
