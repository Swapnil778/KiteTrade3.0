
import React, { useState, useEffect } from 'react';
import { ChevronLeft, HelpCircle, X, AlertCircle, CheckCircle2, Loader2, CreditCard, Landmark, Smartphone, ArrowRight, Lock, ShieldAlert, ShieldCheck, Zap, History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Transaction } from '../types';
import { useNotifications } from '../components/NotificationProvider';
import { apiRequest } from '../services/apiService';

interface FundsProps {
  onBack: () => void;
}

const Funds: React.FC<FundsProps> = ({ onBack }) => {
  const { addNotification } = useNotifications();
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('kite_funds_balance');
    return saved ? parseFloat(saved) : 0;
  });
  
  const userId = localStorage.getItem('kite_current_user_id') || 'demo_user';
  
  const [isFeePaid, setIsFeePaid] = useState<boolean>(() => {
    return localStorage.getItem('kite_withdrawal_fee_paid') === 'true';
  });

  const [showFeePrompt, setShowFeePrompt] = useState(false);
  const [showLockedStatus, setShowLockedStatus] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState<string | null>(null);

  const FEE_AMOUNT = 5000;

  const loadRazorpaySdk = () => {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        setIsSdkLoaded(true);
        setSdkLoadError(null);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsSdkLoaded(true);
        setSdkLoadError(null);
        resolve(true);
      };
      script.onerror = () => {
        const errorMsg = "Failed to load Razorpay SDK. This is likely due to an ad-blocker or network restriction.";
        setSdkLoadError(errorMsg);
        reject(new Error(errorMsg));
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadRazorpaySdk().catch(err => console.error("Initial SDK load failed:", err));
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await apiRequest<Transaction[]>(`/api/user/transactions?userId=${userId}`);
      if (Array.isArray(data)) {
        setTransactions(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await apiRequest<any>(`/api/user/balance?userId=${userId}`);
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
    fetchTransactions();
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('kite_funds_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('kite_withdrawal_fee_paid', isFeePaid.toString());
  }, [isFeePaid]);

  const handleWithdrawClick = () => {
    if (!isFeePaid) {
      setShowFeePrompt(true);
    } else {
      setShowLockedStatus(true);
    }
  };

  const handlePayProcessingFee = async () => {
    if (balance < FEE_AMOUNT) {
      addNotification({
        type: 'SYSTEM',
        title: 'Insufficient Balance',
        message: "Insufficient balance to pay the processing fee."
      });
      return;
    }

    setIsProcessing(true);
    try {
      const data = await apiRequest<any>('/api/user/withdraw', {
        method: 'POST',
        body: JSON.stringify({ 
          amount: FEE_AMOUNT,
          userId,
          bankDetails: { type: 'FEE_PAYMENT', reason: 'Processing Fee' }
        })
      });

      setBalance(data.balance);
      fetchTransactions();
      setIsFeePaid(true);
      localStorage.setItem('kite_withdrawal_fee_paid', 'true');
      setIsSuccess(true);
      setTimeout(() => {
        setShowFeePrompt(false);
        setIsSuccess(false);
        setTimeout(() => setShowLockedStatus(true), 500);
      }, 2000);
    } catch (err: any) {
      console.error("Fee payment error:", err);
      addNotification({
        type: 'SYSTEM',
        title: 'Payment Failed',
        message: err.message || "Failed to process fee payment."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddFundsClick = () => {
    setShowAddFunds(true);
  };

  const handleFinalDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      // 0. Ensure Razorpay script is available
      let Razorpay = (window as any).Razorpay;
      
      if (!Razorpay) {
        // Try one last time to load it
        try {
          await loadRazorpaySdk();
          Razorpay = (window as any).Razorpay;
        } catch (err) {
          throw new Error("Razorpay SDK is not available. Please disable ad-blockers and refresh.");
        }
      }

      if (typeof Razorpay !== 'function') {
        throw new Error("Razorpay SDK failed to initialize correctly. Please refresh the page.");
      }

      // 1. Get Razorpay Key
      const { keyId, isDemo: keyIsDemo } = await apiRequest<any>('/api/payments/razorpay-key');

      if (!keyId) {
        throw new Error("Razorpay Key ID not found. Please configure environment variables.");
      }

      // 2. Create Order on Server
      const order = await apiRequest<any>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount, currency: 'INR' }) // Using INR for Razorpay
      });
      
      const isDemo = keyIsDemo || order.isDemo;

      // 3. Initialize Razorpay Checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "KiteTrade Pro",
        description: isDemo ? "DEMO MODE - No real money charged" : "Add Funds to Wallet",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const verifyData = await apiRequest<any>('/api/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount,
                isDemo: isDemo,
                userId
              })
            });

            if (verifyData.status === 'ok') {
              setBalance(verifyData.balance);
              fetchTransactions();
              setIsProcessing(false);
              setIsSuccess(true);
              setTimeout(() => {
                setShowAddFunds(false);
                setIsSuccess(false);
              }, 2000);
            } else {
              throw new Error(verifyData.message || "Verification failed");
            }
          } catch (err: any) {
            console.error("Verification Error:", err);
            addNotification({
              type: 'SYSTEM',
              title: 'Verification Failed',
              message: "Payment verification failed: " + err.message
            });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "User",
          email: "user@kite.pro",
          contact: "9999999999"
        },
        theme: {
          color: isDemo ? "#f59e0b" : "#387ed1"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      if (isDemo) {
        console.log("Running in Razorpay Demo Mode");
      }

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      addNotification({
        type: 'SYSTEM',
        title: 'Initialization Failed',
        message: error.message || "Payment failed to initialize"
      });
      setIsProcessing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors relative">
      <div className="p-6">
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase">Available margin</h2>
            <HelpCircle size={14} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(balance)}</span>
            <button className="text-[#387ed1] text-sm font-medium hover:underline transition-all">View statement</button>
          </div>
        </div>

        <div className="flex gap-4 mb-10">
          <button 
            onClick={handleAddFundsClick}
            className="flex-1 bg-[#4caf50] text-white py-4 rounded-md font-bold hover:bg-green-600 active:scale-[0.98] transition-all shadow-md shadow-green-500/10"
          >
            ADD FUNDS
          </button>
          <button 
            onClick={handleWithdrawClick}
            className={`flex-1 py-4 rounded-md font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
              isFeePaid 
                ? 'bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-100 dark:border-red-900/20' 
                : 'bg-[#387ed1] text-white shadow-md shadow-blue-500/10'
            }`}
          >
            {isFeePaid ? <ShieldAlert size={16} /> : <Zap size={16} />}
            {isFeePaid ? 'LOCKED' : 'WITHDRAW'}
          </button>
        </div>

        <div className="space-y-6">
          <FundRow label="Available cash" value={formatCurrency(balance)} />
          <FundRow label="Used margin" value="₹0" />
          <FundRow label="Opening balance" value={formatCurrency(balance)} />
          <FundRow label="Payin" value="₹0" />
          <FundRow label="Payout" value="₹0" />
          <FundRow label="SPAN" value="₹0" />
          <FundRow label="Delivery margin" value="₹0" />
          <FundRow label="Exposure" value="₹0" />
          <FundRow label="Option premium" value="₹0" />
          
          <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
             <FundRow label="Collateral (Liquid funds)" value="₹0" />
             <FundRow label="Collateral (Equity)" value="₹0" />
             <FundRow label="Total collateral" value="₹0" bold />
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <History size={14} /> Recent Transactions
            </h3>
            <button className="text-[10px] font-bold text-[#387ed1] uppercase tracking-tight hover:underline">View all</button>
          </div>

          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tx.type === 'DEPOSIT' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">
                        {new Date(tx.timestamp).toLocaleString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                      tx.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <History size={32} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Funds Bottom Sheet */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 z-[100] flex flex-col justify-end" onClick={() => !isProcessing && setShowAddFunds(false)}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-t-2xl bottom-sheet-enter p-6 space-y-6 shadow-2xl transition-colors max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add Funds</h2>
              {!isProcessing && (
                <button onClick={() => setShowAddFunds(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X size={24} className="text-gray-400" />
                </button>
              )}
            </div>

            {isSuccess ? (
              <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-4">
                  <CheckCircle2 size={48} className="text-[#4caf50]" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Deposit Successful</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your available margin has been updated.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sdkLoadError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-800 dark:text-red-400">SDK Load Error</p>
                      <p className="text-[10px] text-red-600 dark:text-red-500/70 mt-1">{sdkLoadError}</p>
                      <button 
                        onClick={() => loadRazorpaySdk()}
                        className="mt-2 text-[10px] font-black text-red-700 dark:text-red-400 underline uppercase tracking-widest"
                      >
                        Retry Loading SDK
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount to Add</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                    <input 
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-2xl font-black focus:ring-2 focus:ring-[#4caf50] outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {['1000', '5000', '10000', '25000'].map(amt => (
                      <button 
                        key={amt}
                        onClick={() => setDepositAmount(amt)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${depositAmount === amt ? 'bg-[#4caf50]/10 border-[#4caf50] text-[#4caf50]' : 'border-gray-100 dark:border-gray-800 text-gray-500'}`}
                      >
                        +₹{parseInt(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Payment Method</label>
                  <div className="space-y-2">
                    <PaymentOption 
                      icon={<Smartphone className="text-blue-500" />} 
                      label="UPI (GPay, PhonePe)" 
                      selected={paymentMethod === 'upi'} 
                      onClick={() => setPaymentMethod('upi')} 
                    />
                    <PaymentOption 
                      icon={<CreditCard className="text-purple-500" />} 
                      label="Cards (Debit / Credit)" 
                      selected={paymentMethod === 'card'} 
                      onClick={() => setPaymentMethod('card')} 
                    />
                    <PaymentOption 
                      icon={<Landmark className="text-orange-500" />} 
                      label="Net Banking" 
                      selected={paymentMethod === 'netbanking'} 
                      onClick={() => setPaymentMethod('netbanking')} 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleFinalDeposit}
                  disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                    ${isProcessing || !depositAmount || parseFloat(depositAmount) <= 0
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                      : 'bg-[#4caf50] text-white hover:bg-green-600 active:scale-[0.98] shadow-lg shadow-green-500/20'
                    }
                  `}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={22} /> : <>DEPOSIT FUNDS <ArrowRight size={18} /></>}
                </button>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center uppercase tracking-widest">
                  Securely processed via Payment Gateway
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Fee Bottom Sheet */}
      {showFeePrompt && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 z-[100] flex flex-col justify-end" onClick={() => !isProcessing && setShowFeePrompt(false)}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-t-2xl bottom-sheet-enter p-6 space-y-6 shadow-2xl transition-colors" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Withdrawal Setup</h2>
              {!isProcessing && (
                <button onClick={() => setShowFeePrompt(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X size={24} className="text-gray-400" />
                </button>
              )}
            </div>

            {isSuccess ? (
              <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
                  <ShieldCheck size={48} className="text-[#387ed1]" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Verification Initiated</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">The processing fee has been received. Your withdrawal request is now being audited.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-5 rounded-xl flex flex-col items-center text-center gap-3">
                  <ShieldCheck className="text-[#387ed1]" size={32} />
                  <div>
                    <p className="text-sm font-black text-[#387ed1] uppercase tracking-tight">Security Fee Required</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                      To comply with SEBI and anti-money laundering regulations, a mandatory one-time **Security Verification Fee of ₹5,000** is required to authorize the withdrawal channel for your account.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Current Balance</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(balance)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Verification Fee</span>
                    <span className="font-bold text-red-500">-₹5,000</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-gray-100">Remaining Balance</span>
                    <span className="text-xl font-black text-[#387ed1]">
                      {formatCurrency(balance - FEE_AMOUNT)}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handlePayProcessingFee}
                  disabled={isProcessing || balance < FEE_AMOUNT}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                    ${isProcessing || balance < FEE_AMOUNT
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                      : 'bg-[#387ed1] text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-500/20'
                    }
                  `}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={22} /> : <>PAY PROCESSING FEE <ArrowRight size={18} /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal Locked Status Sheet */}
      {showLockedStatus && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 z-[100] flex flex-col justify-end" onClick={() => setShowLockedStatus(false)}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-t-2xl bottom-sheet-enter p-6 space-y-6 shadow-2xl transition-colors" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Withdrawal Locked</h2>
              <button onClick={() => setShowLockedStatus(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-xl flex flex-col items-center text-center gap-4">
                <ShieldAlert className="text-red-600" size={48} />
                <div>
                  <p className="text-base font-black text-red-800 dark:text-red-400 uppercase tracking-tight">Security Review in Progress</p>
                  <p className="text-xs text-red-700 dark:text-red-500/70 mt-3 leading-relaxed">
                    Your verification fee has been recorded. However, your account's withdrawal functionality is currently **LOCKED** pending a manual audit by our risk management team.
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-500/70 mt-2 font-bold">
                    Expected Duration: 24 - 48 Hours
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                  Status: Action Locked
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                       <CheckCircle2 size={18} />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">Verification Fee</p>
                       <p className="text-[10px] text-gray-400 mt-0.5">Payment of ₹5,000 confirmed and matched.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl opacity-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                       <Clock size={18} />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">Risk Clearance</p>
                       <p className="text-[10px] text-gray-400 mt-0.5">Awaiting manual approval from compliance desk.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowLockedStatus(false)}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm tracking-widest transition-all active:scale-[0.98]"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentOption: React.FC<{ icon: React.ReactNode; label: string; selected: boolean; onClick: () => void }> = ({ icon, label, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${selected ? 'border-[#4caf50] bg-[#4caf50]/5' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
  >
    <div className="flex items-center gap-4">
      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</span>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-[#4caf50]' : 'border-gray-300 dark:border-gray-600'}`}>
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#4caf50]" />}
    </div>
  </div>
);

const FundRow: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div className="flex justify-between items-center">
    <span className={`text-sm ${bold ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
    <span className={`text-sm ${bold ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>{value}</span>
  </div>
);

const Clock: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default Funds;
