import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth, socket } from '../context/AuthContext';
import {
    LayoutDashboard, Users, Briefcase, Bus, Map, LogOut,
    Bell, Settings, User, Sun, Moon, Search, Menu, X as CloseIcon,
    UserCog, ClipboardCheck, FileText, DollarSign, TrendingUp, UserPlus, ClipboardList
} from 'lucide-react';
import clsx from 'clsx';
import Button from './ui/Button';
import { useTheme } from '../context/ThemeContext';
import NotificationTray from './NotificationTray';
import ProfileModal from './ProfileModal';
import Modal from './ui/Modal';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const { theme } = useTheme();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        ...(user?.role === 'owner' || user?.role === 'principal' ? [{ name: 'Owner Dashboard', path: '/owner-dashboard', icon: TrendingUp }] : []),
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Employees', path: '/employees', icon: Briefcase },
        { name: 'Transport', path: '/transport', icon: Bus },
        { name: 'Live Tracking', path: '/tracking', icon: Map },
    ];

    const academicItems = [
        { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
        { name: 'Operations Hub', path: '/operations', icon: ClipboardList }, // The Others Tab
        { name: 'Exams', path: '/exams', icon: FileText },
        { name: 'Fees', path: '/fees', icon: DollarSign },
    ];

    const adminItems = [
        { name: 'User Management', path: '/users', icon: UserCog },
        { name: 'Onboard Employee', path: '/employees/new', icon: UserPlus },
    ];

    return (
        <div className={clsx(
            "h-screen w-72 fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 border-r",
            theme === 'dark' ? "bg-slate-900 border-white/5" : "bg-slate-950 border-white/5",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
            <div className="p-8 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Bus className="text-white" size={24} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Antigravity <span className="text-indigo-400">SMP</span></h1>
                </div>
                <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white">
                    <CloseIcon size={20} />
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
                <p className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Main Menu</p>
                {navItems.filter(item => {
                    // Staff restriction: Can only see Dashboard (basic) or specific items
                    if (user?.role === 'staff') {
                        return ['Dashboard', 'Employees'].includes(item.name);
                    }
                    if (user?.role === 'student' || user?.role === 'parent') {
                        return ['Dashboard', 'Live Tracking', 'Employees'].includes(item.name);
                    }
                    return true;
                }).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? 'text-white' : 'group-hover:text-primary-400')} />
                            <span className="font-medium text-[15px]">{item.name}</span>
                        </Link>
                    )
                })}

                <p className="px-4 py-2 pt-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Academic</p>
                {academicItems.filter(item => {
                    if (user?.role === 'staff') {
                        return ['Attendance'].includes(item.name);
                    }
                    return true;
                }).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? 'text-white' : 'group-hover:text-primary-400')} />
                            <span className="font-medium text-[15px]">{item.name}</span>
                        </Link>
                    )
                })}

                {user?.role === 'admin' && (
                    <>
                        <p className="px-4 py-2 pt-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Administration</p>
                        {adminItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        'flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                                        isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    <Icon size={20} className={clsx(isActive ? 'text-white' : 'group-hover:text-primary-400')} />
                                    <span className="font-medium text-[15px]">{item.name}</span>
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            <div className="p-6 mt-auto">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 text-slate-500 hover:text-red-400 w-full px-4 py-3 rounded-2xl transition-all hover:bg-red-500/10 group"
                >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-sm tracking-wide">Logout</span>
                </button>
            </div>
        </div>
    );
};

const Navbar = ({ onMenuClick, onProfileOpen }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    // Stable audio path fallback if needed, but we'll try to keep it stable with pre-fetch
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, []);

    // Auto-unlock audio on first interaction
    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current.play().then(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }).catch(() => { });
            }
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setUnreadCount(prev => prev + 1);
            // Play sound
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => {
                    console.log('Audio play blocked. Click anywhere to enable.', e);
                });
            }
        };

        socket.on('newNotification', handleNewNotification);
        socket.on(`roleNotification:${user?.role}`, handleNewNotification);
        socket.on(`userNotification:${user?._id}`, handleNewNotification);

        return () => {
            socket.off('newNotification', handleNewNotification);
            socket.off(`roleNotification:${user?.role}`, handleNewNotification);
            socket.off(`userNotification:${user?._id}`, handleNewNotification);
        };
    }, [socket, user]);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/notifications');
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    return (
        <header className={clsx(
            "h-20 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 border-b backdrop-blur-md transition-colors duration-300",
            theme === 'dark' ? "bg-slate-950/80 border-white/5 text-white" : "bg-white/80 border-slate-100 text-slate-900"
        )}>
            <div className="flex items-center space-x-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2.5 bg-indigo-600/10 text-indigo-600 rounded-xl hover:bg-indigo-600/20 transition-all"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center space-x-2">
                    <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        theme === 'dark' ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                    )}>
                        <LayoutDashboard size={16} />
                    </div>
                    <div>
                        <p className={clsx("text-xs font-bold uppercase tracking-wider", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>Workspace</p>
                        <p className="text-sm font-bold">Main Dashboard</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                {user?.role !== 'admin' && (
                    <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center space-x-2 mr-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Viewer Mode</span>
                    </div>
                )}

                <button
                    onClick={toggleTheme}
                    className={clsx(
                        "p-3 rounded-xl transition-all duration-300 group",
                        theme === 'dark' ? "text-amber-400 hover:bg-amber-400/10" : "text-slate-400 hover:bg-slate-50 hover:text-primary"
                    )}
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                        }}
                        className={clsx(
                            "p-3 rounded-xl transition-all relative group",
                            showNotifications ? "bg-primary text-white shadow-lg shadow-primary/20" :
                                (theme === 'dark' ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-50")
                        )}
                    >
                        <Bell size={20} className="group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-in zoom-in duration-300 ring-2 ring-red-600/20">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {unreadCount > 0 && !showNotifications && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse z-20 pointer-events-none">
                            {unreadCount} NEW
                        </div>
                    )}
                    {showNotifications && (
                        <NotificationTray
                            onClose={() => setShowNotifications(false)}
                            onRefresh={fetchUnreadCount}
                        />
                    )}
                </div>

                <div className={clsx(
                    "h-8 w-[1px] mx-2",
                    theme === 'dark' ? "bg-white/5" : "bg-slate-100"
                )} />

                <button
                    onClick={onProfileOpen}
                    className={clsx(
                        "flex items-center space-x-3 pl-3 pr-4 py-2 rounded-xl transition-all border group",
                        theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    )}
                >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform overflow-hidden">
                        {user?.profile_image ? (
                            <img
                                src={user.profile_image.startsWith('/') ? `http://localhost:5000${user.profile_image}` : user.profile_image}
                                className="w-full h-full object-cover"
                                alt="P"
                            />
                        ) : (
                            user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'
                        )}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-50">Profile</p>
                        <p className="text-xs font-bold leading-none truncate max-w-[100px]">
                            {user?.full_name || user?.email?.split('@')[0] || 'Admin'}
                        </p>
                    </div>
                </button>
            </div>
        </header>
    );
};

const Layout = () => {
    const { theme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className={clsx(
            "min-h-screen flex transition-colors duration-300",
            theme === 'dark' ? "bg-[#020617]" : "bg-[#f8fafc]"
        )}>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
                <Navbar
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onProfileOpen={() => setShowProfile(true)}
                />
                <main className="p-4 md:p-8 flex-1">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Profile Modal - Moved outside navbar to ensure proper z-index layering */}
            <Modal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                title="Account Settings"
                maxWidth="max-w-4xl"
            >
                <ProfileModal onCancel={() => setShowProfile(false)} />
            </Modal>
        </div>
    );
};

export default Layout;
