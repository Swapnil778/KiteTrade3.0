
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_ORDERS } from '../constants';
import { Filter, Download, FileText, Search, RefreshCcw, Trash2, Loader2 } from 'lucide-react';
import { Order } from '../types';
import { apiRequest } from '../services/apiService';
import { useNotifications } from '../components/NotificationProvider';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState('executed');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = localStorage.getItem('kite_current_user_id') || localStorage.getItem('kite_saved_userid');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiRequest<Order[]>(`/api/user/orders/${userId}`);
        setOrders(data);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        addNotification({
          type: 'SYSTEM',
          title: 'Fetch Error',
          message: 'Unable to load your orders. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const handleClearOrders = () => {
    if (window.confirm('Are you sure you want to clear all executed orders?')) {
      setOrders([]);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || order.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  const renderEmptyState = (title: string, description: string) => (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 px-8 text-center transition-colors">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 opacity-60">
        <FileText size={32} className="text-[#387ed1]" />
      </div>
      <h3 className="text-gray-800 dark:text-gray-200 font-medium text-lg">{title}</h3>
      <p className="text-sm mt-2 leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
      {activeTab === 'executed' && orders.length === 0 && (
        <button 
          onClick={() => setOrders(MOCK_ORDERS)}
          className="mt-8 flex items-center gap-2 text-[#387ed1] font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCcw size={16} /> LOAD MOCK ORDERS
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-40 transition-colors shadow-sm">
        <div className="flex px-4 overflow-x-auto hide-scrollbar border-b border-gray-100 dark:border-gray-800">
          {['Open', 'Executed', 'GTT', 'Baskets', 'SIPs'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.toLowerCase() ? 'border-[#387ed1] text-[#387ed1]' : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {activeTab === 'executed' && orders.length > 0 && (
          <div className="p-4 space-y-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search symbol or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#387ed1] transition-all"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500'}`}
              >
                <Filter size={18} />
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                  <div className="flex gap-1.5">
                    {['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'].map(status => (
                      <button 
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${statusFilter === status ? 'bg-[#387ed1] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                  <div className="flex gap-1.5">
                    {['ALL', 'BUY', 'SELL'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${typeFilter === type ? 'bg-[#387ed1] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {filteredOrders.length} of {orders.length} Orders
              </span>
              <button 
                onClick={handleClearOrders}
                className="flex items-center gap-1.5 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
              >
                <Trash2 size={12} /> Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-[#387ed1] mb-4" size={32} />
            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Loading Orders...</p>
          </div>
        ) : activeTab === 'executed' ? (
          orders.length > 0 ? (
            filteredOrders.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="px-4 py-4 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1 rounded ${order.type === 'BUY' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                          {order.type}
                        </span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{order.symbol}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter">MIS • LMT • {order.time} • ID: {order.id}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
                        order.status === 'CANCELLED' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 
                        'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-100">₹{order.price.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
                <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-600 uppercase tracking-widest bg-gray-50/50 dark:bg-gray-800/20">
                  End of list
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 px-8 text-center">
                <Search size={32} className="mb-4 opacity-20" />
                <h3 className="text-gray-800 dark:text-gray-200 font-medium">No matches found</h3>
                <p className="text-sm mt-2 text-gray-500">Try adjusting your filters or search query.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}
                  className="mt-6 text-[#387ed1] font-bold text-xs uppercase tracking-widest"
                >
                  Clear all filters
                </button>
              </div>
            )
          ) : (
            renderEmptyState("No orders executed", "You haven't placed any orders today.")
          )
        ) : (
          renderEmptyState("Nothing here", `You haven't placed any orders in the ${activeTab.toUpperCase()} category today.`)
        )}
      </div>
    </div>
  );
};

export default Orders;
