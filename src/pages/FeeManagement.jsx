import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Plus, Search, DollarSign, Download, AlertCircle, CheckCircle,
    CreditCard, FileText, TrendingUp, Users, Calendar, Filter
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FeeCollectionTerminal from '../components/fees/FeeCollectionTerminal';

const FeeManagement = () => {
    const { theme } = useTheme();
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);

    // ADD THESE MISSING STATE DECLARATIONS
    const [feeFormData, setFeeFormData] = useState({
        student_id: '',
        academic_year: '2025-2026',
        fee_structure: {
            academic_fee: '',
            bus_fee: '',
            books_fee: '',
            exam_fee: '',
            activities_fee: '',
            other_fees: []
        },
        due_date: ''
    });

    const [paymentFormData, setPaymentFormData] = useState({
        amount: '',
        payment_method: 'Cash',
        transaction_id: '',
        paid_by: '',
        remarks: ''
    });

    useEffect(() => {
        fetchFees();
    }, [statusFilter, gradeFilter, sectionFilter]);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (gradeFilter) params.append('grade', gradeFilter);
            if (sectionFilter) params.append('section', sectionFilter);

            const response = await api.get(`/fees?${params}`);
            setFees(response.data);
        } catch (error) {
            console.error('Failed to fetch fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async (studentId) => {
        try {
            const response = await api.get(`/fees/payments/${studentId}`);
            setPaymentHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Failed to fetch history:', error);
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
            alert('Failed to download receipt');
        }
    };

    const handleCreateFee = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fees', feeFormData);
            setShowFeeModal(false);
            fetchFees();
            resetFeeForm();
        } catch (error) {
            console.error('Failed to create fee:', error);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/fees/${selectedFee._id}/payment`, paymentFormData);
            setShowPaymentModal(false);
            fetchFees();
            resetPaymentForm();
        } catch (error) {
            console.error('Failed to record payment:', error);
        }
    };

    const resetFeeForm = () => {
        setFeeFormData({
            student_id: '',
            academic_year: '2025-2026',
            fee_structure: {
                academic_fee: '',
                bus_fee: '',
                books_fee: '',
                exam_fee: '',
                activities_fee: '',
                other_fees: []
            },
            due_date: ''
        });
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: '',
            payment_method: 'Cash',
            transaction_id: '',
            paid_by: '',
            remarks: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-500/10 text-green-500';
            case 'Partial': return 'bg-yellow-500/10 text-yellow-500';
            case 'Pending': return 'bg-blue-500/10 text-blue-500';
            case 'Overdue': return 'bg-red-500/10 text-red-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
        <div className={clsx(
            "p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg",
            theme === 'dark'
                ? "bg-slate-800/50 border-white/5 hover:bg-slate-800/70"
                : "bg-white border-slate-200 hover:shadow-xl"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className={clsx(
                        "text-sm font-medium mb-1",
                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                    )}>
                        {title}
                    </p>
                    <h3 className={clsx(
                        "text-3xl font-bold mb-1",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                        {value}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-slate-500">{subtitle}</p>
                    )}
                </div>
                <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    color === 'green' && "bg-green-500/10 text-green-500",
                    color === 'red' && "bg-red-500/10 text-red-500",
                    color === 'yellow' && "bg-yellow-500/10 text-yellow-500",
                    color === 'blue' && "bg-blue-500/10 text-blue-500"
                )}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    const filteredFees = fees.filter(fee =>
        fee.student_id?.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalFees = fees.reduce((sum, fee) => sum + (fee.total_amount || 0), 0);
    const totalCollected = fees.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0);
    const totalPending = fees.reduce((sum, fee) => sum + (fee.balance_amount || 0), 0);
    const defaultersCount = fees.filter(fee => fee.status === 'Overdue').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={clsx("text-3xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        Fees Management
                    </h1>
                    <p className={clsx("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                        Track fees, payments, and generate invoices
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setShowTerminal(true)} variant="secondary" className="flex items-center space-x-2">
                        <CreditCard size={18} />
                        <span>Collection Terminal</span>
                    </Button>
                    <Button onClick={() => setShowFeeModal(true)} className="flex items-center space-x-2">
                        <Plus size={18} />
                        <span>Create Fee Structure</span>
                    </Button>
                </div>
            </div>

            {/* Fee Collection Terminal Modal */}
            <Modal
                isOpen={showTerminal}
                onClose={() => setShowTerminal(false)}
                title="Fee Collection Terminal"
                maxWidth="max-w-6xl"
            >
                <FeeCollectionTerminal onClose={() => { setShowTerminal(false); fetchFees(); }} />
            </Modal>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={DollarSign} title="Total Fees" value={`₹${totalFees.toLocaleString()}`} subtitle="All students" color="blue" />
                <StatCard icon={CheckCircle} title="Collected" value={`₹${totalCollected.toLocaleString()}`} subtitle={`${((totalCollected / totalFees) * 100 || 0).toFixed(1)}% collected`} color="green" />
                <StatCard icon={AlertCircle} title="Pending" value={`₹${totalPending.toLocaleString()}`} subtitle={`${((totalPending / totalFees) * 100 || 0).toFixed(1)}% pending`} color="yellow" />
                <StatCard icon={Users} title="Defaulters" value={defaultersCount} subtitle="Overdue payments" color="red" />
            </div>

            {/* Filters */}
            <div className={clsx("p-6 rounded-2xl border", theme === 'dark' ? "bg-slate-800/50 border-white/5" : "bg-white border-slate-200")}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search Student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx("w-full pl-12 pr-4 py-2.5 rounded-xl border", theme === 'dark' ? "bg-slate-700 border-white/10 text-white" : "bg-white border-slate-300")}
                        />
                    </div>
                    <div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={clsx("w-full px-4 py-2.5 rounded-xl border", theme === 'dark' ? "bg-slate-700 border-white/10 text-white" : "bg-white border-slate-300")}>
                            <option value="">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                    <div>
                        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={clsx("w-full px-4 py-2.5 rounded-xl border", theme === 'dark' ? "bg-slate-700 border-white/10 text-white" : "bg-white border-slate-300")}>
                            <option value="">All Grades</option>
                            {[...Array(12)].map((_, i) => <option key={i} value={`${i + 1}`}>Class {i + 1}</option>)}
                        </select>
                    </div>
                    <div>
                        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className={clsx("w-full px-4 py-2.5 rounded-xl border", theme === 'dark' ? "bg-slate-700 border-white/10 text-white" : "bg-white border-slate-300")}>
                            <option value="">All Sections</option>
                            {['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : filteredFees.length > 0 ? (
                <div className={clsx("rounded-2xl border overflow-hidden", theme === 'dark' ? "bg-slate-800/50 border-white/5" : "bg-white border-slate-200")}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={clsx(theme === 'dark' ? "bg-slate-700/50" : "bg-slate-50")}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Class</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold">Total</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold">Paid</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold">Balance</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredFees.map((fee) => (
                                    <tr key={fee._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium">{fee.student_id?.full_name}</p>
                                                <p className="text-sm text-slate-500">{fee.student_id?.student_id}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{fee.student_id?.class_info?.grade}-{fee.student_id?.class_info?.section}</td>
                                        <td className="px-6 py-4 text-right">₹{fee.total_amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-green-500">₹{fee.paid_amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-red-500">₹{fee.balance_amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={clsx("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(fee.status))}>{fee.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Button size="sm" onClick={() => { setSelectedFee(fee); setShowPaymentModal(true); }} disabled={fee.status === 'Paid'}>
                                                    <CreditCard size={16} />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => fetchPaymentHistory(fee.student_id._id)}>
                                                    <FileText size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">No fee records found</div>
            )}

            {/* Create Fee Modal */}
            <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="Create Fee Structure">
                <form onSubmit={handleCreateFee} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Student ID</label>
                            <input
                                type="text"
                                value={feeFormData.student_id}
                                onChange={(e) => setFeeFormData({ ...feeFormData, student_id: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Academic Fee</label>
                            <input
                                type="number"
                                value={feeFormData.fee_structure.academic_fee}
                                onChange={(e) => setFeeFormData({
                                    ...feeFormData,
                                    fee_structure: { ...feeFormData.fee_structure, academic_fee: e.target.value }
                                })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Bus Fee</label>
                            <input
                                type="number"
                                value={feeFormData.fee_structure.bus_fee}
                                onChange={(e) => setFeeFormData({
                                    ...feeFormData,
                                    fee_structure: { ...feeFormData.fee_structure, bus_fee: e.target.value }
                                })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Due Date</label>
                            <input
                                type="date"
                                value={feeFormData.due_date}
                                onChange={(e) => setFeeFormData({ ...feeFormData, due_date: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-4">Create Fee Structure</Button>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
                <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Amount</label>
                        <input
                            type="number"
                            value={paymentFormData.amount}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border bg-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Payment Method</label>
                        <select
                            value={paymentFormData.payment_method}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border bg-transparent"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Transaction ID (Optional)</label>
                        <input
                            type="text"
                            value={paymentFormData.transaction_id}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_id: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border bg-transparent"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button type="submit">Record Payment</Button>
                    </div>
                </form>
            </Modal>

            {/* Payment History Modal */}
            <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Payment History" maxWidth="max-w-4xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-2 text-left">Receipt No</th>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2 text-left">Mode</th>
                                <th className="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistory.map((payment) => (
                                <tr key={payment._id} className="border-b dark:border-white/5">
                                    <td className="px-4 py-2 font-mono text-sm">{payment.receipt_number}</td>
                                    <td className="px-4 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-right">₹{payment.amount.toLocaleString()}</td>
                                    <td className="px-4 py-2">{payment.payment_method}</td>
                                    <td className="px-4 py-2 text-center">
                                        <Button size="sm" variant="ghost" onClick={() => handleDownloadReceipt(payment._id, payment.receipt_number)}>
                                            <Download size={16} className="mr-2" /> Receipt
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {paymentHistory.length === 0 && (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No payment history found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};

export default FeeManagement;