
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, TrendingUp, Key, BarChart, 
  Monitor, ShieldCheck, Settings, LogOut, ChevronRight, ChevronLeft, Search, 
  ArrowUpRight, ArrowDownRight, Activity, RefreshCcw, 
  Plus, Zap, Lock, Smartphone, Globe, Database, Terminal, Server, 
  Bell, Download, FileText, Map, Clock, Unlock, Eye, Filter, Trash2, CheckCircle,
  TrendingDown, Info, ShieldAlert, Copy, Check, Trash, X, Landmark, Wallet, History,
  Save, AlertTriangle, FileSpreadsheet, Ban, CheckCircle2, Edit3, MoreVertical,
  UserCircle, Percent, Shield, Loader2, Menu
} from 'lucide-react';
import { AdminRole, AdminStats, AuditLog, PaymentDetail, Transaction, User } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDrlEzw5XgJfVrqyu8DZRHfDQNYF85n38Q",
  authDomain: "kitetradepro-admin.firebaseapp.com",
  databaseURL: "https://kitetradepro-admin-default-rtdb.firebaseio.com",
  projectId: "kitetradepro-admin",
  storageBucket: "kitetradepro-admin.firebasestorage.app",
  messagingSenderId: "564559822653",
  appId: "1:564559822653:web:12dd3a2787f7d98947cf54",
  measurementId: "G-Y4MDZ4F139"
};

// --- Sub-components moved above for safe initialization ---

const LogoIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => (
  <div className={`relative ${size === 'sm' ? 'w-10 h-10' : 'w-16 h-16'} rounded-xl p-0.5 bg-gradient-to-tr from-[#387ed1] to-[#64b5f6] flex items-center justify-center shadow-lg`}>
    <div className="w-full h-full rounded-xl bg-[#0b0e14] flex items-center justify-center border border-white/10">
      <svg viewBox="0 0 100 100" className={size === 'sm' ? 'w-6 h-6' : 'w-10 h-10'}>
        <path d="M50 10 L85 45 L50 90 L15 45 Z" fill="#387ed1" />
        <path d="M50 10 L65 30 L50 45 L35 30 Z" fill="#4caf50" />
      </svg>
    </div>
  </div>
);

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(' ');
  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const StatCard = ({ label, value, change, icon, sparkData }: { label: string, value: string, change: string, icon: any, sparkData: number[] }) => (
  <div className="bg-[#12161f] p-5 rounded-2xl border border-white/5 hover:border-[#387ed1]/30 transition-all shadow-xl">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-[#1e2532] rounded-lg border border-white/5">{icon}</div>
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase tracking-tighter">{change}</span>
    </div>
    <div className="space-y-1">
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
    <div className="mt-4 h-6 w-full opacity-40">
       <Sparkline data={sparkData} color="#387ed1" />
    </div>
  </div>
);

const SidebarGroup = ({ label, children, collapsed }: { label: string, children: React.ReactNode, collapsed: boolean }) => (
  <div className="mb-6">
    {!collapsed && <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3">{label}</p>}
    <div className="space-y-1">{children}</div>
  </div>
);

const SidebarItem = ({ icon, label, active, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${active ? 'bg-[#387ed1] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    <div className="shrink-0">{icon}</div>
    {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>}
  </button>
);

const DashboardOverview = ({ stats }: { stats: AdminStats }) => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <StatCard label="Live Users" value={stats.activeNow.toString()} change="0%" icon={<Activity className="text-blue-500"/>} sparkData={[0, 0, 0, 0, 0]} />
      <StatCard label="KYC Pending" value={stats.pendingKycCount.toString()} change="Action" icon={<ShieldAlert className="text-amber-500"/>} sparkData={[0, 0, 0, 0, 0]} />
      <StatCard label="Total Capital" value={`$${stats.totalDeposits.toLocaleString()}`} change="0%" icon={<ArrowUpRight className="text-emerald-500"/>} sparkData={[0, 0, 0, 0, 0]} />
      <StatCard label="Daily Vol" value={`$${stats.tradingVolume.toLocaleString()}`} change="0%" icon={<TrendingUp className="text-blue-400"/>} sparkData={[0, 0, 0, 0, 0]} />
      <StatCard label="Pending" value={stats.pendingWithdrawalsCount.toString()} change="Payouts" icon={<Clock className="text-amber-400"/>} sparkData={[0, 0, 0, 0, 0]} />
      <StatCard label="Rev (24h)" value={`$${stats.revenue.toLocaleString()}`} change="0%" icon={<Zap className="text-emerald-400"/>} sparkData={[0, 0, 0, 0, 0]} />
    </div>
  </div>
);

const UserManagement = ({ addLog, onViewPayments }: { addLog: any, onViewPayments: (uid: string) => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState<{ userId: string, fullName: string } | null>(null);
  const [showKycModal, setShowKycModal] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockUser = async () => {
    if (!showBlockModal) return;
    try {
      const res = await fetch('/api/admin/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: showBlockModal.userId, 
          reason: blockReason,
          adminId: 'MASTER-ADMIN'
        })
      });
      if (res.ok) {
        addLog(`User Blocked: ${showBlockModal.fullName}`, showBlockModal.userId);
        fetchUsers();
        setShowBlockModal(null);
        setBlockReason('');
      }
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  };

  const handleUnblockUser = async (userId: string, fullName: string) => {
    if (!confirm(`Are you sure you want to unblock ${fullName}?`)) return;
    try {
      const res = await fetch('/api/admin/users/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        addLog(`User Unblocked: ${fullName}`, userId);
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  const handleKycUpdate = async (userId: string, status: User['kycStatus']) => {
    try {
      const res = await fetch('/api/admin/users/kyc-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      if (res.ok) {
        addLog(`KYC ${status}: ${userId}`, userId);
        fetchUsers();
        setShowKycModal(null);
      }
    } catch (err) {
      console.error("Failed to update KYC:", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="bg-[#12161f] rounded-2xl border border-white/5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 relative">
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1e2532]/30">
        <h3 className="font-black text-white uppercase tracking-tighter italic flex items-center gap-2"><Users className="text-blue-500" size={18} /> User & KYC Management</h3>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={fetchUsers} className="p-2 hover:bg-white/5 text-gray-400 rounded-lg transition-colors">
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              className="bg-[#1e2532] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs w-full md:w-64 outline-none focus:border-[#387ed1] font-bold" 
              placeholder="Search by name, email, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#1e2532]/50 text-[10px] uppercase font-black tracking-widest text-gray-500 border-b border-white/5">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">KYC Status</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase ${u.status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{u.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.email} {u.phone && `• ${u.phone}`}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setShowKycModal(u)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      u.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      u.kycStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      u.kycStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}
                  >
                    {u.kycStatus === 'VERIFIED' && <CheckCircle2 size={10} />}
                    {u.kycStatus === 'PENDING' && <Clock size={10} />}
                    {u.kycStatus === 'REJECTED' && <AlertTriangle size={10} />}
                    {u.kycStatus === 'NOT_SUBMITTED' && <Info size={10} />}
                    {u.kycStatus.replace('_', ' ')}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border w-fit ${u.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      <div className={`w-1 h-1 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {u.status}
                    </span>
                    {u.status === 'blocked' && (
                      <p className="text-[8px] text-red-400/60 font-medium max-w-[120px] truncate" title={u.blockReason}>
                        {u.blockReason}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onViewPayments(u.id)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all" title="View Ledger">
                      <CreditCard size={14} />
                    </button>
                    {u.status === 'active' ? (
                      <button 
                        onClick={() => setShowBlockModal({ userId: u.id, fullName: u.fullName })}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                        title="Block User"
                      >
                        <Ban size={14} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUnblockUser(u.id, u.fullName)}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-all"
                        title="Unblock User"
                      >
                        <Unlock size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-600 uppercase text-[10px] font-black tracking-widest">No users found matching your search</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* KYC Detail Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#12161f] border border-white/10 rounded-[32px] p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in overflow-hidden relative text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">KYC Verification</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{showKycModal.fullName} • {showKycModal.id}</p>
              </div>
              <button onClick={() => setShowKycModal(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Current Status</h4>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
                    showKycModal.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    showKycModal.kycStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    showKycModal.kycStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  }`}>
                    {showKycModal.kycStatus.replace('_', ' ')}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Submitted Documents</h4>
                  {showKycModal.kycDocuments && showKycModal.kycDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {showKycModal.kycDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase">{doc.type}</p>
                              <p className="text-[10px] text-gray-500 font-bold">{doc.number}</p>
                            </div>
                          </div>
                          <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">View File</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">No documents submitted yet</p>
                  )}
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center aspect-video md:aspect-auto relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">Document Preview</p>
                </div>
                <div className="text-center p-8">
                  <Shield size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Select a document to preview</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleKycUpdate(showKycModal.id, 'REJECTED')}
                className="flex-1 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black rounded-2xl transition-all uppercase text-xs tracking-widest border border-red-500/20"
              >
                Reject KYC
              </button>
              <button 
                onClick={() => handleKycUpdate(showKycModal.id, 'VERIFIED')}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase text-xs tracking-widest"
              >
                Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12161f] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-red-500"><Ban size={20} /> Block User</h3>
              <button onClick={() => setShowBlockModal(null)} className="text-gray-500 hover:text-white"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-sm text-gray-300">
                  Are you sure you want to block <span className="text-white font-bold">{showBlockModal.fullName}</span>? 
                  They will be immediately logged out and prevented from signing in or re-registering.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-widest">Reason for Blocking</label>
                <textarea 
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 outline-none focus:border-red-500 text-sm font-medium h-24 resize-none text-white" 
                  placeholder="Enter reason (e.g. Suspicious activity, Terms violation...)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBlockModal(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl transition-all uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBlockUser}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-xl shadow-red-500/20 uppercase text-[10px] tracking-widest"
                >
                  Confirm Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserPaymentManagement = ({ userId, onBack, role, addLog }: { userId: string, onBack: () => void, role: AdminRole, addLog: any }) => {
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeType, setActiveType] = useState<'BANK' | 'UPI' | 'CRYPTO'>('BANK');
  const [newPayment, setNewPayment] = useState<Partial<PaymentDetail>>({ type: 'BANK', status: 'ACTIVE' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const canEdit = role === 'SUPER_ADMIN' || role === 'FINANCE';

  const handleBulkVerify = () => {
    if (selectedIds.length === 0) return;
    setPayments(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, isVerified: true } : p));
    addLog(`Bulk Verification: ${selectedIds.length} records`, userId);
    setSelectedIds([]);
  };

  const handleSave = () => {
    if (!newPayment.accountHolderName) return;
    const p: PaymentDetail = {
      ...newPayment as PaymentDetail,
      id: `PMT-${Math.floor(Math.random()*900)+100}`,
      userId,
      isVerified: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      addedByAdminId: 'MASTER-ADMIN'
    };
    setPayments(prev => [...prev, p]);
    addLog(`New Channel Provisioned: ${p.type}`, p.id);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"><ChevronLeft size={20}/></button>
          <div>
            <h3 className="text-xl font-black text-white">Payment Architecture</h3>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">User Trace: {userId}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {selectedIds.length > 0 && (
             <button onClick={handleBulkVerify} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-emerald-500/20 animate-in zoom-in">
               <Check size={14} /> Bulk Verify ({selectedIds.length})
             </button>
           )}
           {canEdit && (
             <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#387ed1] hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-xl shadow-blue-500/20">
               <Plus size={14} /> Provision Channel
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {payments.map(p => (
            <div key={p.id} className={`bg-[#12161f] border rounded-2xl p-6 transition-all group relative overflow-hidden ${selectedIds.includes(p.id) ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-white/5'}`}>
               <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} className="absolute top-6 left-6 w-4 h-4 rounded border-gray-700 bg-black cursor-pointer z-20" />
               <div className="flex justify-between items-start pl-8">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl bg-opacity-10 ${p.type === 'BANK' ? 'bg-blue-500 text-blue-400' : 'bg-purple-500 text-purple-400'}`}>
                       {p.type === 'BANK' ? <Landmark size={24} /> : <Zap size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white">{p.accountHolderName}</span>
                        {p.isVerified && <div className="p-1 bg-green-500/20 rounded-full text-green-500"><CheckCircle2 size={12} /></div>}
                      </div>
                      <p className="text-xs font-mono text-gray-500">{p.bankName || p.upiId}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                       <button onClick={() => addLog('Modification Attempt', p.id)} className="p-2 bg-white/5 text-gray-400 hover:text-white rounded-lg"><Edit3 size={16}/></button>
                       <button onClick={() => setPayments(prev => prev.filter(item => item.id !== p.id))} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><Trash2 size={16}/></button>
                    </div>
                  )}
               </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="bg-[#12161f] border border-white/5 rounded-2xl p-8 text-center text-gray-600 uppercase text-[10px] font-black tracking-widest">No active channels provisioned</div>
          )}
        </div>
        <div className="bg-[#12161f] border border-white/5 rounded-2xl p-6 h-full min-h-[300px] flex flex-col">
           <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2"><History size={14}/> Activity Ledger</h4>
           <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <History size={48} />
              <p className="text-[10px] uppercase font-black mt-2">No activity records found</p>
           </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#12161f] border border-white/10 rounded-2xl p-8 w-full max-lg shadow-2xl animate-in zoom-in">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold">New Channel Provisioning</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-widest">Holder Identity</label>
                    <input className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 outline-none focus:border-blue-500 text-sm font-bold" onChange={e => setNewPayment({...newPayment, accountHolderName: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setActiveType('BANK')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeType === 'BANK' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}>Bank Transfer</button>
                    <button onClick={() => setActiveType('UPI')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeType === 'UPI' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500'}`}>UPI / VPA</button>
                 </div>
                 <button onClick={handleSave} className="w-full py-4 bg-[#387ed1] hover:bg-blue-600 text-white font-black rounded-xl transition-all shadow-xl shadow-blue-500/20 uppercase text-[10px] tracking-widest">Finalize Record</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const FinancialManagement = ({ stats }: { stats: AdminStats }) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div className="bg-[#12161f] p-8 rounded-2xl border border-white/5 shadow-xl text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-50" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Net Balance</p>
          <p className="text-4xl font-black text-white">${(stats.totalDeposits - stats.totalWithdrawals).toLocaleString()}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={12} /> System Healthy
          </div>
       </div>
       <div className="bg-[#12161f] p-8 rounded-2xl border border-white/5 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-50" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Inflow</p>
          <p className="text-4xl font-black text-emerald-400">${stats.totalDeposits.toLocaleString()}</p>
          <p className="text-[10px] text-gray-600 font-bold mt-2 uppercase tracking-widest">Cumulative Deposits</p>
       </div>
       <div className="bg-[#12161f] p-8 rounded-2xl border border-white/5 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-50" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Outflow</p>
          <p className="text-4xl font-black text-red-400">${stats.totalWithdrawals.toLocaleString()}</p>
          <p className="text-[10px] text-gray-600 font-bold mt-2 uppercase tracking-widest">Processed Payouts</p>
       </div>
    </div>
    
    <div className="bg-[#12161f] p-8 rounded-2xl border border-white/5 shadow-xl">
       <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><Zap size={24} className="text-emerald-500" /> Revenue Analytics</h3>
          <div className="px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Feed</div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Platform Revenue (2% Fee)</p>
             <p className="text-3xl font-black text-white">${stats.revenue.toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Trading Volume</p>
             <p className="text-3xl font-black text-blue-400">${stats.tradingVolume.toLocaleString()}</p>
          </div>
       </div>
    </div>
  </div>
);

const RiskControl = ({ config, setConfig, addLog }: { config: any; setConfig: any; addLog: any }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
    <div className="bg-[#12161f] rounded-2xl border border-white/5 p-8 shadow-2xl space-y-10">
      <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><TrendingUp size={24} className="text-[#387ed1]" /> Market Logic <span className="text-blue-500">Override</span></h3>
      <div className="space-y-8">
        <div className="flex gap-4">
           <button onClick={() => { setConfig({...config, mode: 'auto'}); addLog('Logic: AUTO-ALGO'); }} className={`flex-1 py-4 rounded-xl font-black text-[10px] border-2 transition-all ${config.mode === 'auto' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 text-gray-700'}`}>ALGORITHMIC</button>
           <button onClick={() => { setConfig({...config, mode: 'manual'}); addLog('Logic: MANUAL-OVERRIDE'); }} className={`flex-1 py-4 rounded-xl font-black text-[10px] border-2 transition-all ${config.mode === 'manual' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 text-gray-700'}`}>MANUAL</button>
        </div>
        <div className="space-y-6">
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Brokerage (%)</span>
                 <span className="text-sm font-black text-blue-400">{config.brokerage}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={config.brokerage} onChange={e => setConfig({...config, brokerage: parseFloat(e.target.value)})} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform Margin (X)</span>
                 <span className="text-sm font-black text-emerald-400">{config.marginMultiplier}x</span>
              </div>
              <input type="range" min="0" max="20" step="1" value={config.marginMultiplier} onChange={e => setConfig({...config, marginMultiplier: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
           </div>
        </div>
      </div>
    </div>
    <div className="bg-[#12161f] rounded-2xl border border-white/5 p-8 shadow-2xl">
       <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><Percent size={24} className="text-emerald-500" /> Yield Analysis</h3>
       <div className="mt-8 space-y-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
             <span className="text-xs font-bold text-gray-400 uppercase">Brokerage Yield</span>
             <span className="text-lg font-black text-white">$0.00</span>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
             <span className="text-xs font-bold text-gray-400 uppercase">Effective Margin</span>
             <span className="text-lg font-black text-white">0%</span>
          </div>
       </div>
    </div>
  </div>
);

const ApiVault = ({ addLog }: { addLog: any }) => (
  <div className="bg-[#12161f] rounded-2xl border border-white/5 p-8 shadow-2xl space-y-8">
     <div className="flex justify-between items-center">
        <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><Key size={24} className="text-[#387ed1]" /> Cloud Configuration</h3>
        <button onClick={() => addLog('Generated API Key')} className="bg-[#387ed1] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">New Gateway Key</button>
     </div>
     <div className="bg-black/40 p-6 rounded-2xl border border-white/5 relative group">
        <pre className="text-xs font-mono text-blue-400 hide-scrollbar overflow-x-auto">
           {JSON.stringify(firebaseConfig, null, 2)}
        </pre>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(firebaseConfig))} className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"><Copy size={16}/></button>
     </div>
  </div>
);

const AuditVault = ({ logs }: { logs: AuditLog[] }) => (
  <div className="bg-[#0b0e14] rounded-2xl border border-white/10 p-8 shadow-2xl flex flex-col h-[70vh]">
    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><ShieldCheck size={24} className="text-blue-500"/> System Audit</h3>
    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 pr-4 custom-scrollbar bg-black/40 p-6 rounded-2xl border border-white/5">
      {logs.map(log => (
        <div key={log.id} className="flex gap-4 py-1 border-b border-white/5 hover:bg-white/5 transition-colors group">
          <span className="text-gray-700">[{log.timestamp.split(',')[1]}]</span>
          <span className="text-blue-500 font-black">{log.adminId}</span>
          <span className="text-gray-300">{log.action} <span className="text-blue-500/50">→</span> {log.target}</span>
        </div>
      ))}
      {logs.length === 0 && <div className="text-center py-20 opacity-20 uppercase font-black tracking-widest">No audit data</div>}
    </div>
  </div>
);

const PlatformSettings = () => (
  <div className="bg-[#12161f] rounded-2xl border border-white/5 p-8 shadow-2xl">
     <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8"><Settings size={24} className="inline mr-3 text-[#387ed1]"/> Global Config</h3>
     <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-30">
        <Monitor size={48} className="mx-auto mb-4"/>
        <p className="text-xs font-black uppercase tracking-[0.4em]">Core Logic Protected</p>
     </div>
  </div>
);

const DownloadTracker = ({ stats }: { stats: AdminStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
     <div className="bg-[#12161f] p-8 rounded-2xl border border-white/5 shadow-xl text-center">
        <Smartphone size={32} className="mx-auto mb-4 text-blue-400"/>
        <p className="text-4xl font-black text-white">{stats.downloads.total.toLocaleString()}</p>
        <p className="text-[10px] font-black text-gray-500 uppercase mt-2 tracking-widest">Global Installs</p>
     </div>
     <div className="bg-[#12161f] p-8 rounded-2xl border border-white/5 shadow-xl text-center">
        <Globe size={32} className="mx-auto mb-4 text-emerald-400"/>
        <p className="text-4xl font-black text-white">{stats.activeNow.toLocaleString()}</p>
        <p className="text-[10px] font-black text-gray-500 uppercase mt-2 tracking-widest">Live Sessions</p>
     </div>
  </div>
);

// --- Main component exported as default ---

// Fix: Defined missing AdminView and AdminPanelProps types
type AdminView = 'dashboard' | 'downloads' | 'users' | 'user-payments' | 'payments' | 'market' | 'api' | 'logs' | 'settings';

interface AdminPanelProps {
  onLogout: () => void;
  onExitAdmin: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onExitAdmin }) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [role, setRole] = useState<AdminRole>('SUPER_ADMIN');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [marketConfig, setMarketConfig] = useState(() => {
    const saved = localStorage.getItem('kite_market_config');
    return saved ? JSON.parse(saved) : {
      price: 0,
      volatility: 0,
      winRatio: 0,
      mode: 'auto' as 'auto' | 'manual',
      direction: 'neutral' as 'up' | 'down' | 'neutral',
      spread: 0,
      leverage: '1:0',
      brokerage: 0,
      marginMultiplier: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('kite_market_config', JSON.stringify(marketConfig));
  }, [marketConfig]);

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeNow: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    revenue: 0,
    tradingVolume: 0,
    totalOpenTrades: 0,
    pendingWithdrawalsCount: 0,
    pendingKycCount: 0,
    apiUsageCount: 0,
    failedLogins: 0,
    downloads: { total: 0, ios: 0, android: 0 }
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (action: string, target?: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      adminId: 'MASTER-ADMIN',
      action,
      target,
      timestamp: new Date().toLocaleString(),
      ip: '10.0.0.' + Math.floor(Math.random() * 255)
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const handleViewUserPayments = (userId: string) => {
    setSelectedUserId(userId);
    setActiveView('user-payments');
  };

  return (
    <div className="flex h-screen bg-[#0b0e14] text-gray-100 overflow-hidden font-sans select-none border-t-4 border-[#387ed1]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[60] md:relative md:z-auto
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}
        bg-[#12161f] border-r border-white/5 flex flex-col shrink-0
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5 h-20">
          <LogoIcon size="sm" />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tighter uppercase italic text-white leading-none">Kitetrade <span className="text-[#387ed1]">PRO</span></span>
              <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mt-1">Master Console</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto hide-scrollbar px-3">
          <SidebarGroup label="CORE" collapsed={!isSidebarOpen}>
            <SidebarItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<Download size={18}/>} label="Downloads" active={activeView === 'downloads'} onClick={() => setActiveView('downloads')} collapsed={!isSidebarOpen} />
          </SidebarGroup>

          <SidebarGroup label="MANAGEMENT" collapsed={!isSidebarOpen}>
            <SidebarItem icon={<Users size={18}/>} label="Users & KYC" active={activeView === 'users'} onClick={() => setActiveView('users')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<CreditCard size={18}/>} label="Ledger & Payouts" active={activeView === 'payments'} onClick={() => setActiveView('payments')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<TrendingUp size={18}/>} label="Risk Control" active={activeView === 'market'} onClick={() => setActiveView('market')} collapsed={!isSidebarOpen} />
          </SidebarGroup>

          <SidebarGroup label="SYSTEM" collapsed={!isSidebarOpen}>
            <SidebarItem icon={<Key size={18}/>} label="API Vault" active={activeView === 'api'} onClick={() => setActiveView('api')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<ShieldCheck size={18}/>} label="Security Logs" active={activeView === 'logs'} onClick={() => setActiveView('logs')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<Settings size={18}/>} label="Global Config" active={activeView === 'settings'} onClick={() => setActiveView('settings')} collapsed={!isSidebarOpen} />
          </SidebarGroup>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <div className={`px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4 ${!isSidebarOpen && 'hidden'}`}>
             <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Authorization</p>
             <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="bg-transparent text-xs font-bold text-white outline-none w-full">
               <option value="SUPER_ADMIN" className="bg-[#12161f]">Super Admin (Root)</option>
               <option value="SUPPORT" className="bg-[#12161f]">Support Team</option>
               <option value="FINANCE" className="bg-[#12161f]">Finance Desk</option>
             </select>
          </div>
          <button onClick={onExitAdmin} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Smartphone size={18} /> {isSidebarOpen && "User View"}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={18} /> {isSidebarOpen && "Shutdown"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0b0e14] relative">
        <header className="h-20 border-b border-white/5 bg-[#12161f]/50 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
               <Menu className="md:hidden" size={20} />
               <ChevronRight className={`hidden md:block transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} size={20} />
            </button>
            <h2 className="text-base md:text-lg font-bold text-white capitalize flex items-center gap-2">
              {activeView.replace('-', ' ')}
              <span className="hidden sm:inline-flex text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black ml-2">Master Mode</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black uppercase text-emerald-500">Online</span>
             </div>
             <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Shield size={16} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase text-blue-400">Secure</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 hide-scrollbar">
          {activeView === 'dashboard' && <DashboardOverview stats={stats} />}
          {activeView === 'users' && <UserManagement addLog={addLog} onViewPayments={handleViewUserPayments} />}
          {activeView === 'user-payments' && selectedUserId && (
            <UserPaymentManagement userId={selectedUserId} onBack={() => setActiveView('users')} role={role} addLog={addLog} />
          )}
          {activeView === 'payments' && <FinancialManagement stats={stats} />}
          {activeView === 'market' && <RiskControl config={marketConfig} setConfig={setMarketConfig} addLog={addLog} />}
          {activeView === 'api' && <ApiVault addLog={addLog} />}
          {activeView === 'logs' && <AuditVault logs={logs} />}
          {activeView === 'settings' && <PlatformSettings />}
          {activeView === 'downloads' && <DownloadTracker stats={stats} />}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
