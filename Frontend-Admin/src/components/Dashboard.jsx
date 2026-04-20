import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Dashboard.css';
import NotificationBell from './shared/NotificationBell';
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pethub-customer-api.onrender.com/api';

const emptyDashboard = {
  notifications: [],
  unreadCount: 0,
  stats: {
    totalCustomers: 0,
    customerGrowth: 0,
    todayBookings: 0,
    pendingOrders: 0,
  },
  schedule: [],
  alerts: [],
  recentActivity: [],
};

function Dashboard({ userType, onNotificationCountChange }) {
  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [profileName, setProfileName] = useState(userType === 'owner' ? 'Owner' : 'Staff');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load overview.');
        }

        setDashboardData({
          ...emptyDashboard,
          ...payload,
        });
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load overview.');
      } finally {
        setLoading(false);
      }
    };

    const loadProfileName = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) return;

        const response = await fetch(`${API_BASE_URL}/settings/profile/${userId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return;

        if (payload.profile?.name) {
          setProfileName(payload.profile.name);
        }
      } catch (_error) {
        // Keep dashboard resilient if profile fetch fails.
      }
    };

    loadDashboard();
    loadProfileName();
  }, [userType]);

  useEffect(() => {
    if (onNotificationCountChange) {
      onNotificationCountChange(dashboardData.unreadCount || 0);
    }
  }, [dashboardData.unreadCount, onNotificationCountChange]);

  const profileInitials = useMemo(() => {
    const parts = profileName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return userType === 'owner' ? 'OW' : 'ST';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  }, [profileName, userType]);

  const handleNotificationClick = async (notificationId) => {
    const notification = dashboardData.notifications.find((item) => item.id === notificationId);
    if (!notification) return;

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/notifications/${notification.type}/${notification.recordId}/read`, {
        method: 'PATCH',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update notification.');
      }

      setDashboardData((prev) => ({
        ...prev,
        notifications: payload.notifications ?? prev.notifications,
        unreadCount: payload.unreadCount ?? prev.unreadCount,
      }));
    } catch (_error) {
      // Keep dropdown interaction lightweight if read state fails.
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/notifications/read-all`, {
        method: 'PATCH',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to mark notifications as read.');
      }

      setDashboardData((prev) => ({
        ...prev,
        notifications: payload.notifications ?? prev.notifications.map((item) => ({ ...item, read: true })),
        unreadCount: payload.unreadCount ?? 0,
      }));
    } catch (markError) {
      setError(markError.message || 'Failed to mark notifications as read.');
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedItem(null);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Welcome back, {userType === 'owner' ? 'Owner' : 'Staff'}!</h1>
          <p className="dashboard-subtitle">Here&apos;s what&apos;s happening at Happy Tails today.</p>
        </div>
        <div className="dashboard-header-actions">
          <NotificationBell
            notifications={dashboardData.notifications}
            unreadCount={dashboardData.unreadCount}
            title="Overview Notifications"
            emptyMessage="No recent notifications."
            onNotificationClick={handleNotificationClick}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
          <div className="dashboard-profile">
            <div className="dashboard-profile-info">
              <span className="dashboard-profile-name">{profileName}</span>
              <span className="dashboard-profile-role">{userType === 'owner' ? 'Owner' : 'Staff'}</span>
            </div>
            <div className="dashboard-profile-avatar">{profileInitials}</div>
          </div>
        </div>
      </div>

      {error && <div className="dashboard-feedback dashboard-feedback--error">{error}</div>}
      {loading && <div className="dashboard-feedback">Loading overview...</div>}

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-label">Total Customers</h3>
          <div className="dashboard-stat-value">{dashboardData.stats.totalCustomers}</div>
          <div className={`dashboard-stat-growth ${dashboardData.stats.customerGrowth >= 0 ? 'dashboard-growth-positive' : 'dashboard-growth-negative'}`}>
            {dashboardData.stats.customerGrowth >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.stats.customerGrowth)}%
          </div>
        </div>
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-label">Today&apos;s Bookings</h3>
          <div className="dashboard-stat-value">{dashboardData.stats.todayBookings}</div>
        </div>
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-label">Pending Orders</h3>
          <div className="dashboard-stat-value">{dashboardData.stats.pendingOrders}</div>
        </div>
      </div>

      <div className="dashboard-three-column">
        <div className="dashboard-column">
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Today&apos;s Schedule</h2>
            <div className="dashboard-schedule-list">
              {dashboardData.schedule.length > 0 ? (
                dashboardData.schedule.map((item) => (
                  <div key={item.id} className="dashboard-schedule-item">
                    <span className={`dashboard-schedule-badge ${item.type === 'Boarding' ? 'dashboard-badge-hotel' : 'dashboard-badge-grooming'}`}>
                      {item.type}
                    </span>
                    <div className="dashboard-schedule-content">
                      <span className="dashboard-pet-name">Pet: {item.petName} - {item.service}</span>
                      <div className="dashboard-schedule-actions">
                        <span className="dashboard-schedule-time">{item.time}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowPopup(true);
                          }}
                          className={`dashboard-view-btn ${item.type === 'Boarding' ? 'dashboard-view-hotel' : 'dashboard-view-schedule'}`}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">No bookings scheduled for today.</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-column">
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Alerts & Notifications</h2>
            <div className="dashboard-alerts-list">
              {dashboardData.alerts.length > 0 ? (
                dashboardData.alerts.map((alert) => (
                  <div key={alert.id} className="dashboard-alert-item">
                    <span className="dashboard-alert-icon">{alert.icon}</span>
                    <div className="dashboard-alert-content">
                      <strong className="dashboard-alert-title">{alert.title}</strong>
                      <p className="dashboard-alert-message">{alert.message}</p>
                      <span className="dashboard-alert-time">{alert.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">No alerts right now.</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-column">
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Recent Activity</h2>
            <div className="dashboard-activity-list">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="dashboard-activity-item">
                    <span className="dashboard-activity-icon">{activity.icon}</span>
                    <div className="dashboard-activity-content">
                      <strong className="dashboard-activity-title">{activity.title}</strong>
                      <p className="dashboard-activity-message">{activity.message}</p>
                      <span className="dashboard-activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">No recent activity yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPopup && selectedItem && (
        <div className="dashboard-popup-overlay" onClick={closePopup}>
          <div className="dashboard-popup-content" onClick={(event) => event.stopPropagation()}>
            <button className="dashboard-popup-close" onClick={closePopup}>×</button>

            <div className="dashboard-popup-header">
              <h3 className="dashboard-popup-title">Booking Details</h3>
              <span className={`dashboard-popup-status dashboard-status-${String(selectedItem.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                {selectedItem.status}
              </span>
            </div>

            <div className="dashboard-popup-body">
              <div className="dashboard-popup-section">
                <h4>Pet Information</h4>
                <div className="dashboard-popup-info-grid">
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Pet Name:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.petName}</span>
                  </div>
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Type:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.petType}</span>
                  </div>
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Breed:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.breed}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-popup-section">
                <h4>Service Details</h4>
                <div className="dashboard-popup-info-grid">
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Service:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.service}</span>
                  </div>
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Date:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.date}</span>
                  </div>
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Time:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.time}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-popup-section">
                <h4>Owner Information</h4>
                <div className="dashboard-popup-info-grid">
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Name:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.owner}</span>
                  </div>
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Contact:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.contact || 'N/A'}</span>
                  </div>
                  <div className="dashboard-popup-info-item">
                    <span className="dashboard-popup-info-label">Email:</span>
                    <span className="dashboard-popup-info-value">{selectedItem.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-popup-section">
                <h4>Inclusions</h4>
                <ul className="dashboard-popup-inclusions-list">
                  {(selectedItem.includes || []).length > 0 ? (
                    selectedItem.includes.map((item) => (
                      <li key={item} className="dashboard-popup-inclusion-item">{item}</li>
                    ))
                  ) : (
                    <li className="dashboard-popup-inclusion-item">No inclusions listed.</li>
                  )}
                </ul>
              </div>

              <div className="dashboard-popup-total">
                <span className="dashboard-popup-total-label">Total Amount:</span>
                <span className="dashboard-popup-total-value">{selectedItem.price}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

Dashboard.propTypes = {
  userType: PropTypes.string,
  onNotificationCountChange: PropTypes.func,
};
