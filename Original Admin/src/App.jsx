import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Bookings from './components/Bookings';
import Inventory from './components/Inventory';
import Orders from './components/Orders';
import Reviews from './components/Reviews';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import RiderManagement from './components/RiderManagement';
import logo from './assets/Ht-logo.png';
import { supabase } from './supabaseClient';

const AUTH_ROLE_STORAGE_KEY = 'happytails_admin_role';
const LAST_PAGE_STORAGE_KEY = 'happytails_admin_last_page';
const AUTH_ROLE_INTENT_STORAGE_KEY = 'happytails_auth_role_intent';
const AUTH_ERROR_STORAGE_KEY = 'happytails_auth_error';
const AUTH_TIMEOUT_MS = 4000;

const withTimeout = (promise, timeoutMs = AUTH_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Auth request timed out')), timeoutMs);
    })
  ]);

function App() {
  const cachedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  const cachedPage = localStorage.getItem(LAST_PAGE_STORAGE_KEY) || 'dashboard';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [userType, setUserType] = useState(cachedRole || null);
  const [currentPage, setCurrentPage] = useState(cachedPage);
  const [authLoading, setAuthLoading] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState({
    dashboard: 0,
    bookings: 0,
    orders: 0
  });

  useEffect(() => {
    let isMounted = true;
    let hasHydrated = false;

    const applySignedOutState = ({ clearStoredRole = true, resetPage = false } = {}) => {
      if (!isMounted) return;
      setIsLoggedIn(false);
      setCurrentUserId('');
      setUserType(null);

      if (clearStoredRole) {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      }

      if (resetPage) {
        localStorage.removeItem(LAST_PAGE_STORAGE_KEY);
        setCurrentPage('dashboard');
      }

      setAuthLoading(false);
    };

    const resolveProfileRole = async (userId, { allowCachedRole = false } = {}) => {
      try {
        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from('profiles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle()
        );

        if (!isMounted) return;

        if (profileError || !profile?.role) {
          if (allowCachedRole && cachedRole) {
            setUserType(cachedRole);
            return cachedRole;
          }

          setUserType(null);
          localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
          return null;
        }

        setUserType(profile.role);
        localStorage.setItem(AUTH_ROLE_STORAGE_KEY, profile.role);
        return profile.role;
      } catch (_error) {
        if (!isMounted) return;

        if (allowCachedRole && cachedRole) {
          setUserType(cachedRole);
          return cachedRole;
        }

        setUserType(null);
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
        return null;
      }
    };

    const applySessionState = async (session, { allowCachedRole = false } = {}) => {
      if (!session) {
        applySignedOutState();
        return;
      }

      if (!isMounted) return;

      setCurrentUserId(session.user.id);
      const resolvedRole = await resolveProfileRole(session.user.id, { allowCachedRole });
      if (!isMounted) return;

      const pendingRole = sessionStorage.getItem(AUTH_ROLE_INTENT_STORAGE_KEY);

      if (!resolvedRole) {
        applySignedOutState();
        return;
      }

      if (pendingRole && pendingRole !== resolvedRole) {
        sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);
        sessionStorage.setItem(AUTH_ERROR_STORAGE_KEY, 'Invalid login credential for the selected role');
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        applySignedOutState();
        return;
      }

      sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
      setIsLoggedIn(true);
      setUserType(resolvedRole);
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, resolvedRole);
      setAuthLoading(false);
    };

    const hydrateSession = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error) throw error;
        await applySessionState(sessionData.session, { allowCachedRole: true });
      } catch (_error) {
        if (!isMounted) return;
        applySignedOutState();
      } finally {
        hasHydrated = true;
      }
    };

    hydrateSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'INITIAL_SESSION' || !hasHydrated) return;

      if (!session) {
        applySignedOutState();
        return;
      }

      await applySessionState(session, { allowCachedRole: true });
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (type, userId = '') => {
    sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
    setIsLoggedIn(true);
    setCurrentUserId(userId);
    setUserType(type);
    localStorage.setItem(AUTH_ROLE_STORAGE_KEY, type);
    setAuthLoading(false);
  };

  const clearStoredAuthState = () => {
    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    localStorage.removeItem(LAST_PAGE_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleLogout = async () => {
    clearStoredAuthState();
    setIsLoggedIn(false);
    setCurrentUserId('');
    setUserType(null);
    setCurrentPage('dashboard');
    setAuthLoading(false);

    Promise.allSettled([
      supabase.auth.signOut(),
      supabase.auth.signOut({ scope: 'local' })
    ]).finally(() => {
      window.location.replace(window.location.pathname);
    });
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, currentPage);
  }, [currentPage, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (userType !== 'owner' && currentPage === 'analytics') {
      setCurrentPage('dashboard');
    }
  }, [currentPage, isLoggedIn, userType]);

  const handleNotificationCountChange = (page, count) => {
    setNotificationCounts((prev) => ({ ...prev, [page]: count }));
  };

  const hasNotifications = useMemo(
    () => Object.values(notificationCounts).some((count) => count > 0),
    [notificationCounts]
  );

  const renderNavLabel = (label, pageKey) => {
    const count = notificationCounts[pageKey] || 0;
    return (
      <>
        <span>{label}</span>
        {count > 0 && <span className="nav-item-notif-badge">{count > 99 ? '99+' : count}</span>}
      </>
    );
  };

  if (authLoading) {
    return (
      <div className="session-loader">
        <div className="session-loader__card">
          <img src={logo} alt="Happy Tails Logo" className="session-loader__logo" />
          <div className="session-loader__brand">
            <span className="happy-text">Happy</span>
            <span className="tails-text">Tails</span>
          </div>
          <div className="session-loader__spinner" aria-hidden="true" />
          <p className="session-loader__title">Restoring your session</p>
          <p className="session-loader__subtitle">Loading your admin workspace and permissions.</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userType={userType} onNotificationCountChange={(count) => handleNotificationCountChange('dashboard', count)} />;
      case 'customers':
        return <Customers />;
      case 'bookings':
        return <Bookings onNotificationCountChange={(count) => handleNotificationCountChange('bookings', count)} />;
      case 'orders':
        return <Orders onNotificationCountChange={(count) => handleNotificationCountChange('orders', count)} />;
      case 'reviews':
        return <Reviews />;
      case 'inventory':
        return <Inventory />;
      case 'analytics':
        return userType === 'owner' ? <Analytics /> : <Dashboard userType={userType} />;
      case 'settings':
        return <Settings userType={userType} currentUserId={currentUserId} />;
      case 'riders':
        return <RiderManagement />;
      default:
        return <Dashboard userType={userType} />;
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo-container">
            <img src={logo} alt="Happy Tails Logo" className="logo-image" />
            <div className="brand-text">
              <span className="happy-text">Happy</span>
              <span className="tails-text">Tails</span>
            </div>
          </div>
          <div className="sidebar-meta-row">
            <div className="user-badge">
              <span className="user-type-label">
                {userType === 'owner' ? 'OWNER' : userType === 'staff' ? 'STAFF' : 'ACCOUNT'}
              </span>
            </div>
            {hasNotifications && <span className="sidebar-notification-indicator" aria-label="New notifications" />}
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            {renderNavLabel('Overview', 'dashboard')}
          </button>

          <div className="nav-section">
            <button
              className={`nav-item ${currentPage === 'customers' ? 'active' : ''}`}
              onClick={() => setCurrentPage('customers')}
            >
              Customers
            </button>
            <button
              className={`nav-item ${currentPage === 'bookings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('bookings')}
            >
              {renderNavLabel('Bookings', 'bookings')}
            </button>
            <button
              className={`nav-item ${currentPage === 'orders' ? 'active' : ''}`}
              onClick={() => setCurrentPage('orders')}
            >
              {renderNavLabel('Orders', 'orders')}
            </button>
            <button
              className={`nav-item ${currentPage === 'reviews' ? 'active' : ''}`}
              onClick={() => setCurrentPage('reviews')}
            >
              Reviews
            </button>
            <button
              className={`nav-item ${currentPage === 'riders' ? 'active' : ''}`}
              onClick={() => setCurrentPage('riders')}
            >
              Rider Management
            </button>
            <button
              className={`nav-item ${currentPage === 'inventory' ? 'active' : ''}`}
              onClick={() => setCurrentPage('inventory')}
            >
              Inventory
            </button>
            {userType === 'owner' && (
              <button
                className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
                onClick={() => setCurrentPage('analytics')}
              >
                Analytics
              </button>
            )}
            <button
              className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('settings')}
            >
              Settings
            </button>
          </div>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
