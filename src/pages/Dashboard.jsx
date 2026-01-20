import { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Users, Bus, MapPin, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card className="relative overflow-hidden group border-none shadow-premium">
        <div className={clsx(
            "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150",
            color === 'primary' ? 'bg-indigo-600' : color === 'amber' ? 'bg-amber-500' : color === 'green' ? 'bg-emerald-500' : 'bg-red-500'
        )}></div>
        <div className="flex items-center justify-between mb-4">
            <div className={clsx(
                "p-3 rounded-2xl transition-all duration-300 group-hover:rotate-6",
                color === 'primary' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                    color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
                        color === 'green' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            'bg-red-500/10 text-red-600'
            )}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-wider">
                    <TrendingUp size={12} className="mr-1" /> {trend}
                </span>
            )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wide uppercase">{title}</p>
        <h3 className={clsx(
            "text-3xl font-bold mt-1 tracking-tight",
            color === 'primary' ? 'text-indigo-600 dark:text-indigo-400' :
                color === 'amber' ? 'text-amber-600 dark:text-amber-500' :
                    color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
                        'text-red-600 dark:text-red-400'
        )}>{value}</h3>
    </Card>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        buses: 0,
        activeTrips: 0,
        alerts: 2
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [students, buses, routes] = await Promise.all([
                    api.get('/students'),
                    api.get('/buses'),
                    api.get('/routes')
                ]);
                setStats({
                    students: students.data.length,
                    buses: buses.data.length,
                    activeTrips: routes.data.length,
                    alerts: 0
                });
            } catch (error) { console.error(error); }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Morning Overview</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">"Everything is running smoothly today."</p>
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-premium text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5">
                    <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={stats.students} icon={Users} color="primary" trend="+12%" />
                <StatCard title="Fleet Status" value={`${stats.buses} units`} icon={Bus} color="amber" trend="Safe" />
                <StatCard title="Active Routes" value={stats.activeTrips} icon={MapPin} color="green" trend="Live" />
                <StatCard title="System Alerts" value={stats.alerts} icon={AlertCircle} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <Card className="lg:col-span-2 p-0 overflow-hidden border-none shadow-premium">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white">Operational Efficiency</h3>
                        <Button variant="ghost" size="sm">View Reports</Button>
                    </div>
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <TrendingUp size={48} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium italic text-sm">Analytics and performance charts will be integrated here.</p>
                    </div>
                </Card>

                <Card className="p-6 space-y-6 border-none shadow-premium dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4">Recent Activity</h3>
                    {[
                        { time: '2m ago', desc: 'Bus DL-05 reached Stop A', type: 'info' },
                        { time: '15m ago', desc: 'New student added: Aryan', type: 'add' },
                        { time: '1h ago', desc: 'Driver Rahul started shift', type: 'driver' },
                        { time: '3h ago', desc: 'Maintenance completed: DL-02', type: 'warn' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start space-x-4">
                            <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">{item.desc}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
