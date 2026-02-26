
import React from 'react';
import { ChevronLeft, Trash2, Bell, TrendingUp, CreditCard, ShoppingBag, Info, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../components/NotificationProvider';
import { Notification } from '../types';

interface NotificationsProps {
  onBack: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
  const { notifications, markAllAsRead, clearNotifications, markAsRead } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'MARKET': return <TrendingUp size={18} className="text-blue-500" />;
      case 'ACCOUNT': return <CreditCard size={18} className="text-green-500" />;
      case 'TRADE': return <ShoppingBag size={18} className="text-purple-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">No notifications</h2>
            <p className="text-sm mt-2 text-gray-500">We'll notify you about market movements and account activity.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                n.read 
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-70' 
                  : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 shadow-sm'
              }`}
            >
              {!n.read && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-[#387ed1] rounded-full" />
              )}
              <div className="flex gap-4">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm shrink-0 h-fit">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{n.title}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">{formatDate(n.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
