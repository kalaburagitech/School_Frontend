import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Users, Plus, Search, Filter, Phone, Mail, Shield, CheckCircle, MoreVertical,
    FileText, DollarSign, Calendar, Download, Eye, Ban, AlertCircle, Clock, Save, X,
    Briefcase, Pencil, Trash2, GraduationCap, Truck
} from 'lucide-react';
import Button from '../components/ui/Button';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/ui/Skeleton';
import TeacherForm from '../components/TeacherForm';
import StaffForm from '../components/StaffForm';
import { useToast } from '../context/ToastContext';


const EmployeeManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('directory'); // directory, leaves, payroll, payslips
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewAction, setViewAction] = useState(null); // ID of row with open action menu

    // Modals
    const { showToast } = useToast();
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [payrollList, setPayrollList] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('January 2026');

    // Access Control
    const canManage = ['admin', 'owner', 'principal'].includes(user?.role);

    // --- Fetch Data ---

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const [teachersRes, driversRes, usersRes] = await Promise.all([
                api.get('/teachers'),
                api.get('/drivers'),
                api.get('/users?role=admin,owner,principal,staff')
            ]);

            const normalize = (data, type, roleLabel) => data.map(item => {
                // For user-linked profiles, extract designation from profile
                const designation = item.designation || item.profile_id?.designation || roleLabel;
                const actualRole = item.role ? (item.role.charAt(0).toUpperCase() + item.role.slice(1)) : roleLabel;

                return {
                    _id: item._id,
                    id_code: item.teacher_id || item.staff_id || item.driver_id || item.profile_id?.staff_id || 'SYS',
                    name: item.full_name || item.profile_id?.full_name || 'User',
                    role: type === 'staff' ? actualRole : roleLabel, // For staff, use their actual role (Admin/Owner/etc)
                    designation: designation, // Store designation separately
                    contact: item.phone || item.profile_id?.phone || '-',
                    email: item.email || '-',
                    aadhaar: item.aadhaar_number || item.profile_id?.aadhaar_number || '-',
                    photo: item.photo_url || item.profile_id?.photo_url,
                    dob: item.dob || item.profile_id?.dob,
                    blood_group: item.blood_group || item.profile_id?.blood_group,
                    qualification: item.qualification || item.profile_id?.qualification,
                    subjects: item.subjects || item.subjects_expertise || [],
                    transport: item.transport || item.profile_id?.transport,
                    type: type,
                    verified: !!(item.aadhaar_number || item.profile_id?.aadhaar_number),
                    original: item
                };
            });

            let allEmps = [
                ...normalize(teachersRes.data, 'teacher', 'Teacher'),
                ...normalize(driversRes.data, 'driver', 'Driver'),
                ...normalize(usersRes.data.users || usersRes.data, 'staff', null) // null so it uses actual role
            ];

            // RBAC Filtering for Directory: Non-admins can SEE everyone (names/roles), but sensitive columns are hidden in render.
            // if (!canManage) {
            //    allEmps = allEmps.filter(e => ...); 
            // }
            // COMMENTED OUT to allow visibility. Columns are already protected.

            setEmployees(allEmps);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/communications?type=LEAVE');
            setLeaves(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPayroll = async () => {
        try {
            const { data } = await api.get(`/payroll?month=${selectedMonth}&year=2026`);

            // RBAC Filtering for Payroll
            let list = data;
            if (!canManage) {
                list = list.filter(p => p.employeeName === user.profile_id?.full_name || p.employeeId === user.profile_id?.staff_id); // Basic name/id match
            }
            setPayrollList(list);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (activeTab === 'directory') fetchEmployees();
        if (activeTab === 'leaves') fetchLeaves();
        if (activeTab === 'payroll' || activeTab === 'payslips') fetchPayroll();
    }, [activeTab, selectedMonth, user]);

    // Improved filtering logic
    const filteredEmployees = employees.filter(emp => {
        // Filter by role
        const matchesRole = filterRole === 'all' || emp.type === filterRole;

        // Enhanced search: name, ID, email, phone
        const search = searchQuery.toLowerCase();
        const matchesSearch = !search ||
            emp.name?.toLowerCase().includes(search) ||
            emp.id_code?.toLowerCase().includes(search) ||
            emp.email?.toLowerCase().includes(search) ||
            emp.contact?.toLowerCase().includes(search);

        return matchesRole && matchesSearch;
    });

    const handleDeleteEmployee = async (emp) => {
        if (!window.confirm(`Are you sure you want to remove ${emp.name}?`)) return;
        try {
            let endpoint = '';
            if (emp.type === 'teacher') endpoint = `/teachers/${emp._id}`;
            else if (emp.type === 'driver') endpoint = `/drivers/${emp._id}`;
            else endpoint = `/users/${emp.original?.user_id || emp._id}`;

            await api.delete(endpoint);
            showToast('Employee Removed', 'success', `${emp.name} has been soft-deleted.`);
            fetchEmployees();
        } catch (error) {
            console.error(error);
            showToast('Delete Failed', 'error', 'Could not remove employee.');
        }
    };

    const handleUpdateEmployee = async (data) => {
        try {
            setIsSubmitting(true);
            let endpoint = '';
            if (editingEmployee.type === 'teacher') endpoint = `/teachers/${editingEmployee._id}`;
            else if (editingEmployee.type === 'driver') endpoint = `/drivers/${editingEmployee._id}`;
            else endpoint = `/users/${editingEmployee.original?.user_id || editingEmployee._id}`;

            await api.put(endpoint, data);
            showToast('Profile Updated', 'success', `Changes to ${data.full_name} saved.`);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error) {
            console.error(error);
            showToast('Update Failed', 'error', 'Could not save changes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayrollChange = (index, field, value) => {
        const updated = [...payrollList];
        updated[index][field] = Number(value);
        updated[index].netSalary = updated[index].baseSalary - updated[index].deductions;
        setPayrollList(updated);
    };

    const savePayrollRow = async (p) => {
        try {
            await api.post('/payroll', {
                employeeId: p.employeeId,
                employeeName: p.employeeName,
                role: p.role,
                month: selectedMonth,
                year: 2026,
                baseSalary: p.baseSalary,
                deductions: p.deductions,
                status: p.status
            });
            alert('Payroll saved!');
        } catch (error) {
            alert('Save failed');
        }
    };

    const markAsPaid = async (p) => {
        try {
            await api.post('/payroll', { ...p, month: selectedMonth, year: 2026, status: 'Paid' });
            fetchPayroll();
        } catch (error) {
            console.error(error);
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        try {
            await api.put(`/communications/${leaveId}/status`, { status });
            fetchLeaves();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Tabs ---

    const DirectoryTab = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Directory..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        {['all', 'teacher', 'driver', 'staff'].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                                    filterRole === role ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role & ID</th>
                            {canManage && <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>}
                            {canManage && <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date of Birth</th>}
                            {canManage && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton variant="circle" className="w-10 h-10" />
                                            <div className="space-y-2">
                                                <Skeleton className="w-32 h-4" />
                                                <Skeleton className="w-24 h-3" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <Skeleton className="w-20 h-4" />
                                            <Skeleton className="w-16 h-3" />
                                        </div>
                                    </td>
                                    {canManage && (
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <Skeleton className="w-24 h-3" />
                                                <Skeleton className="w-32 h-3" />
                                            </div>
                                        </td>
                                    )}
                                    {canManage && <td className="px-6 py-4"><Skeleton className="w-16 h-5" /></td>}
                                    {canManage && <td className="px-6 py-4 text-right"><Skeleton className="w-8 h-8 ml-auto" /></td>}
                                </tr>
                            ))
                        ) : filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Users size={48} className="opacity-20" />
                                        <p className="font-bold">No employees found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredEmployees.map(emp => (
                            <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {emp.photo ? (
                                            <img src={emp.photo} alt={emp.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm" />
                                        ) : (
                                            <div className={clsx("w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm",
                                                emp.type === 'teacher' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : emp.type === 'driver' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600')}>
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                                {emp.name}
                                                {emp.verified && canManage && <CheckCircle size={13} className="text-blue-500 flex-shrink-0" />}
                                            </div>
                                            {canManage && <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight mt-0.5">{emp.aadhaar}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wide">{emp.role}</span>
                                        {canManage && <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider opacity-60">{emp.id_code}</span>}
                                    </div>
                                </td>
                                {canManage && (
                                    <td className="px-6 py-4">
                                        <div className="text-sm space-y-1.5">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                                <Phone size={13} className="flex-shrink-0" />
                                                <span className="truncate">{emp.contact}</span>
                                            </div>
                                            {emp.email !== '-' && (
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-xs">
                                                    <Mail size={13} className="flex-shrink-0" />
                                                    <span className="truncate max-w-[180px]">{emp.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                )}
                                {canManage && (
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </div>
                                    </td>
                                )}
                                {canManage && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setViewingEmployee(emp); }}
                                                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingEmployee(emp); }}
                                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                                                title="Edit Profile"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp); }}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
                                                title="Delete Employee"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const LeaveTab = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
                {leaves.length === 0 ? <div className="p-12 text-center text-slate-400">No pending leave requests.</div> : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Applicant</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                {canManage && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {leaves.map(leave => (
                                <tr key={leave._id}>
                                    <td className="px-6 py-4 font-bold">{leave.createdBy}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(leave.content.startDate).toLocaleDateString()} - {new Date(leave.content.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{leave.content.description}</td>
                                    <td className="px-6 py-4">
                                        <span className={clsx("px-2 py-1 text-xs rounded font-bold",
                                            leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    {canManage && leave.status === 'Pending' && (
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleLeaveAction(leave._id, 'Approved')}>Approve</Button>
                                            <Button size="sm" className="bg-red-100 text-red-600 hover:bg-red-200" onClick={() => handleLeaveAction(leave._id, 'Rejected')}>Reject</Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const PayrollTab = () => (
        <div className="space-y-6 animate-in fade-in">
            {canManage && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-emerald-600 font-bold mb-1">Total Payload</p>
                        <h3 className="text-2xl font-bold text-emerald-900">
                            ₹ {payrollList.reduce((acc, curr) => acc + (curr.netSalary || 0), 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-blue-600 font-bold mb-1">Employees Paid</p>
                        <h3 className="text-2xl font-bold text-blue-900">
                            {payrollList.filter(p => p.status === 'Paid').length} / {payrollList.length}
                        </h3>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><DollarSign size={18} /> Salary Disbursement - {selectedMonth}</h3>
                    <Button onClick={() => fetchPayroll()}>Refresh List</Button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Base Salary</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Deductions</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Final Pay</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                            {canManage && <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {payrollList.map((p, index) => (
                            <tr key={`${p.employeeId}-${index}`}>
                                <td className="px-6 py-4 font-bold">
                                    {p.employeeName}
                                    <div className="text-xs font-normal text-slate-400">{p.role}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {canManage ? (
                                        <input
                                            type="number"
                                            className="w-24 px-2 py-1 border rounded bg-slate-50"
                                            value={p.baseSalary}
                                            onChange={(e) => handlePayrollChange(index, 'baseSalary', e.target.value)}
                                            placeholder="0"
                                        />
                                    ) : <span>₹ {p.baseSalary?.toLocaleString()}</span>}
                                </td>
                                <td className="px-6 py-4">
                                    {canManage ? (
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 border rounded bg-red-50 text-red-600"
                                            value={p.deductions}
                                            onChange={(e) => handlePayrollChange(index, 'deductions', e.target.value)}
                                            placeholder="0"
                                        />
                                    ) : <span className="text-red-500">- ₹ {p.deductions?.toLocaleString()}</span>}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                    ₹ {(p.netSalary || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={clsx("px-2 py-1 text-xs rounded font-bold", p.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                                        {p.status}
                                    </span>
                                </td>
                                {canManage && (
                                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                        <button
                                            onClick={() => savePayrollRow(p)}
                                            className="px-3 py-1 text-xs font-bold bg-slate-100 rounded hover:bg-slate-200"
                                        >
                                            Save
                                        </button>
                                        {p.status === 'Pending' && (
                                            <button
                                                onClick={() => markAsPaid(p)}
                                                className="px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const PayslipsTab = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Month</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Net Pay</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Download</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {payrollList.filter(p => p.status === 'Paid').map(p => (
                            <tr key={p.employeeId}>
                                <td className="px-6 py-4 font-bold">{p.employeeName}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{p.month}, {p.year}</td>
                                <td className="px-6 py-4 font-bold">₹ {p.netSalary?.toLocaleString()}</td>
                                <td className="px-6 py-4"><span className="text-green-600 font-bold text-xs uppercase">Generated</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => alert(`Downloading Payslip for ${p.employeeName}... (Feature in progress)`)}
                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm ml-auto"
                                    >
                                        <Download size={16} /> Download PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {payrollList.filter(p => p.status === 'Paid').length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-400">No payslips generated yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12" onClick={() => setViewAction(null)}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employee Management</h1>
                    <p className="text-slate-500">Unified command center for workforce and payroll.</p>
                </div>
                {canManage && (
                    <Button onClick={() => navigate('/employees/new')} className="shadow-xl shadow-indigo-600/20">
                        <Plus size={18} className="mr-2" />
                        Onboard Employee
                    </Button>
                )}
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto">
                {[
                    { id: 'directory', label: 'Directory', icon: Users },
                    { id: 'leaves', label: 'Leave Management', icon: Calendar, restricted: true },
                    { id: 'payroll', label: 'Payroll & Salary', icon: DollarSign, restricted: true },
                    { id: 'payslips', label: 'Payslips', icon: FileText, restricted: true },
                ].filter(tab => !tab.restricted || ['admin', 'owner', 'principal', 'staff', 'teacher', 'driver'].includes(user?.role)).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap",
                            activeTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'directory' && <DirectoryTab />}
                {activeTab === 'leaves' && <LeaveTab />}
                {activeTab === 'payroll' && <PayrollTab />}
                {activeTab === 'payslips' && <PayslipsTab />}
            </div>

            {/* View Modal */}
            {viewingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                        <div className="relative h-40 bg-gradient-to-r from-indigo-600 to-blue-600">
                            <button onClick={() => setViewingEmployee(null)} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all">
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                                {viewingEmployee.photo ? (
                                    <div className="w-32 h-32 rounded-3xl overflow-hidden ring-8 ring-white dark:ring-slate-900 shadow-xl">
                                        <img src={viewingEmployee.photo} alt={viewingEmployee.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={clsx(
                                        "w-32 h-32 rounded-3xl flex items-center justify-center text-4xl font-black text-white ring-8 ring-white dark:ring-slate-900 shadow-xl",
                                        viewingEmployee.type === 'teacher' ? 'bg-indigo-500' : 'bg-emerald-500'
                                    )}>
                                        {viewingEmployee.name.charAt(0)}
                                    </div>
                                )}
                                <div className="mb-2">
                                    <h2 className="text-2xl font-black text-white drop-shadow-sm">{viewingEmployee.name}</h2>
                                    <p className="text-white/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        <Briefcase size={12} /> {viewingEmployee.role} • {viewingEmployee.id_code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 px-8 pb-10 overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                            <Shield size={10} /> Identification
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center"><Phone size={14} /></div>
                                                <div className="text-sm font-bold">{viewingEmployee.contact}</div>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center"><Mail size={14} /></div>
                                                <div className="text-sm font-bold truncate max-w-[180px]">{viewingEmployee.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center font-black text-[10px]">A</div>
                                                <div className="text-sm font-bold">{viewingEmployee.aadhaar}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                            <GraduationCap size={10} /> Qualification & Skills
                                        </p>
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{viewingEmployee.qualification || 'Not Specified'}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingEmployee.subjects?.map((s, i) => (
                                                    <span key={i} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-md border border-indigo-100 dark:border-indigo-500/20">
                                                        {typeof s === 'object' ? s.name : s}
                                                    </span>
                                                ))}
                                                {viewingEmployee.subjects?.length === 0 && <span className="text-xs text-slate-400 italic">No specific subjects listed</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                            <Calendar size={10} /> Personal Details
                                        </p>
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider">DOB</span>
                                                <span className="text-slate-700 dark:text-slate-200 font-black">{viewingEmployee.dob ? new Date(viewingEmployee.dob).toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider">Blood Group</span>
                                                <span className="text-red-500 font-black">{viewingEmployee.blood_group || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider">Status</span>
                                                <span className="text-emerald-500 font-black">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                    {viewingEmployee.transport?.is_using_bus && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                                <Truck size={10} /> Transport
                                            </p>
                                            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white"><Truck size={20} /></div>
                                                    <div>
                                                        <p className="text-xs font-black text-amber-700 dark:text-amber-500 uppercase">Bus Assigned</p>
                                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                                            {viewingEmployee.transport.stop_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
                                <Button onClick={() => { setEditingEmployee(viewingEmployee); setViewingEmployee(null); }} className="flex-1 bg-indigo-600 shadow-lg shadow-indigo-600/20">
                                    <FileText size={18} className="mr-2" /> Edit Profile
                                </Button>
                                <Button variant="secondary" onClick={() => setViewingEmployee(null)} className="px-8">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Edit Employee Profile</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Updating records for {editingEmployee.name}</p>
                            </div>
                            <button onClick={() => setEditingEmployee(null)} className="p-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 pb-10">
                            {editingEmployee.type === 'teacher' ? (
                                <TeacherForm
                                    initialData={editingEmployee.original}
                                    onSubmit={handleUpdateEmployee}
                                    onCancel={() => setEditingEmployee(null)}
                                    loading={isSubmitting}
                                />
                            ) : (
                                <StaffForm
                                    initialData={editingEmployee.original}
                                    onSubmit={handleUpdateEmployee}
                                    onCancel={() => setEditingEmployee(null)}
                                    loading={isSubmitting}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
