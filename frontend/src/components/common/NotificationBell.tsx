import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { notificationsAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { QUERY_KEYS } from '../../constants';
import { Notification } from '../../types';
import { getNotificationRoute } from '../../utils/notificationRoutes';

const NotificationBell: React.FC<{ linkTo?: string }> = ({ linkTo = '/notifications' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD],
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const { data: listData } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'bell'],
    queryFn: () => notificationsAPI.getAll({ limit: 8 }),
    enabled: open,
  });

  const unreadCount = (countData as { count?: number })?.count ?? 0;
  const notifications: Notification[] = ((listData as { data?: Notification[] })?.data) ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    await notificationsAPI.markRead(id);
    qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD] });
  };

  const handleNotificationClick = async (n: Notification) => {
    const route = getNotificationRoute(user?.role, n);
    if (!n.is_read) await markRead(n.id);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            {unreadCount > 0 && <span className="text-xs text-gray-400">{unreadCount} unread</span>}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
            ) : notifications.map(n => {
              const route = getNotificationRoute(user?.role, n);
              return (
                <div
                  key={n.id}
                  role={route ? 'button' : undefined}
                  tabIndex={route ? 0 : undefined}
                  onClick={() => route && handleNotificationClick(n)}
                  onKeyDown={e => route && e.key === 'Enter' && handleNotificationClick(n)}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/40' : ''} ${route ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      {route && (
                        <p className="text-xs text-agri-green mt-1">Click to view →</p>
                      )}
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(n.id); }}
                        className="p-1 text-gray-400 hover:text-agri-green flex-shrink-0"
                        title="Mark read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Link to={linkTo} onClick={() => setOpen(false)} className="block text-center text-xs text-agri-green font-medium py-3 hover:bg-gray-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
