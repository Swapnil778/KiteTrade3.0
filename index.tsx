import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import { AppScreen } from './types';
import { NotificationProvider, useNotifications } from './components/NotificationProvider';
import Login from './modules/Login';
import ForgotPassword from './modules/ForgotPassword';
import SignUp from './modules/SignUp';
import Watchlist from './modules/Watchlist';
import Orders from './modules/Orders';
import Portfolio from './modules/Portfolio';
import Account from './modules/Account';
import Settings from './modules/Settings';
import Funds from './modules/Funds';
import Profile from './modules/Profile';
import Notifications from './modules/Notifications';
import AdminPanel from './modules/AdminPanel';
import AdminSignUp from './modules/AdminSignUp';
import AdminLogin from './modules/AdminLogin';

const AppContent: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('kite_is_logged_in') === 'true';
  });

  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    // Check if we have a forced session
    if (localStorage.getItem('kite_is_logged_in') === 'true') {
      const saved = localStorage.getItem('kite_current_screen');
      if (saved === 'ADMIN_PANEL') return AppScreen.ADMIN_PANEL;
      return (saved as AppScreen) || AppScreen.WATCHLIST;
    }
    // Default to LOGIN for fresh start or ADMIN_SIGNUP if requested
    const lastSession = localStorage.getItem('kite_last_screen_attempt');
    if (lastSession === 'ADMIN_SIGNUP') return AppScreen.ADMIN_SIGNUP;
    return AppScreen.LOGIN;
  });

  useEffect(() => {
    localStorage.setItem('kite_is_logged_in', isLoggedIn.toString());
    
    if (isLoggedIn && ![AppScreen.LOGIN, AppScreen.SIGN_UP, AppScreen.ADMIN_LOGIN, AppScreen.ADMIN_SIGNUP].includes(currentScreen)) {
      localStorage.setItem('kite_current_screen', currentScreen);
    }
  }, [isLoggedIn, currentScreen]);

  // WebSocket for real-time notifications
  useEffect(() => {
    if (!isLoggedIn) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NOTIFICATION') {
        addNotification(message.data);
      }
    };

    return () => ws.close();
  }, [isLoggedIn, addNotification]);

  // Periodic check for blocked status
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkBlockedStatus = async () => {
      const userId = localStorage.getItem('kite_current_user_id');
      if (!userId) return;

      try {
        const res = await fetch('/api/auth/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: userId })
        });
        
        if (!res.ok) return; // Silent fail for network/server errors during check

        const data = await res.json();
        if (data.status === 'blocked') {
          alert(`Your account has been blocked. Reason: ${data.blockReason || 'Violation of terms'}. You will be logged out.`);
          handleLogout();
        }
      } catch (err) {
        // Only log if it's not a standard fetch failure (likely server restart)
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          return; 
        }
        console.error("Blocked status check error:", err);
      }
    };

    const interval = setInterval(checkBlockedStatus, 30000); // Check every 30 seconds
    checkBlockedStatus(); // Initial check

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = (isAdmin: boolean = false, identifier?: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('kite_is_logged_in', 'true');
    if (identifier) {
      localStorage.setItem('kite_current_user_id', identifier);
    }
    setCurrentScreen(isAdmin ? AppScreen.ADMIN_PANEL : AppScreen.WATCHLIST);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('kite_current_screen');
    localStorage.removeItem('kite_is_logged_in');
    localStorage.removeItem('kite_current_user_id');
    setCurrentScreen(AppScreen.LOGIN);
  };

  const navigate = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  // 1. Handle Admin Auth Screens
  if (currentScreen === AppScreen.ADMIN_LOGIN) {
    return (
      <AdminLogin 
        onLogin={(id) => handleLogin(true, id)} 
        onForgot={() => setCurrentScreen(AppScreen.FORGOT_PASSWORD)} 
        onSignUp={() => setCurrentScreen(AppScreen.ADMIN_SIGNUP)} 
        onBackToUserLogin={() => setCurrentScreen(AppScreen.LOGIN)}
      />
    );
  }

  if (currentScreen === AppScreen.ADMIN_SIGNUP) {
    return (
      <AdminSignUp 
        onBack={() => setCurrentScreen(AppScreen.ADMIN_LOGIN)} 
        onSignUpSuccess={(id) => handleLogin(true, id)} 
      />
    );
  }

  // 2. Handle standard auth if not logged in
  if (!isLoggedIn) {
    if (currentScreen === AppScreen.FORGOT_PASSWORD) {
      return <ForgotPassword onBack={() => setCurrentScreen(AppScreen.LOGIN)} />;
    }
    if (currentScreen === AppScreen.SIGN_UP) {
      return <SignUp onBack={() => setCurrentScreen(AppScreen.LOGIN)} onSignUpSuccess={(id) => handleLogin(false, id)} onAdminSignUp={() => setCurrentScreen(AppScreen.ADMIN_SIGNUP)} />;
    }
    return (
      <Login 
        onLogin={(isAdmin, id) => handleLogin(isAdmin, id)} 
        onForgot={() => setCurrentScreen(AppScreen.FORGOT_PASSWORD)} 
        onSignUp={() => setCurrentScreen(AppScreen.SIGN_UP)} 
        onToggleAdmin={() => navigate(AppScreen.ADMIN_LOGIN)}
      />
    );
  }

  // 3. Handle Admin Panel
  if (currentScreen === AppScreen.ADMIN_PANEL) {
    return <AdminPanel onLogout={handleLogout} onExitAdmin={() => navigate(AppScreen.ACCOUNT)} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.WATCHLIST:
        return <Watchlist onOrderPlaced={() => {
          addNotification({
            type: 'TRADE',
            title: 'Order Placed',
            message: 'Your market order has been placed successfully.'
          });
          setCurrentScreen(AppScreen.ORDERS);
        }} />;
      case AppScreen.ORDERS:
        return <Orders />;
      case AppScreen.PORTFOLIO:
        return <Portfolio />;
      case AppScreen.ACCOUNT:
        return <Account onNavigate={navigate} onLogout={handleLogout} />;
      case AppScreen.SETTINGS:
        return <Settings onBack={() => navigate(AppScreen.ACCOUNT)} />;
      case AppScreen.FUNDS:
        return <Funds onBack={() => navigate(AppScreen.ACCOUNT)} />;
      case AppScreen.PROFILE:
        return <Profile onBack={() => navigate(AppScreen.ACCOUNT)} />;
      case AppScreen.NOTIFICATIONS:
        return <Notifications onBack={() => navigate(AppScreen.ACCOUNT)} />;
      case AppScreen.BIDS:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center screen-fade-in">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">No active bids</h2>
            <p className="text-sm mt-2 text-gray-500">Bids for IPOs and Govt. Bonds will appear here.</p>
          </div>
        );
      default:
        return <Watchlist onOrderPlaced={() => navigate(AppScreen.ORDERS)} />;
    }
  };

  return (
    <Layout activeScreen={currentScreen} onNavigate={navigate}>
      <div className="h-full relative overflow-hidden">
        <div className="h-full overflow-y-auto hide-scrollbar screen-fade-in">
          {renderScreen()}
        </div>
      </div>
    </Layout>
  );
};

const App: React.FC = () => (
  <NotificationProvider>
    <AppContent />
  </NotificationProvider>
);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}