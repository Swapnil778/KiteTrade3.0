import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { apiRequest } from './services/apiService';
import { AppScreen, User } from './types';
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
  const [user, setUser] = useState<User | null>(null);

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

  // Fetch profile and check blocked status
  useEffect(() => {
    if (!isLoggedIn) {
      setUser(null);
      return;
    }

    const fetchProfileAndStatus = async () => {
      const identifier = localStorage.getItem('kite_current_user_id') || localStorage.getItem('kite_saved_userid');
      if (!identifier) return;

      try {
        const data = await apiRequest<User>('/api/auth/profile', {
          method: 'POST',
          body: JSON.stringify({ identifier })
        });
        
        setUser(data);

        if (data.status === 'blocked') {
          addNotification({
            type: 'SYSTEM',
            title: 'Account Blocked',
            message: `Your account has been blocked. Reason: ${data.blockReason || 'Violation of terms'}.`
          });
          handleLogout();
        }
      } catch (err: any) {
        // If user is not found, they might have been deleted or server reset
        if (err.status === 404) {
          console.warn("User session invalid, logging out...");
          handleLogout();
        } else {
          // Silent fail for other errors to avoid annoying popups
          console.error("Profile fetch error:", err.message || err);
        }
      }
    };

    const interval = setInterval(fetchProfileAndStatus, 30000);
    fetchProfileAndStatus();

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
    setUser(null);
    setCurrentScreen(AppScreen.LOGIN);
  };

  const navigate = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  // 1. Handle Admin Auth Screens
  if (currentScreen === AppScreen.ADMIN_LOGIN) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-0 md:p-4">
        <div className="w-full h-full md:h-[850px] md:max-w-[420px] md:rounded-[40px] md:shadow-2xl md:border-8 md:border-gray-200 dark:md:border-gray-800 overflow-hidden relative">
          <AdminLogin 
            onLogin={(id) => handleLogin(true, id)} 
            onForgot={() => setCurrentScreen(AppScreen.FORGOT_PASSWORD)} 
            onSignUp={() => setCurrentScreen(AppScreen.ADMIN_SIGNUP)} 
            onBackToUserLogin={() => setCurrentScreen(AppScreen.LOGIN)}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === AppScreen.ADMIN_SIGNUP) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-0 md:p-4">
        <div className="w-full h-full md:h-[850px] md:max-w-[420px] md:rounded-[40px] md:shadow-2xl md:border-8 md:border-gray-200 dark:md:border-gray-800 overflow-hidden relative">
          <AdminSignUp 
            onBack={() => setCurrentScreen(AppScreen.ADMIN_LOGIN)} 
            onSignUpSuccess={(id) => handleLogin(true, id)} 
          />
        </div>
      </div>
    );
  }

  // 2. Handle standard auth if not logged in
  if (!isLoggedIn) {
    let authComponent;
    if (currentScreen === AppScreen.FORGOT_PASSWORD) {
      authComponent = <ForgotPassword onBack={() => setCurrentScreen(AppScreen.LOGIN)} />;
    } else if (currentScreen === AppScreen.SIGN_UP) {
      authComponent = <SignUp onBack={() => setCurrentScreen(AppScreen.LOGIN)} onSignUpSuccess={(id) => handleLogin(false, id)} onAdminSignUp={() => setCurrentScreen(AppScreen.ADMIN_SIGNUP)} />;
    } else {
      authComponent = (
        <Login 
          onLogin={(isAdmin, id) => handleLogin(isAdmin, id)} 
          onForgot={() => setCurrentScreen(AppScreen.FORGOT_PASSWORD)} 
          onSignUp={() => setCurrentScreen(AppScreen.SIGN_UP)} 
          onToggleAdmin={() => navigate(AppScreen.ADMIN_LOGIN)}
        />
      );
    }

    return (
      <div className="h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-0 md:p-4">
        <div className="w-full h-full md:h-[850px] md:max-w-[500px] md:rounded-[40px] md:shadow-2xl md:border-8 md:border-gray-200 dark:md:border-gray-800 overflow-hidden relative">
          {authComponent}
        </div>
      </div>
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
        return <Account onNavigate={navigate} onLogout={handleLogout} user={user} />;
      case AppScreen.SETTINGS:
        return <Settings onBack={() => navigate(AppScreen.ACCOUNT)} />;
      case AppScreen.FUNDS:
        return <Funds onBack={() => navigate(AppScreen.ACCOUNT)} />;
      case AppScreen.PROFILE:
        return <Profile onBack={() => navigate(AppScreen.ACCOUNT)} user={user} />;
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
  <ErrorBoundary>
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  </ErrorBoundary>
);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}