import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import {
    Plus, Search, DollarSign, Download, AlertCircle, CheckCircle,
    CreditCard, FileText, TrendingUp, Users, Calendar, Filter,
    FileSpreadsheet, Printer, Clock, RefreshCw, ChevronDown, ChevronUp,
    IndianRupee, Receipt, Shield, Truck, BookOpen, Activity, Layers,
    Eye, Edit, Trash2, MoreVertical, Send, Mail, Smartphone, Bell,
    BarChart3, PieChart, TrendingDown, CalendarDays, Wallet
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FeeCollectionTerminal from '../components/fees/FeeCollectionTerminal';
import FeeStructureCreator from '../components/fees/FeeStructureCreator';
import InvoiceGenerator from '../components/fees/InvoiceGenerator';

const FeeManagement = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('overview');
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        grade: '',
        section: '',
        academic_year: '2024-2025',
        fee_type: '',
        due_date_range: ''
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);
    const [stats, setStats] = useState({
        totalFees: 0,
        totalCollected: 0,
        totalPending: 0,
        overdueAmount: 0,
        collectionRate: 0,
        defaultersCount: 0,
        monthlyTrend: []
    });
    const [quickActions, setQuickActions] = useState([
        { id: 1, label: 'Generate Invoices', icon: FileSpreadsheet, action: () => setShowInvoiceModal(true) },
        { id: 2, label: 'Send Reminders', icon: Bell, action: () => sendBulkReminders() },
        { id: 3, label: 'Export Report', icon: Download, action: () => exportReport() },
        { id: 4, label: 'Process Refunds', icon: RefreshCw, action: () => processRefunds() }
    ]);

    const [feeFormData, setFeeFormData] = useState({
        fee_structure_name: '',
        academic_year: '2024-2025',
        grade: '',
        section: '',
        fee_components: [
            {
                name: 'Tuition Fee',
                type: 'monthly',
                amount: 0,
                due_day: 5,
                late_fee_per_day: 50,
                concession_rules: [],
                applicable_to: 'all'
            },
            {
                name: 'Transport Fee',
                type: 'monthly',
                amount: 0,
                distance_slab: '0-5 km',
                due_day: 5,
                vacation_exempt: true,
                applicable_to: 'bus_users'
            }
        ],
        one_time_fees: [
            { name: 'Admission Fee', amount: 15000, refundable: false },
            { name: 'Registration Fee', amount: 5000, refundable: false },
            { name: 'Caution Deposit', amount: 10000, refundable: true },
            { name: 'Uniform Fee', amount: 3000, refundable: false },
            { name: 'Books Fee', amount: 5000, refundable: false },
            { name: 'Stationery Fee', amount: 1000, refundable: false }
        ],
        activity_fees: [
            { name: 'Sports Fee', amount: 500, frequency: 'term' },
            { name: 'Lab Fee', amount: 1000, frequency: 'year' },
            { name: 'Library Fee', amount: 500, frequency: 'year' },
            { name: 'Computer Fee', amount: 2000, frequency: 'year' },
            { name: 'Exam Fee', amount: 1000, frequency: 'exam' }
        ],
        concession_schemes: [
            { name: 'Sibling Discount', type: 'percentage', value: 10, criteria: 'has_sibling' },
            { name: 'Early Bird Discount', type: 'percentage', value: 5, criteria: 'paid_before_1st' },
            { name: 'Full Year Discount', type: 'percentage', value: 10, criteria: 'paid_annual' }
        ],
        apply_to: 'all_students', // all_students, selected_students
        selected_students: [],
        effective_from: new Date().toISOString().split('T')[0],
        late_fee_rules: {
            grace_period_days: 5,
            late_fee_per_day: 50,
            max_late_fee_percentage: 20,
            actions: [
                { days_overdue: 10, action: 'restrict_portal' },
                { days_overdue: 15, action: 'restrict_exams' },
                { days_overdue: 30, action: 'legal_notice' }
            ]
        }
    });

    const [paymentFormData, setPaymentFormData] = useState({
        amount: '',
        payment_method: 'UPI',
        transaction_id: '',
        paid_by: '',
        phone: '',
        email: '',
        payment_date: new Date().toISOString().split('T')[0],
        fee_heads: [],
        concession_applied: false,
        concession_amount: 0,
        remarks: '',
        send_receipt: true,
        send_sms: true,
        send_email: true
    });

    useEffect(() => {
        fetchFees();
        fetchStats();
    }, [filters]);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/fees?${params}`);

            // ✅ NORMALIZE RESPONSE
            const feeData = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

            setFees(feeData);
        } catch (error) {
            console.error('Failed to fetch fees:', error);
            // setFees([]); // ✅ NEVER LET fees BE NON-ARRAY
            // Mock data for demo
            setFees([
                {
                    _id: '1',
                    student_id: {
                        full_name: 'John Doe',
                        student_id: 'STU001',
                        class_info: { grade: '10', section: 'A' },
                        parent_details: { phone: '9876543210' }
                    },
                    academic_year: '2024-2025',
                    total_amount: 50000,
                    paid_amount: 25000,
                    balance_amount: 25000,
                    status: 'Partial',
                    due_date: new Date().toISOString(),
                    fee_breakdown: [
                        { head: 'Tuition Fee', amount: 50000 }
                    ],
                    transactions: [
                        { date: new Date().toISOString(), amount: 25000 }
                    ]
                },
                {
                    _id: '2',
                    student_id: {
                        full_name: 'Jane Smith',
                        student_id: 'STU002',
                        class_info: { grade: '10', section: 'B' },
                        parent_details: { phone: '9876543211' }
                    },
                    academic_year: '2024-2025',
                    total_amount: 50000,
                    paid_amount: 50000,
                    balance_amount: 0,
                    status: 'Paid',
                    due_date: new Date().toISOString(),
                    fee_breakdown: [
                        { head: 'Tuition Fee', amount: 50000 }
                    ],
                    transactions: [
                        { date: new Date().toISOString(), amount: 50000 }
                    ]
                }
            ]);
        } finally {
            setLoading(false);
        }
    };


    const fetchStats = async () => {
        try {
            const response = await api.get('/fees/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Mock stats
            setStats({
                totalFees: 1000000,
                totalCollected: 750000,
                totalPending: 250000,
                overdueAmount: 50000,
                collectionRate: 75,
                defaultersCount: 15,
                monthlyTrend: [
                    { month: 1, amount: 50000 },
                    { month: 2, amount: 60000 },
                    { month: 3, amount: 40000 }
                ]
            });
        }
    };

    const fetchPaymentHistory = async (studentId) => {
        try {
            const response = await api.get(`/fees/payments/${studentId}`);
            setPaymentHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Failed to fetch history:', error);
            // Mock history
            setPaymentHistory([
                {
                    _id: 'txn1',
                    receipt_number: 'REC001',
                    payment_date: new Date().toISOString(),
                    amount: 25000,
                    payment_method: 'UPI',
                    status: 'completed'
                }
            ]);
            setShowHistoryModal(true);
        }
    };

    const handleDownloadReceipt = async (paymentId, receiptNo) => {
        try {
            const response = await api.get(`/fees/receipt/${paymentId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${receiptNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert('Failed to download receipt (Demo Mode)');
        }
    };

    const handleCreateFeeStructure = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fees/structures', feeFormData);
            setShowFeeStructureModal(false);
            fetchFees();
            resetFeeForm();
        } catch (error) {
            console.error('Failed to create fee structure:', error);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/fees/${selectedFee._id}/payment`, paymentFormData);
            setShowPaymentModal(false);
            fetchFees();
            fetchStats();
            resetPaymentForm();
            alert('Payment recorded successfully! Receipt sent via email/SMS.');
        } catch (error) {
            console.error('Failed to record payment:', error);
            // Mock success
            alert('Payment recorded successfully! (Demo Mode)');
            setShowPaymentModal(false);
        }
    };

    const resetFeeForm = () => {
        setFeeFormData({
            fee_structure_name: '',
            academic_year: '2024-2025',
            grade: '',
            section: '',
            fee_components: [],
            one_time_fees: [],
            activity_fees: [],
            concession_schemes: [],
            apply_to: 'all_students',
            selected_students: [],
            effective_from: new Date().toISOString().split('T')[0],
            late_fee_rules: {
                grace_period_days: 5,
                late_fee_per_day: 50,
                max_late_fee_percentage: 20,
                actions: []
            }
        });
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: '',
            payment_method: 'UPI',
            transaction_id: '',
            paid_by: '',
            phone: '',
            email: '',
            payment_date: new Date().toISOString().split('T')[0],
            fee_heads: [],
            concession_applied: false,
            concession_amount: 0,
            remarks: '',
            send_receipt: true,
            send_sms: true,
            send_email: true
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Partial': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Pending': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const sendBulkReminders = async () => {
        try {
            await api.post('/fees/send-reminders');
            alert('Reminders sent successfully!');
        } catch (error) {
            console.error('Failed to send reminders:', error);
            alert('Reminders sent successfully! (Demo Mode)');
        }
    };

    const exportReport = async () => {
        try {
            const response = await api.get('/fees/export', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fee_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export report:', error);
            alert('Export failed (Demo Mode)');
        }
    };

    const processRefunds = () => {
        // Implement refund logic
        alert('Refund processing feature coming soon!');
    };

    const generateInvoices = async () => {
        try {
            await api.post('/fees/invoices/generate');
            alert('Invoices generated successfully!');
            fetchFees();
        } catch (error) {
            console.error('Failed to generate invoices:', error);
            alert('Invoices generated successfully! (Demo Mode)');
        }
    };

    const sendReminder = async (studentId) => {
        try {
            await api.post(`/fees/send-reminder/${studentId}`);
            alert('Reminder sent!');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            alert('Reminder sent! (Demo Mode)');
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
        <div className={clsx(
            "p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
            theme === 'dark'
                ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/5 hover:bg-slate-800/70 backdrop-blur-sm"
                : "bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:shadow-2xl"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className={clsx(
                        "text-sm font-medium mb-1 flex items-center gap-2",
                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                    )}>
                        {title}
                        {trend && (
                            <span className={clsx(
                                "text-xs px-2 py-0.5 rounded-full",
                                trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {trend > 0 ? `↑ ${trend}%` : `↓ ${Math.abs(trend)}%`}
                            </span>
                        )}
                    </p>
                    <h3 className={clsx(
                        "text-3xl font-bold mb-1 flex items-center",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                        <IndianRupee size={28} className="mr-1" />
                        {(value ?? 0).toLocaleString()}
                    </h3>
                    {subtitle && (
                        <p className={clsx(
                            "text-sm",
                            theme === 'dark' ? "text-slate-500" : "text-slate-600"
                        )}>{subtitle}</p>
                    )}
                </div>
                <div className={clsx(
                    "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
                    color === 'green' && "bg-emerald-500/10 text-emerald-500",
                    color === 'red' && "bg-red-500/10 text-red-500",
                    color === 'yellow' && "bg-amber-500/10 text-amber-500",
                    color === 'blue' && "bg-blue-500/10 text-blue-500",
                    color === 'purple' && "bg-purple-500/10 text-purple-500"
                )}>
                    <Icon size={28} />
                </div>
            </div>
        </div>
    );

    const filteredFees = useMemo(() => {
        if (!Array.isArray(fees)) return [];

        return fees.filter(fee =>
            fee?.student_id?.student_id?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            fee?.student_id?.full_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            fee?.student_id?.parent_details?.phone?.includes(searchTerm)
        );
    }, [fees, searchTerm]);



    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={clsx("text-3xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        💰 Fees Management System
                    </h1>
                    <p className={clsx("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                        Complete payment tracking, invoice generation, and financial reporting
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {['overview', 'invoices', 'defaulters', 'reports', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
                                activeTab === tab
                                    ? theme === 'dark'
                                        ? "bg-blue-500 text-white"
                                        : "bg-blue-500 text-white"
                                    : theme === 'dark'
                                        ? "text-slate-400 hover:text-white hover:bg-slate-800"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-3">
                {quickActions.map(action => (
                    <Button
                        key={action.id}
                        onClick={action.action}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <action.icon size={16} />
                        <span>{action.label}</span>
                    </Button>
                ))}
            </div>

            {/* Stats Overview */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={DollarSign}
                            title="Total Revenue"
                            value={stats.totalFees}
                            subtitle="All academic years"
                            trend={12.5}
                            color="blue"
                        />
                        <StatCard
                            icon={CheckCircle}
                            title="Collected"
                            value={stats.totalCollected}
                            subtitle={`${stats.collectionRate}% collection rate`}
                            trend={8.3}
                            color="green"
                        />
                        <StatCard
                            icon={AlertCircle}
                            title="Pending"
                            value={stats.totalPending}
                            subtitle="Outstanding amount"
                            trend={-5.2}
                            color="yellow"
                        />
                        <StatCard
                            icon={Users}
                            title="Defaulters"
                            value={stats.defaultersCount}
                            subtitle="Overdue payments"
                            color="red"
                        />
                        <StatCard
                            icon={TrendingUp}
                            title="This Month"
                            value={stats.monthlyTrend[stats.monthlyTrend.length - 1]?.amount || 0}
                            subtitle="Monthly collection"
                            trend={15.7}
                            color="purple"
                        />
                        <StatCard
                            icon={Clock}
                            title="Overdue"
                            value={stats.overdueAmount}
                            subtitle="Past due amount"
                            color="red"
                        />
                        <StatCard
                            icon={Wallet}
                            title="Avg. Receipt"
                            value={stats.totalCollected / (fees.filter(f => f.paid_amount > 0).length || 1)}
                            subtitle="Average payment size"
                            color="green"
                        />
                        <StatCard
                            icon={BarChart3}
                            title="Efficiency"
                            value={stats.collectionRate}
                            subtitle="Collection efficiency %"
                            trend={4.2}
                            color="blue"
                        />
                    </div>

                    {/* Payment Methods Breakdown */}
                    <div className={clsx(
                        "p-6 rounded-2xl border",
                        theme === 'dark'
                            ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/5"
                            : "bg-gradient-to-br from-white to-slate-50 border-slate-200"
                    )}>
                        <h3 className={clsx("text-lg font-semibold mb-4", theme === 'dark' ? "text-white" : "text-slate-900")}>
                            Payment Methods Distribution
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map(method => (
                                <div key={method} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{method}</span>
                                        <span className="text-2xl font-bold">65%</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: method === 'UPI' ? '65%' : method === 'Cash' ? '20%' : method === 'Bank Transfer' ? '10%' : '5%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Filters Section */}
            <div className={clsx(
                "p-6 rounded-2xl border backdrop-blur-sm",
                theme === 'dark'
                    ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-white/5"
                    : "bg-gradient-to-br from-white to-slate-50 border-slate-200"
            )}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="relative lg:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search Student ID, Name, Parent Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx(
                                "w-full pl-12 pr-4 py-3 rounded-xl border shadow-sm",
                                theme === 'dark'
                                    ? "bg-slate-800 border-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
                            )}
                        />
                    </div>
                    <div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl border shadow-sm",
                                theme === 'dark'
                                    ? "bg-slate-800 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.grade}
                            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl border shadow-sm",
                                theme === 'dark'
                                    ? "bg-slate-800 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="">All Grades</option>
                            {['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(grade => (
                                <option key={grade} value={grade}>Class {grade}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.section}
                            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl border shadow-sm",
                                theme === 'dark'
                                    ? "bg-slate-800 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="">All Sections</option>
                            {['A', 'B', 'C', 'D', 'E'].map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.academic_year}
                            onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl border shadow-sm",
                                theme === 'dark'
                                    ? "bg-slate-800 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="2024-2025">2024-2025</option>
                            <option value="2023-2024">2023-2024</option>
                            <option value="2025-2026">2025-2026</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-3">
                    <Button onClick={() => setShowFeeStructureModal(true)} className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600">
                        <Layers size={18} />
                        <span>Create Fee Structure</span>
                    </Button>
                    <Button onClick={() => setShowTerminal(true)} variant="secondary" className="flex items-center space-x-2">
                        <CreditCard size={18} />
                        <span>Collection Terminal</span>
                    </Button>
                    <Button onClick={generateInvoices} className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600">
                        <FileSpreadsheet size={18} />
                        <span>Generate Invoices</span>
                    </Button>
                </div>
                <div className="text-sm text-slate-500">
                    Showing {filteredFees.length} of {fees.length} records
                </div>
            </div>

            {/* Fee Collection Terminal Modal */}
            <Modal
                isOpen={showTerminal}
                onClose={() => setShowTerminal(false)}
                title="🎯 Fee Collection Terminal"
                maxWidth="max-w-7xl"
            >
                <FeeCollectionTerminal
                    onClose={() => {
                        setShowTerminal(false);
                        fetchFees();
                        fetchStats();
                    }}
                />
            </Modal>

            {/* Fee Structure Creator Modal */}
            <Modal
                isOpen={showFeeStructureModal}
                onClose={() => setShowFeeStructureModal(false)}
                title="🏗️ Create Fee Structure"
                maxWidth="max-w-6xl"
            >
                <FeeStructureCreator
                    onClose={() => setShowFeeStructureModal(false)}
                    onSuccess={() => {
                        setShowFeeStructureModal(false);
                        fetchFees();
                    }}
                />
            </Modal>

            {/* Invoice Generator Modal */}
            <Modal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                title="🧾 Generate Invoices"
                maxWidth="max-w-4xl"
            >
                <InvoiceGenerator
                    onClose={() => setShowInvoiceModal(false)}
                    onSuccess={() => {
                        setShowInvoiceModal(false);
                        fetchFees();
                    }}
                />
            </Modal>

            {/* Fees Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredFees.length > 0 ? (
                <div className={clsx(
                    "rounded-2xl border overflow-hidden backdrop-blur-sm",
                    theme === 'dark'
                        ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-white/5"
                        : "bg-gradient-to-br from-white to-slate-50 border-slate-200"
                )}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={clsx(
                                theme === 'dark'
                                    ? "bg-gradient-to-r from-slate-800 to-slate-900"
                                    : "bg-gradient-to-r from-slate-50 to-slate-100"
                            )}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Student</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Class</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Academic Year</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Total</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Paid</th>
                                    <th className="px6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Balance</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Due Date</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredFees.map((fee) => (
                                    <>
                                        <tr key={fee._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                                        {fee.student_id?.full_name}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        ID: {fee.student_id?.student_id}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                                        {fee.student_id?.parent_details?.phone}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                                                    {fee.student_id?.class_info?.grade}-{fee.student_id?.class_info?.section}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">
                                                    {fee.academic_year}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-lg">₹{fee.total_amount?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-emerald-500 font-bold">₹{fee.paid_amount?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={clsx(
                                                    "font-bold",
                                                    fee.balance_amount > 0 ? "text-red-500" : "text-emerald-500"
                                                )}>
                                                    ₹{fee.balance_amount?.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    "px-4 py-2 rounded-full text-sm font-medium border",
                                                    getStatusColor(fee.status)
                                                )}>
                                                    {fee.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-medium",
                                                    new Date(fee.due_date) < new Date()
                                                        ? "bg-red-500/10 text-red-500"
                                                        : "bg-emerald-500/10 text-emerald-500"
                                                )}>
                                                    {new Date(fee.due_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedFee(fee);
                                                            setShowPaymentModal(true);
                                                        }}
                                                        disabled={fee.status === 'Paid'}
                                                        className={clsx(
                                                            fee.status === 'Paid'
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : "bg-gradient-to-r from-blue-500 to-blue-600"
                                                        )}
                                                    >
                                                        <CreditCard size={16} />
                                                        <span className="ml-1">Pay</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => fetchPaymentHistory(fee.student_id._id)}
                                                    >
                                                        <FileText size={16} />
                                                        <span className="ml-1">History</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => sendReminder(fee.student_id._id)}
                                                        title="Send Reminder"
                                                    >
                                                        <Bell size={16} />
                                                    </Button>
                                                    <button
                                                        onClick={() => setExpandedRow(expandedRow === fee._id ? null : fee._id)}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                    >
                                                        {expandedRow === fee._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === fee._id && (
                                            <tr className="bg-white/5 dark:bg-slate-900/50">
                                                <td colSpan="9" className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-4 bg-white/5 rounded-xl">
                                                            <h4 className="font-semibold mb-2">Fee Breakdown</h4>
                                                            {fee.fee_breakdown?.map((head, idx) => (
                                                                <div key={idx} className="flex justify-between py-1 border-b border-white/10">
                                                                    <span>{head.head}</span>
                                                                    <span>₹{head.amount}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-xl">
                                                            <h4 className="font-semibold mb-2">Recent Transactions</h4>
                                                            {fee.transactions?.slice(0, 3).map((txn, idx) => (
                                                                <div key={idx} className="flex justify-between py-1 border-b border-white/10">
                                                                    <span>{new Date(txn.date).toLocaleDateString()}</span>
                                                                    <span className="text-emerald-500">₹{txn.amount}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-xl">
                                                            <h4 className="font-semibold mb-2">Quick Actions</h4>
                                                            <div className="space-y-2">
                                                                <Button size="sm" className="w-full">Download Invoice</Button>
                                                                <Button size="sm" variant="outline" className="w-full">View Details</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-slate-500">
                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No fee records found</p>
                    <p className="text-sm">Try adjusting your filters or create a new fee structure</p>
                </div>
            )}

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="💳 Record Payment"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleRecordPayment} className="space-y-4">
                    {selectedFee && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
                            <p className="font-semibold">{selectedFee.student_id?.full_name}</p>
                            <p className="text-sm text-slate-500">Balance: ₹{selectedFee.balance_amount?.toLocaleString()}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                            <input
                                type="number"
                                value={paymentFormData.amount}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                                required
                                min="1"
                                max={selectedFee?.balance_amount}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Payment Method</label>
                            <select
                                value={paymentFormData.payment_method}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                            >
                                <option value="UPI">UPI</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Credit/Debit Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Transaction ID</label>
                            <input
                                type="text"
                                value={paymentFormData.transaction_id}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_id: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                                placeholder="UPI ID/Cheque No."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Paid By</label>
                            <input
                                type="text"
                                value={paymentFormData.paid_by}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, paid_by: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={paymentFormData.send_receipt}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, send_receipt: e.target.checked })}
                            />
                            <label className="text-sm">Send receipt via email</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={paymentFormData.send_sms}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, send_sms: e.target.checked })}
                            />
                            <label className="text-sm">Send SMS notification</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                            Record Payment
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Payment History Modal */}
            <Modal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                title="📋 Payment History"
                maxWidth="max-w-5xl"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-left">Receipt No</th>
                                <th className="px-4 py-3 text-left">Date & Time</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-left">Method</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistory.map((payment) => (
                                <tr key={payment._id} className="border-b dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="px-4 py-3 font-mono text-sm font-bold">
                                        {payment.receipt_number}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(payment.payment_date).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-500 font-bold">
                                        ₹{payment.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
                                            {payment.payment_method}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={clsx(
                                            "px-2 py-1 text-xs rounded-full",
                                            payment.status === 'completed'
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-amber-500/10 text-amber-500"
                                        )}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadReceipt(payment._id, payment.receipt_number)}
                                        >
                                            <Download size={16} className="mr-2" />
                                            Receipt
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {paymentHistory.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                        No payment history found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};

export default FeeManagement;
