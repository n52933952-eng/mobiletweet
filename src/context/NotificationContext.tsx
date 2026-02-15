import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { useUser } from './UserContext';

type NotificationPayload = {
  _id: string;
  type: 'like' | 'retweet' | 'follow' | 'reply';
  actor?: any;
  tweet?: any;
  read: boolean;
  createdAt: string;
};

interface NotificationContextType {
  unreadCount: number;
  newNotifications: NotificationPayload[];
  clearUnread: () => void;
  clearNew: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotifications, setNewNotifications] = useState<NotificationPayload[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setUnreadCount(0);
      setNewNotifications([]);
      return;
    }

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔔 Notification socket connected');
      socket.emit('setup', user._id);
    });

    socket.on('notification', (payload: NotificationPayload) => {
      console.log('🔔 New notification:', payload.type);
      setUnreadCount((c) => c + 1);
      setNewNotifications((prev) => [payload, ...prev]);
    });

    socket.on('disconnect', () => {
      console.log('🔔 Notification socket disconnected');
    });

    return () => {
      socket.off('notification');
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [user?._id]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  const clearNew = useCallback(() => setNewNotifications([]), []);

  const value = useMemo(
    () => ({ unreadCount, newNotifications, clearUnread, clearNew }),
    [unreadCount, newNotifications, clearUnread, clearNew],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
