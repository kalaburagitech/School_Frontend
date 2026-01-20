import { useState, useEffect } from 'react';
import { Search, Camera, Upload, CheckCircle, Printer, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import Button from '../ui/Button';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const FeeCollectionTerminal = ({ onClose }) => {
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [student, setStudent] = useState(null);
    const [fees, setFees] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentFile, setPaymentFile] = useState(null);
    const [selectedHead, setSelectedHead] = useState('General'); // 'General' or specific head
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Search by Student ID or Name (Assuming API supports it)
            // Logic: Get Student -> Get Fees
            const { data: students } = await api.get(`/students?search=${searchTerm}`);
            if (students.length > 0) {
                const foundStudent = students[0];
                setStudent(foundStudent);

                // Fetch Fees for this student
                const { data: feeData } = await api.get(`/fees/student/${foundStudent._id}`);
                // Select the active academic year fee
                const currentFee = feeData.find(f => f.status !== 'Paid') || feeData[0];
                setFees(currentFee);
            } else {
                alert('Student not found');
                setStudent(null);
                setFees(null);
            }
        } catch (error) {
            console.error(error);
            alert('Error fetching details');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!amount || !fees) return;

        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('paymentMethod', paymentMethod);
        formData.append('remarks', remark);
        if (selectedHead !== 'General') {
            formData.append('paymentHead', selectedHead);
        }
        if (paymentFile) {
            formData.append('proof', paymentFile);
        }

        try {
            await api.post(`/fees/${fees._id}/payment`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Payment Recorded Successfully!');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Payment Failed: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Enter Name, ID or Aadhaar (Last 4)..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border dark:bg-slate-900 border-slate-200 dark:border-white/10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </form>
            </div>

            {student && fees ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Left: Ledger / Details */}
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                {student.photo ? (
                                    <img src={student.photo} alt={student.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl font-bold">
                                        {student.full_name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{student.full_name}</h3>
                                <p className="text-slate-500">{student.student_id} | Class {student.class_info?.grade}-{student.class_info?.section}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Head</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-right">Paid</th>
                                        <th className="px-4 py-3 text-right">Due</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {(fees.fee_breakdown || []).map((head, idx) => (
                                        <tr key={idx} onClick={() => { setSelectedHead(head.head); setAmount(head.total_amount - head.paid_amount); }} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium">{head.head}</td>
                                            <td className="px-4 py-3 text-right">₹{head.total_amount}</td>
                                            <td className="px-4 py-3 text-right text-green-600">₹{head.paid_amount}</td>
                                            <td className="px-4 py-3 text-right text-red-500 font-bold">
                                                ₹{head.total_amount - head.paid_amount}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-xs font-bold",
                                                    head.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {head.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 dark:bg-slate-800 font-bold">
                                        <td className="px-4 py-3">TOTAL</td>
                                        <td className="px-4 py-3 text-right">₹{fees.total_amount}</td>
                                        <td className="px-4 py-3 text-right text-green-600">₹{fees.paid_amount}</td>
                                        <td className="px-4 py-3 text-right text-red-600">₹{fees.balance_amount}</td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Payment Action */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-white/5 h-fit">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-emerald-500" />
                            Record Collection
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Paying For</label>
                                <select
                                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900"
                                    value={selectedHead}
                                    onChange={e => setSelectedHead(e.target.value)}
                                >
                                    <option value="General">General / Lump Sum</option>
                                    {(fees.fee_breakdown || []).map(h => <option key={h.head} value={h.head}>{h.head} (Due: ₹{h.total_amount - h.paid_amount})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 font-bold text-lg"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Method</label>
                                    <select
                                        className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900"
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                    >
                                        <option>Cash</option>
                                        <option>UPI</option>
                                        <option>Bank Transfer</option>
                                        <option>Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Proof (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="proofUpload"
                                            onChange={e => setPaymentFile(e.target.files[0])}
                                        />
                                        <label htmlFor="proofUpload" className="w-full flex items-center justify-center p-2 rounded-lg border border-dashed bg-white dark:bg-slate-900 cursor-pointer text-sm gap-2 hover:bg-slate-50">
                                            <Camera size={16} />
                                            {paymentFile ? 'File Selected' : 'Upload'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Remarks</label>
                                <input
                                    type="text"
                                    placeholder="Transaction ID / Check No."
                                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 text-sm"
                                    value={remark}
                                    onChange={e => setRemark(e.target.value)}
                                />
                            </div>

                            <Button onClick={handlePayment} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle size={18} className="mr-2" />
                                Confirm & Print Receipt
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Printer size={64} className="mb-4" />
                    <p>Search for a student to begin collection</p>
                </div>
            )}
        </div>
    );
};

export default FeeCollectionTerminal;
