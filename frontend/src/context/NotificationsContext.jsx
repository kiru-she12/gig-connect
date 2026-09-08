import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';

      const response = await axios.get(`${apiUrl}/api/notifications/get_notifications.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data.notifications)) {
        const mapped = response.data.notifications.map(item => ({
          id: item.notification_ID,
          notification_ID: item.notification_ID,
          type: item.type || 'general',
          title: item.title || (item.type ? item.type.replace('_', ' ').toUpperCase() : 'Notification'),
          message: item.message,
          time: item.created_at ? new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now',
          created_at: item.created_at,
          read: item.status === 'read' || item.is_read == 1,
          target_url: item.target_url || null,
          icon: item.type === 'job_accepted' ? '🎉' :
                item.type === 'job_shortlisted' ? '🌟' :
                item.type === 'job_applied' ? '📤' :
                item.type?.includes('delivery') ? '🚚' :
                item.type === 'payment_confirmed' ? '💳' :
                item.type === 'review_received' ? '⭐' : '🔵'
        }));
        setNotifications(mapped);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';

      await axios.post(`${apiUrl}/api/notifications/mark_read.php`, 
        { notification_ID: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';

      await axios.post(`${apiUrl}/api/notifications/mark_read.php`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      loading,
      fetchNotifications,
      markAsRead,
      markAllRead
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
