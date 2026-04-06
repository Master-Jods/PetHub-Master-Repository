import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SidebarProfile.css';

const SidebarProfile = ({ activeTab, onTabChange, user, unreadCount, onLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (tab) => {
    onTabChange(tab);
  };

  const handleSettings = () => {
    onTabChange('settings');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <aside className="profile-sidebar">
      {/* User Profile Section */}
      <div className="sidebar-user">
        <div className="user-avatar-wrapper">
          <img 
            src={user.avatar || '/src/assets/default-avatar.png'} 
            alt={user.name}
            className="user-avatar"
          />
          {unreadCount > 0 && (
            <span className="notification-dot"></span>
          )}
        </div>
        <h3 className="user-name">{user.name}</h3>
        <p className="user-email">{user.email}</p>
        <div className="user-badge">Member since {user.memberSince}</div>
      </div>

      {/* Navigation Menu - Direct navigation, no sliding */}
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleNavigation('overview')}
        >
          <span className="nav-text">Overview</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleNavigation('upcoming')}
        >
          <span className="nav-text">Upcoming Bookings</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => handleNavigation('past')}
        >
          <span className="nav-text">Past Bookings</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleNavigation('orders')}
        >
          <span className="nav-text">Order History</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => handleNavigation('reviews')}
        >
          <span className="nav-text">My Reviews</span>
        </button>

      </nav>

      {/* Footer Actions */}
      <div className="sidebar-footer">
        <button className={`footer-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={handleSettings}>
          Account Settings
        </button>
        <button className="footer-btn logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default SidebarProfile;
