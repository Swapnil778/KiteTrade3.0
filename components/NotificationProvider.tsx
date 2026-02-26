
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('kite_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    localStorage.setItem('kite_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setToast(newNotification);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearNotifications 
    }}>
      {children}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top duration-300 flex gap-4 items-start">
          <div className={`p-2 rounded-full shrink-0 ${
            toast.type === 'MARKET' ? 'bg-blue-50 text-blue-500' :
            toast.type === 'ACCOUNT' ? 'bg-green-50 text-green-500' :
            toast.type === 'TRADE' ? 'bg-purple-50 text-purple-500' :
            'bg-gray-50 text-gray-500'
          }`}>
            {toast.type === 'MARKET' ? '📈' : toast.type === 'ACCOUNT' ? '💰' : toast.type === 'TRADE' ? '🤝' : '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{toast.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
