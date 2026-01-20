import { Bell, CheckCircle2, AlertTriangle, Clock, X, Info, FileText, Briefcase, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const NotificationTray = ({ onClose, onRefresh }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOnlyUnread, setShowOnlyUnread] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayNotifications = useMemo(() => {
        return showOnlyUnread ? notifications.filter(n => !n.isRead) : notifications;
    }, [notifications, showOnlyUnread]);

    const handleNotificationClick = async (n) => {
        if (!n.isRead) {
            try {
                await api.patch(`/notifications/${n._id}/read`);
                setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, isRead: true } : notif));
                if (onRefresh) onRefresh();
                // If showing only unread, we can also manually remove it from the list for immediate feedback
                if (showOnlyUnread) {
                    setTimeout(() => {
                        setNotifications(prev => prev.filter(notif => notif._id !== n._id || !notif.isRead));
                    }, 300); // Small delay for visual transition
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (n.link) {
            navigate(n.link);
        }
        onClose();
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={16} />;
            case 'warning': return <AlertTriangle size={16} />;
            case 'EXAM': return <FileText size={16} />;
            case 'LEAVE': return <Briefcase size={16} />;
            case 'EVENT': return <Bell size={16} />;
            case 'NOTICE': return <Info size={16} />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <div className={clsx(
            "absolute right-0 top-14 w-80 md:w-96 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border transition-all duration-300 animate-in slide-in-from-top-4 z-50 overflow-hidden",
            theme === 'dark' ? "bg-slate-900 border-white/10 backdrop-blur-xl" : "bg-white border-slate-200 backdrop-blur-xl"
        )}>
            {/* Header */}
            <div className="p-4 border-b border-inherit flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Bell size={18} className="text-primary" />
                        Notifications
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.isRead).length} new
                        </span>
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                        className={clsx(
                            "text-[10px] font-bold px-2 py-1 rounded-lg transition-all",
                            showOnlyUnread ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        )}
                    >
                        {showOnlyUnread ? 'Unread' : 'All'}
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-slate-400">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[450px] overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm font-medium">Fetching alerts...</span>
                    </div>
                ) : displayNotifications.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <Bell size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-500">All caught up!</p>
                        <p className="text-xs text-slate-400">No {showOnlyUnread ? 'unread ' : ''}notifications.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-inherit">
                        {displayNotifications.map((n) => (
                            <div key={n._id}
                                onClick={() => handleNotificationClick(n)}
                                className={clsx(
                                    "p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group relative",
                                    !n.isRead && (theme === 'dark' ? "bg-blue-500/5" : "bg-blue-50/50")
                                )}>
                                {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                <div className="flex space-x-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        n.type === 'success' ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400" :
                                            n.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                                                n.type === 'EXAM' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" :
                                                    n.type === 'EVENT' ? "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" :
                                                        "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                    )}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={clsx("text-sm truncate group-hover:text-primary transition-colors", !n.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-400")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-50/50 dark:bg-white/5 border-t border-inherit flex gap-2">
                <button
                    onClick={markAllAsRead}
                    disabled={notifications.every(n => n.isRead)}
                    className="flex-1 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Mark All Read
                </button>
                <button
                    onClick={() => setNotifications([])}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Clear View"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default NotificationTray;
