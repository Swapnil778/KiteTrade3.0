
import React, { useState } from 'react';
import { MOCK_ORDERS } from '../constants';
import { Filter, Download, FileText, Search, RefreshCcw, Trash2 } from 'lucide-react';
import { Order } from '../types';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState('executed');
  const [orders, setOrders] = useState<Order[]>([]); // Starts empty as requested

  const handleClearOrders = () => {
    if (window.confirm('Are you sure you want to clear all executed orders?')) {
      setOrders([]);
    }
  };

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
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {orders.length} Orders Executed
            </span>
            <button 
              onClick={handleClearOrders}
              className="flex items-center gap-1.5 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
            >
              <Trash2 size={12} /> Clear All
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'executed' ? (
          orders.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {orders.map((order) => (
                <div key={order.id} className="px-4 py-4 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1 rounded ${order.type === 'BUY' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        {order.type}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{order.symbol}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter">MIS • LMT • {order.time}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
                      order.status === 'CANCELLED' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 
                      'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-100">${order.price.toFixed(4)}</span>
                  </div>
                </div>
              ))}
              <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-600 uppercase tracking-widest bg-gray-50/50 dark:bg-gray-800/20">
                End of list
              </div>
            </div>
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
