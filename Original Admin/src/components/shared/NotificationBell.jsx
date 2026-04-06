import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './NotificationBell.css';

function NotificationBell({
  notifications = [],
  unreadCount = 0,
  title = 'Notifications',
  emptyMessage = 'No notifications.',
  onNotificationClick,
  onMarkAllAsRead
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell-wrapper">
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={title}
      >
        <span className="notification-bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className="notification-bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown" role="dialog" aria-label={title}>
          <div className="notification-dropdown-header">
            <h3>{title}</h3>
            <button
              type="button"
              className="notification-mark-all"
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notification-item ${item.read ? '' : 'notification-item-unread'}`}
                  onClick={() => {
                    if (onNotificationClick) onNotificationClick(item.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="notification-item-heading">
                    <p className="notification-item-title">{item.title}</p>
                    {item.status && <span className={`notification-status notification-status-${item.status}`}>{item.status}</span>}
                  </div>
                  <p className="notification-item-message">{item.message}</p>
                  {item.time && <span className="notification-item-time">{item.time}</span>}
                </button>
              ))
            ) : (
              <div className="notification-empty">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

NotificationBell.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    time: PropTypes.string,
    read: PropTypes.bool,
    status: PropTypes.oneOf(['pending', 'accepted', 'rejected', 'info'])
  })),
  unreadCount: PropTypes.number,
  title: PropTypes.string,
  emptyMessage: PropTypes.string,
  onNotificationClick: PropTypes.func,
  onMarkAllAsRead: PropTypes.func
};

export default NotificationBell;
