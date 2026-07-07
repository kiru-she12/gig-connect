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

      if (user.role === 'admin' || user.role === 'manager') {
        // Complaints & Alerts removed permanently
        setNotifications([]);
      } else {
        // Fetch user notifications
        const response = await axios.get(`${apiUrl}/api/notifications/get_notifications.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data.notifications)) {
          const mapped = response.data.notifications.map(item => ({
            id: item.notification_ID,
            type: item.type || 'general',
            title: item.type ? item.type.toUpperCase() : 'Notification',
            message: item.message,
            time: new Date(item.created_at).toLocaleDateString(),
            read: item.status === 'read',
            icon: '🔵'
          }));
          setNotifications(mapped);
        } else {
          // Fallback static notifications for student/client
          setNotifications([
            {
              id: 1,
              type: 'recommendation',
              title: 'New Job Recommended',
              message: 'A new Web Dev gig matches your skills.',
              time: '2 hours ago',
              read: false,
              icon: '🔵'
            },
            {
              id: 2,
              type: 'shortlisted',
              title: 'Application Shortlisted',
              message: 'You have been shortlisted for Logo Design.',
              time: '5 hours ago',
              read: true,
              icon: '🟡'
            }
          ]);
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    
    // Poll notifications every 8 seconds to keep it dynamic and fresh!
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';

      if (id.toString().startsWith('COMPLAINT-')) {
        const originalId = id.replace('COMPLAINT-', '');
        await axios.post(`${apiUrl}/api/admin/complaints.php`, 
          { id: originalId, status: 'Read' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // For general user notification
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';

      if (user.role === 'admin' || user.role === 'manager') {
        // Mark all pending complaints as Read
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => {
          return axios.post(`${apiUrl}/api/admin/complaints.php`, 
            { id: n.originalId, status: 'Read' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }));
      } else {
        // General notification mark all read API
        await axios.get(`${apiUrl}/api/notifications/get_notifications.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: Date.now(), read: false, time: 'Just now' }, ...prev]);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, markAsRead, markAllRead, addNotification, fetchNotifications, loading }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
