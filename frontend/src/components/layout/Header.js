import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { Bell, Menu, X, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

export const Header = ({ title, onMenuClick, isMobileMenuOpen }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await getNotifications();
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <header className="sticky top-0 z-40 w-full glass border-b border-slate-200" data-testid="header">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        data-testid="mobile-menu-toggle"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-5 h-5 text-slate-600" />
                        ) : (
                            <Menu className="w-5 h-5 text-slate-600" />
                        )}
                    </button>
                    <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="relative"
                                data-testid="notifications-button"
                            >
                                <Bell className="w-5 h-5 text-slate-600" />
                                {unreadCount > 0 && (
                                    <span className="notification-badge" data-testid="notification-count">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80" data-testid="notifications-dropdown">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <h3 className="font-semibold text-slate-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                        data-testid="mark-all-read-button"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <ScrollArea className="h-72">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                                !notification.is_read ? 'bg-blue-50/50' : ''
                                            }`}
                                            data-testid={`notification-item-${notification.id}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {formatTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => handleMarkRead(notification.id)}
                                                        className="p-1 rounded hover:bg-slate-200 transition-colors"
                                                        data-testid={`mark-read-${notification.id}`}
                                                    >
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
