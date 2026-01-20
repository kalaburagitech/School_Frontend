import { useState, useEffect } from 'react';
import {
    TrendingUp, Users, DollarSign, Activity, Calendar,
    Briefcase, CreditCard, BarChart2
} from 'lucide-react';
import clsx from 'clsx';
import api from '../utils/api';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
                <p className={clsx("text-xs font-medium mt-2", color === 'indigo' ? "text-indigo-600" : "text-emerald-600")}>
                    {subtext}
                </p>
            </div>
            <div className={clsx("p-3 rounded-xl", `bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600`)}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const OwnerDashboard = () => {
    const [stats, setStats] = useState({
        totalCollections: 0,
        pendingFees: 0,
        monthlyPayroll: 0,
        attendanceRate: 0,
        studentTeacherRatio: '0:1'
    });

    useEffect(() => {
        // Mock data fetching or real API calls would go here
        // simulating fetch for now to show UI structure
        setTimeout(() => {
            setStats({
                totalCollections: "₹ 12.5L",
                pendingFees: "₹ 4.2L",
                monthlyPayroll: "₹ 8.5L",
                attendanceRate: "94%",
                studentTeacherRatio: "25:1"
            });
        }, 1000);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Owner's Command Center</h1>
                <p className="text-slate-500">High-level financial and operational overview.</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Expected Monthly Revenue"
                    value={stats.totalCollections}
                    subtext="+12% from last month"
                    icon={DollarSign}
                    color="emerald"
                />
                <StatCard
                    title="Estimated Payroll"
                    value={stats.monthlyPayroll}
                    subtext="For 45 Employees"
                    icon={CreditCard}
                    color="indigo"
                />
                <StatCard
                    title="Avg Attendance"
                    value={stats.attendanceRate}
                    subtext="Student & Staff Combined"
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    title="Student/Teacher Ratio"
                    value={stats.studentTeacherRatio}
                    subtext="Optimal is 20:1"
                    icon={Users}
                    color="amber"
                />
            </div>

            {/* Charts Section (Visual Mockups using CSS/Divs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Attendance Trend */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Calendar size={18} className="text-indigo-600" />
                            Attendance Trends
                        </h3>
                        <select className="text-xs border rounded-lg px-2 py-1 bg-slate-50">
                            <option>This Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>
                    {/* Mock Chart Area */}
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {[65, 78, 85, 90, 88, 92, 94].map((h, i) => (
                            <div key={i} className="w-full bg-indigo-50 dark:bg-indigo-900/10 rounded-t-lg relative group">
                                <div
                                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all duration-1000"
                                    style={{ height: `${h}%` }}
                                ></div>
                                <div className="absolute -bottom-6 w-full text-center text-[10px] text-slate-400">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-600" />
                            Revenue vs Expenses
                        </h3>
                    </div>
                    {/* Comparison Bars */}
                    <div className="space-y-6 pt-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Fee Collection (Reached)</span>
                                <span className="font-bold text-slate-700">75%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-3/4 rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Operational Expenses</span>
                                <span className="font-bold text-slate-700">45%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 w-[45%] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Payroll Allocation</span>
                                <span className="font-bold text-slate-700">60%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions for Owner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-3 hover:bg-indigo-100 transition-colors">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg"><DollarSign size={20} /></div>
                    <div className="text-left">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Detailed Finance Report</h4>
                        <p className="text-xs text-indigo-600/70">Download PDF</p>
                    </div>
                </button>
                <button className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3 hover:bg-emerald-100 transition-colors">
                    <div className="bg-emerald-600 text-white p-2 rounded-lg"><CreditCard size={20} /></div>
                    <div className="text-left">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Run Payroll</h4>
                        <p className="text-xs text-emerald-600/70">Approve & Disburse</p>
                    </div>
                </button>
                <button className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-500/20 flex items-center gap-3 hover:bg-amber-100 transition-colors">
                    <div className="bg-amber-600 text-white p-2 rounded-lg"><BarChart2 size={20} /></div>
                    <div className="text-left">
                        <h4 className="font-bold text-amber-900 dark:text-amber-300">School Performance</h4>
                        <p className="text-xs text-amber-600/70">Academic vs Ops</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default OwnerDashboard;
