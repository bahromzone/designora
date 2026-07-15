import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../hooks/useNotifications';

const badgeStyles = {
  review: 'bg-indigo-50 text-indigo-600',
  finance: 'bg-emerald-50 text-emerald-600',
  community: 'bg-amber-50 text-amber-600',
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { info } = useToast();
  const notificationsQuery = useNotificationsQuery();
  const markNotificationRead = useMarkNotificationReadMutation();
  const notifications = notificationsQuery.data ?? [];

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.read);
    await Promise.all(
      unreadNotifications.map((notification) =>
        markNotificationRead.mutateAsync(notification.id),
      ),
    );
    info('Barcha notificationlar o‘qilgan deb belgilandi.');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">React Query bilan boshqariladigan inbox</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={!unreadCount || markNotificationRead.isPending}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markNotificationRead.mutate(notification.id)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                  notification.read
                    ? 'border-slate-200 bg-slate-50 text-slate-500'
                    : 'border-indigo-100 bg-indigo-50/60 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${badgeStyles[notification.type] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {notification.type}
                      </span>
                      {!notification.read ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-rose-500">
                          <Sparkles className="h-3 w-3" />
                          unread
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{notification.createdAt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
