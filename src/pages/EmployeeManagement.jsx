
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import api from '../utils/api'; // Ensure this path is correct for your project
import {
    Users,
    Plus,
    Search,
    Phone,
    Mail,
    Shield,
    CheckCircle,
    FileText,
    DollarSign,
    Calendar,
    Download,
    Eye,
    X,
    Briefcase,
    Pencil,
    Trash2,
    GraduationCap,
    Truck,
    AlertCircle, // Added for potential warnings/errors
} from 'lucide-react';
import Button from '../components/ui/Button'; // Ensure this path is correct
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import Skeleton from '../components/ui/Skeleton'; // Ensure this path is correct
import TeacherForm from '../components/TeacherForm'; // Ensure this path is correct
import StaffForm from '../components/StaffForm'; // Ensure this path is correct
import { useToast } from '../context/ToastContext'; // Ensure this path is correct
import jsPDF from 'jspdf'; // Make sure to install: npm install jspdf

const EmployeeManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('directory');
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payroll State
    const [payrollList, setPayrollList] = useState([]);
    const [payrollLoading, setPayrollLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toLocaleString('default', { month: 'long' })
    );
    const [selectedYear, setSelectedYear] = useState(String(currentYear));
    const [payrollStatusFilter, setPayrollStatusFilter] = useState('all');

    // Access Control
    // User roles that can manage employees and payroll
    const canManage = ['admin', 'owner', 'principal'].includes(user?.role);

    // Months for dropdown
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Years for dropdown (current year +/- 2 for example)
    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

    // Helper to format currency consistently
    const formatCurrency = (value) =>
        `₹ ${(Number(value) || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 0, // No decimal places for whole numbers
            maximumFractionDigits: 2, // Up to two decimal places for fractions
        })}`;

    // --- Fetch Data ---

    // Fetches all types of employees and normalizes their data
    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const [teachersRes, driversRes, usersRes] = await Promise.all([
                api.get('/teachers'),
                api.get('/drivers'),
                api.get('/users?role=admin,owner,principal,staff'), // Fetches users that are staff, admin, etc.
            ]);

            const normalize = (data, type, roleLabel) => {
                if (!Array.isArray(data)) {
                    console.warn(`Normalize expected array for ${type}, got:`, data);
                    return [];
                }
                return data.map((item) => {
                    const designation = item.designation || item.profile_id?.designation || roleLabel || '-';
                    const actualRole = item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : roleLabel;

                    return {
                        _id: item._id,
                        id_code: item.teacher_id || item.staff_id || item.driver_id || item.profile_id?.staff_id || 'SYS',
                        name: item.full_name || item.profile_id?.full_name || item.username || 'User',
                        role: type === 'staff' ? actualRole : roleLabel, // Use actual role for 'staff' type
                        designation,
                        contact: item.phone || item.phone_number || item.profile_id?.phone || '-',
                        email: item.email || '-',
                        aadhaar: item.aadhaar_number || item.profile_id?.aadhaar_number || '-',
                        photo: item.photo_url || item.profile_id?.photo_url,
                        dob: item.dob || item.profile_id?.dob,
                        blood_group: item.blood_group || item.profile_id?.blood_group,
                        qualification: item.qualification || item.profile_id?.qualification,
                        subjects: item.subjects || item.subjects_expertise || [],
                        transport: item.transport || item.profile_id?.transport,
                        type, // teacher, driver, staff
                        verified: !!(item.aadhaar_number || item.profile_id?.aadhaar_number),
                        original: item, // Keep original data for editing forms
                    };
                });
            };

            let allEmps = [
                ...normalize(teachersRes.data, 'teacher', 'Teacher'),
                ...normalize(driversRes.data, 'driver', 'Driver'),
                ...normalize(usersRes.data.users || usersRes.data, 'staff', null), // Null roleLabel so `normalize` uses item.role
            ];

            setEmployees(allEmps);
            return allEmps; // Return for use in other functions like fetchPayroll
        } catch (error) {
            console.error("Error fetching employees:", error);
            showToast('Error', 'error', 'Failed to load employee directory.');
            return [];
        } finally {
            setLoading(false);
        }
    }, [showToast]); // Dependency array for useCallback

    // Fetches leave requests
    const fetchLeaves = useCallback(async () => {
        try {
            const { data } = await api.get('/communications?type=LEAVE');
            setLeaves(data);
        } catch (error) {
            console.error("Error fetching leaves:", error);
            showToast('Error', 'error', 'Failed to load leave requests.');
        }
    }, [showToast]);

    // Fetches payroll data for the selected month/year and merges with employee list
    const fetchPayroll = useCallback(async (currentEmps = null) => {
        setPayrollLoading(true);
        try {
            const payrollRes = await api.get(`/payroll?month=${selectedMonth}&year=${selectedYear}`);
            const existingPayroll = Array.isArray(payrollRes.data) ? payrollRes.data : payrollRes.data.payroll || [];

            const currentEmployees = Array.isArray(currentEmps) ? currentEmps : employees;
            if (currentEmployees.length === 0 && !currentEmps) {
                const fetched = await fetchEmployees();
                if (!Array.isArray(fetched)) throw new Error("Could not fetch employees as array");
            }

            const mergedList = (Array.isArray(currentEmployees) ? currentEmployees : []).map(emp => {
                const found = existingPayroll.find(p =>
                    p.employeeId === emp.id_code ||
                    p._id === emp._id ||
                    p.employeeName === emp.name
                );

                if (found) {
                    return {
                        ...found,
                        baseSalary: found.baseSalary != null ? String(found.baseSalary) : '',
                        deductions: found.deductions != null ? String(found.deductions) : '',
                        netSalary: (Number(found.baseSalary) || 0) - (Number(found.deductions) || 0),
                        month: selectedMonth,
                        year: selectedYear,
                    };
                } else {
                    return {
                        employeeId: emp.id_code,
                        employeeName: emp.name,
                        role: emp.role,
                        month: selectedMonth,
                        year: selectedYear,
                        baseSalary: '',
                        deductions: '',
                        netSalary: 0,
                        status: 'Pending',
                    };
                }
            });

            if (!canManage) {
                const myName = user?.profile_id?.full_name || user?.username;
                setPayrollList(mergedList.filter(p => p.employeeName === myName));
            } else {
                setPayrollList(mergedList);
            }

        } catch (error) {
            console.error("Error fetching payroll:", error);
            showToast('Error', 'error', 'Failed to load payroll data.');
        } finally {
            setPayrollLoading(false);
        }
    }, [selectedMonth, selectedYear, showToast, canManage, user, employees, fetchEmployees]);

    // Refined Effect hook to trigger data fetching only on meaningful changes
    useEffect(() => {
        const load = async () => {
            if (activeTab === 'directory') {
                await fetchEmployees();
            } else if (activeTab === 'leaves') {
                await fetchLeaves();
            } else if (activeTab === 'payroll' || activeTab === 'payslips') {
                await fetchPayroll();
            }
        };
        load();
    }, [activeTab, selectedMonth, selectedYear]);

    // --- Employee Management Actions ---

    const handleDeleteEmployee = async (emp) => {
        if (!window.confirm(`Are you sure you want to remove ${emp.name}? This action is irreversible.`)) {
            return;
        }
        try {
            let endpoint = '';
            if (emp.type === 'teacher') endpoint = `/teachers/${emp._id}`;
            else if (emp.type === 'driver') endpoint = `/drivers/${emp._id}`;
            // For staff, check if it's a user record (usually linked by emp.original?.user_id) or a standalone profile
            else endpoint = `/users/${emp.original?.user_id || emp._id}`;

            await api.delete(endpoint);
            showToast('Success', 'success', `${emp.name} has been removed.`);
            fetchEmployees(); // Refresh the directory list
        } catch (error) {
            console.error("Error deleting employee:", error);
            showToast('Delete Failed', 'error', 'Could not remove employee.');
        }
    };

    const handleUpdateEmployee = async (data) => {
        setIsSubmitting(true);
        try {
            let endpoint = '';
            if (editingEmployee.type === 'teacher') endpoint = `/teachers/${editingEmployee._id}`;
            else if (editingEmployee.type === 'driver') endpoint = `/drivers/${editingEmployee._id}`;
            else endpoint = `/users/${editingEmployee.original?.user_id || editingEmployee._id}`;

            await api.put(endpoint, data);
            showToast('Profile Updated', 'success', `Changes to ${data.full_name} saved.`);
            setEditingEmployee(null); // Close the edit modal
            fetchEmployees(); // Refresh the directory list
        } catch (error) {
            console.error("Error updating employee:", error);
            showToast('Update Failed', 'error', 'Could not save changes to employee profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Payroll Actions (with live calculation and persistence) ---

    // Handles changes in baseSalary or deductions input fields
    const handlePayrollChange = (index, field, value) => {
        const updatedList = [...payrollList];

        // Update the specific field with the raw input value (allows typing empty string)
        updatedList[index][field] = value;

        // Parse numbers for calculation (treat empty string as 0 for calculation, but keep raw value in state)
        const base = Number(updatedList[index].baseSalary) || 0;
        const ded = Number(updatedList[index].deductions) || 0;

        // Live calculate net salary
        updatedList[index].netSalary = base - ded;

        setPayrollList(updatedList);
    };

    // Saves an individual payroll row to the backend
    const savePayrollRow = async (p) => {
        try {
            const payload = {
                employeeId: p.employeeId,
                employeeName: p.employeeName,
                role: p.role,
                month: selectedMonth,
                year: selectedYear,
                baseSalary: Number(p.baseSalary) || 0, // Ensure numbers are sent to backend
                deductions: Number(p.deductions) || 0,
                netSalary: p.netSalary,
                status: p.status || 'Pending', // Default to Pending if not set
            };

            await api.post('/payroll', payload); // Assuming this endpoint handles upserting (create or update)
            showToast('Payroll Saved', 'success', `Payroll details saved for ${p.employeeName}.`);
            // No need to refetch entire payroll list, as UI is already updated by handlePayrollChange
        } catch (error) {
            console.error("Error saving payroll row:", error);
            showToast('Save Failed', 'error', 'Could not save payroll details.');
        }
    };

    // Marks a payroll entry as 'Paid' and saves it
    const markAsPaid = async (p) => {
        if (!window.confirm(`Confirm marking ${p.employeeName}'s payroll as PAID for ${selectedMonth} ${selectedYear}?`)) {
            return;
        }
        try {
            const payload = {
                employeeId: p.employeeId,
                employeeName: p.employeeName,
                role: p.role,
                month: selectedMonth,
                year: selectedYear,
                baseSalary: Number(p.baseSalary) || 0,
                deductions: Number(p.deductions) || 0,
                netSalary: p.netSalary,
                status: 'Paid', // Explicitly set status to 'Paid'
            };

            await api.post('/payroll', payload);
            showToast('Marked as Paid', 'success', `${p.employeeName}'s salary marked as paid.`);
            fetchPayroll(); // Refetch to ensure UI reflects the 'Paid' status and disable inputs
        } catch (error) {
            console.error("Error marking payroll as paid:", error);
            showToast('Action Failed', 'error', 'Could not mark payroll as paid.');
        }
    };

    // --- Leave Management Actions ---

    const handleLeaveAction = async (leaveId, status) => {
        try {
            await api.put(`/communications/${leaveId}/status`, { status });
            showToast('Success', 'success', `Leave request ${status.toLowerCase()}.`);
            fetchLeaves(); // Refresh leave requests list
        } catch (error) {
            console.error("Error updating leave status:", error);
            showToast('Update Failed', 'error', 'Could not update leave status.');
        }
    };

    // --- Payslip Generation ---

    const handleDownloadPayslip = (p) => {
        try {
            // Find the employee in the directory to get banking details from 'original' record
            const empRecord = employees.find(e => e.id_code === p.employeeId || e.name === p.employeeName);
            const bank = empRecord?.original?.bank_details || {};

            const doc = new jsPDF();

            // Header - School Name (Placeholder, can be replaced with actual school name)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // Slate 800
            doc.text('ANTIGRAVITY SCHOOL', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // Slate 500
            doc.text('Monthly Salary Statement / Payslip', 105, 27, { align: 'center' });

            // Payslip Title
            doc.setFillColor(79, 70, 229); // Indigo 600
            doc.rect(15, 35, 180, 10, 'F');
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.text(`PAYSLIP FOR ${p.month.toUpperCase()} ${p.year}`, 105, 41.5, { align: 'center' });

            let y = 60;

            // Two-column layout for details
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);

            // Left Column: Employee Info
            doc.setFont('helvetica', 'bold');
            doc.text('EMPLOYEE DETAILS', 20, y);
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${p.employeeName}`, 20, y + 8);
            doc.text(`ID: ${p.employeeId || 'N/A'}`, 20, y + 14);
            doc.text(`Designation: ${p.role}`, 20, y + 20);

            // Right Column: Bank Info
            doc.setFont('helvetica', 'bold');
            doc.text('BANKING DETAILS', 110, y);
            doc.setFont('helvetica', 'normal');
            doc.text(`Bank: ${bank.bank_name || 'N/A'}`, 110, y + 8);
            doc.text(`Acc No: ${bank.account_number || 'N/A'}`, 110, y + 14);
            doc.text(`IFSC: ${bank.ifsc_code || 'N/A'}`, 110, y + 20);

            y += 40;

            // Salary Table
            doc.setFillColor(248, 250, 252); // Slate 50
            doc.rect(15, y, 180, 40, 'F');
            doc.setDrawColor(226, 232, 240); // Slate 200
            doc.rect(15, y, 180, 40);

            doc.setFont('helvetica', 'bold');
            doc.text('Description', 20, y + 8);
            doc.text('Amount (INR)', 160, y + 8, { align: 'right' });
            doc.line(15, y + 12, 195, y + 12);

            doc.setFont('helvetica', 'normal');
            doc.text('Basic Pay / Salary', 20, y + 20);
            doc.text(formatCurrency(p.baseSalary).replace('₹ ', ''), 160, y + 20, { align: 'right' });

            doc.setTextColor(220, 38, 38); // Red 600
            doc.text('Total Deductions', 20, y + 28);
            doc.text(`- ${formatCurrency(p.deductions).replace('₹ ', '')}`, 160, y + 28, { align: 'right' });

            doc.line(15, y + 32, 195, y + 32);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74); // Emerald 600
            doc.text('NET PAYABLE', 20, y + 37);
            doc.text(formatCurrency(p.netSalary), 160, y + 37, { align: 'right' });

            // Footer
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text('This is a system-generated document and does not require a physical signature.', 105, 280, { align: 'center' });

            const filename = `Payslip_${p.employeeName.replace(/\s+/g, '_')}_${p.month}_${p.year}.pdf`;
            doc.save(filename);
            showToast('Success', 'success', 'Payslip generated successfully.');
        } catch (error) {
            console.error("Error generating payslip:", error);
            showToast('Export Error', 'error', 'Could not generate PDF payslip.');
        }
    };

    // --- Filtered Employees for Directory Tab ---
    const filteredEmployees = employees.filter((emp) => {
        const matchesRole = filterRole === 'all' || emp.type === filterRole;
        const search = searchQuery.toLowerCase();
        const matchesSearch =
            !search ||
            emp.name?.toLowerCase().includes(search) ||
            emp.id_code?.toLowerCase().includes(search) ||
            emp.email?.toLowerCase().includes(search) ||
            emp.contact?.toLowerCase().includes(search);
        return matchesRole && matchesSearch;
    });

    // --- Render Components for Each Tab ---

    const DirectoryTab = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Directory..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none border border-slate-200 dark:border-white/10"
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
                                    filterRole === role ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton variant="circle" className="w-10 h-10" /><div className="space-y-2"><Skeleton className="w-32 h-4" /><Skeleton className="w-24 h-3" /></div></div></td>
                                    <td className="px-6 py-4"><div className="space-y-2"><Skeleton className="w-20 h-4" /><Skeleton className="w-16 h-3" /></div></td>
                                    {canManage && (<td className="px-6 py-4"><div className="space-y-2"><Skeleton className="w-24 h-3" /><Skeleton className="w-32 h-3" /></div></td>)}
                                    {canManage && (<td className="px-6 py-4"><Skeleton className="w-16 h-5" /></td>)}
                                    {canManage && (<td className="px-6 py-4 text-right"><Skeleton className="w-8 h-8 ml-auto" /></td>)}
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
                        ) : (
                            filteredEmployees.map(emp => (
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const LeaveTab = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
                {leaves.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <AlertCircle size={48} className="opacity-20 mx-auto mb-3" />
                        <p className="font-bold">No pending leave requests.</p>
                        <p className="text-sm">All caught up!</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                {canManage && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {leaves
                                .filter(l => canManage || l.sender_id?._id === user?._id || l.createdBy === user?.email)
                                .map(leave => (
                                    <tr key={leave._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            {leave.createdBy}
                                            {leave.sender_id?.full_name && <div className="text-[10px] text-slate-400 uppercase">{leave.sender_id.full_name}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="font-medium">{new Date(leave.content.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(leave.content.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                            <div className="text-[10px] text-slate-400 italic">Expected back: {new Date(leave.content.endDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{leave.content.description}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={clsx("px-2.5 py-1 text-[10px] rounded-full font-black uppercase tracking-widest",
                                                leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-right">
                                                {leave.status === 'Pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleLeaveAction(leave._id, 'Approved')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10">
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button onClick={() => handleLeaveAction(leave._id, 'Rejected')} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all shadow-md shadow-rose-500/10">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 italic uppercase">Processed</span>
                                                )}
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

    const PayrollTab = () => {
        const totalNet = payrollList.reduce((acc, curr) => acc + (Number(curr.netSalary) || 0), 0);
        const employeesPaid = payrollList.filter(p => p.status === 'Paid').length;

        return (
            <div className="space-y-6 animate-in fade-in">
                {canManage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-emerald-600 font-bold mb-1">Total Payout</p>
                            <h3 className="text-3xl font-bold text-emerald-900">
                                {formatCurrency(totalNet)}
                            </h3>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-blue-600 font-bold mb-1">Employees Paid</p>
                            <h3 className="text-3xl font-bold text-blue-900">
                                {employeesPaid} / {payrollList.length}
                            </h3>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-white">
                                <DollarSign size={20} /> Payroll & Salary
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Viewing: {selectedMonth} {selectedYear}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-white"
                            >
                                {months.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-white"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={payrollStatusFilter}
                                onChange={(e) => setPayrollStatusFilter(e.target.value)}
                                className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                            <Button onClick={() => fetchPayroll()} size="sm">Refresh</Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="relative overflow-x-auto">
                        {payrollLoading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-10">
                                <div className="flex gap-2 items-center text-slate-500 text-sm">
                                    <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    Loading payroll data...
                                </div>
                            </div>
                        )}

                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Base Salary</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Deductions</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Net Pay</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                    {canManage && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {payrollList.filter(p => (payrollStatusFilter === 'all' || p.status === payrollStatusFilter)).length === 0 && !payrollLoading ? (
                                    <tr><td colSpan={canManage ? 6 : 5} className="p-8 text-center text-slate-400">No payroll records found for this period.</td></tr>
                                ) : (
                                    payrollList
                                        .filter(p => (payrollStatusFilter === 'all' || p.status === payrollStatusFilter))
                                        .map((p, index) => (
                                            <tr key={`${p.employeeId}-${index}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{p.employeeName}</div>
                                                    <div className="text-xs text-slate-400 font-medium uppercase">{p.role}</div>
                                                </td>

                                                {/* Base Salary Input */}
                                                <td className="px-6 py-4 text-center">
                                                    {canManage && p.status !== 'Paid' ? (
                                                        <div className="relative inline-block w-32">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                                            <input
                                                                type="number"
                                                                className="w-full pl-6 pr-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                                value={p.baseSalary}
                                                                onChange={(e) => handlePayrollChange(index, 'baseSalary', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(p.baseSalary)}</span>
                                                    )}
                                                </td>

                                                {/* Deductions Input */}
                                                <td className="px-6 py-4 text-center">
                                                    {canManage && p.status !== 'Paid' ? (
                                                        <div className="relative inline-block w-32">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">-</span>
                                                            <input
                                                                type="number"
                                                                className="w-full pl-6 pr-3 py-2 bg-white text-slate-900 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-center dark:bg-slate-700 dark:border-red-600 dark:text-white"
                                                                value={p.deductions}
                                                                onChange={(e) => handlePayrollChange(index, 'deductions', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-red-500 font-medium">- {formatCurrency(p.deductions)}</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-black text-slate-800 dark:text-white text-lg">
                                                        {formatCurrency(p.netSalary)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className={clsx("px-3 py-1 rounded-full text-xs font-bold uppercase",
                                                        p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                                                        {p.status}
                                                    </span>
                                                </td>

                                                {canManage && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {p.status !== 'Paid' ? (
                                                                <>
                                                                    <Button size="sm" variant="secondary" onClick={() => savePayrollRow(p)}>Save</Button>
                                                                    <Button size="sm" onClick={() => markAsPaid(p)}>Mark Paid</Button>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-green-600 font-bold flex items-center justify-end gap-1">
                                                                    <CheckCircle size={14} /> Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const PayslipsTab = () => {
        const paidPayrolls = payrollList.filter(p => (p.status === 'Paid') && (payrollStatusFilter === 'all' || p.status === payrollStatusFilter));

        return (
            <div className="space-y-4 animate-in fade-in">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText size={18} /> Payslips
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Download salary slips for {selectedMonth} {selectedYear}.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-white"
                        >
                            {months.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-white"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <Button onClick={fetchPayroll} size="sm">Refresh</Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Period</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Net Pay</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Download</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {payrollLoading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading payslip data...</td></tr>
                            ) : paidPayrolls.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400">No payslips generated yet for {selectedMonth} {selectedYear}.</td></tr>
                            ) : (
                                paidPayrolls.map((p, idx) => (
                                    <tr key={p.employeeId + idx}>
                                        <td className="px-6 py-4 font-bold text-sm text-slate-800 dark:text-slate-100">{p.employeeName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{p.month}, {p.year}</td>
                                        <td className="px-6 py-4 text-right font-bold text-sm text-slate-800 dark:text-white">{formatCurrency(p.netSalary)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownloadPayslip(p)}
                                                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                                            >
                                                <Download size={16} /> Download PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
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
                            activeTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
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

            {/* View Employee Modal */}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                                {(!viewingEmployee.subjects || viewingEmployee.subjects.length === 0) && <span className="text-xs text-slate-400 italic">No specific subjects listed</span>}
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

            {/* Edit Employee Modal */}
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