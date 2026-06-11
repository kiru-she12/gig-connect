import React, { createContext, useContext, useState } from 'react';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
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

  const addNotification = (notif) => {
    setNotifications([{ ...notif, id: Date.now(), read: false, time: 'Just now' }, ...notifications]);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
