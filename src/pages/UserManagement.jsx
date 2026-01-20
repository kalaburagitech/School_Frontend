import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Users, UserPlus, Search, Shield, ShieldCheck,
    Edit, Trash2, Key, Mail, Phone, Lock, Unlock, MoreVertical, CheckCircle
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const UserManagement = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('teachers');
    const [profiles, setProfiles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Reset Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState(null);
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

    // Grant Access Modal State
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    // Create Admin Modal State
    const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
    const [newAdminData, setNewAdminData] = useState({
        email: '', password: '', role: 'admin',
        full_name: '', aadhaar_number: '', phone: '', address: ''
    });

    useEffect(() => {
        setSearchTerm('');
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users for access mapping
            const usersRes = await api.get('/users');
            setUsers(usersRes.data.users || []);

            // Fetch profiles based on tab
            let endpoint = '';
            if (activeTab === 'teachers') endpoint = '/teachers';
            else if (activeTab === 'drivers') endpoint = '/drivers';
            else if (activeTab === 'students') endpoint = '/students';
            else if (activeTab === 'staff') {
                // For staff, filter users by 'staff' role or fetch from staff endpoint if exists
                setProfiles(usersRes.data.users.filter(u => u.role === 'staff') || []);
                setLoading(false);
                return;
            }
            else if (activeTab === 'admins') {
                // For admins, just use the users list filtered by high-level roles
                setProfiles(usersRes.data.users.filter(u => ['admin', 'owner', 'principal'].includes(u.role)) || []);
                setLoading(false);
                return;
            }

            if (endpoint) {
                const profilesRes = await api.get(endpoint);
                setProfiles(profilesRes.data || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newAdminData);
            alert('User Created Successfully!');
            setShowCreateAdminModal(false);
            setNewAdminData({ email: '', password: '', role: 'admin' });
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to create user: ' + (error.response?.data?.message || error.message));
        }
    };

    const getAccessStatus = (profile) => {
        if (activeTab === 'admins' || activeTab === 'staff') return { hasAccess: true, user: profile };
        const user = users.find(u =>
            (u.profile_id && (u.profile_id._id === profile._id || u.profile_id === profile._id))
        );
        return { hasAccess: !!user, user };
    };

    const handleGrantAccess = (profile) => {
        setSelectedProfile(profile);
        setCredentials({
            email: profile.email || '',
            password: 'password123',
            role: activeTab === 'teachers' ? 'teacher' :
                activeTab === 'drivers' ? 'driver' :
                    activeTab === 'students' ? 'parent' : 'admin'
        });
        setShowAccessModal(true);
    };

    const submitAccess = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', {
                ...credentials,
                profile_id: selectedProfile._id,
                role_model: activeTab === 'teachers' ? 'Teacher' :
                    activeTab === 'drivers' ? 'Driver' :
                        activeTab === 'students' ? 'Student' : 'Staff'
            });
            setShowAccessModal(false);
            fetchData();
            alert('Access granted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to grant access');
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await api.patch(`/users/${userId}/toggle-status`);
            fetchData();
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            alert('Failed to toggle status');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            await api.patch(`/users/${selectedUserForPasswordReset._id}/reset-password`, {
                newPassword: passwordData.newPassword
            });
            setShowPasswordModal(false);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            alert('Password reset successfully!');
        } catch (error) {
            console.error('Failed to reset password:', error);
            alert('Failed to reset password');
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const search = searchTerm.toLowerCase();
        if (activeTab === 'admins') return p.email?.toLowerCase().includes(search);

        return (
            p.full_name?.toLowerCase().includes(search) ||
            p.email?.toLowerCase().includes(search) ||
            p.staff_id?.toLowerCase().includes(search) ||
            p.driver_id?.toLowerCase().includes(search) ||
            p.admission_number?.toLowerCase().includes(search) ||
            p.phone?.toLowerCase().includes(search)
        );
    });

    const columns = {
        teachers: [
            { header: 'Staff ID', key: 'staff_id' },
            { header: 'Name', key: 'full_name' },
            { header: 'Designation', key: 'designation' },
            { header: 'Phone', key: 'phone' }
        ],
        drivers: [
            { header: 'Driver ID', key: 'driver_id' },
            { header: 'Name', key: 'full_name' },
            { header: 'License', key: 'license_number' },
            { header: 'Phone', key: 'phone' }
        ],
        students: [
            { header: 'Admission No', key: 'admission_number' },
            { header: 'Name', key: 'full_name' },
            { header: 'Class', render: (s) => s.class_info ? `${s.class_info.grade}-${s.class_info.section}` : '-' },
            { header: 'Parent', render: (s) => s.family?.father?.name || s.parent_info?.father_name || 'N/A' }
        ],
        staff: [
            { header: 'Email', key: 'email' },
            { header: 'Phone', key: 'phone' },
            { header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() }
        ],
        admins: [
            { header: 'Email', key: 'email' },
            { header: 'Role', key: 'role' },
            { header: 'Phone', key: 'phone' },
            { header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() }
        ]
    };

    return (
        <div className={clsx("min-h-screen p-6 transition-colors duration-300", theme === 'dark' ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900")
        } >
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            Access Control
                        </h1>
                        <p className={clsx("mt-1", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                            Manage system access for staff, students, and drivers
                        </p>
                    </div>

                </div>

                <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                    {['teachers', 'drivers', 'students', 'staff', 'admins'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "px-4 py-2 rounded-lg font-medium capitalize transition-all",
                                activeTab === tab
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search & Actions */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx(
                                "w-full pl-12 pr-4 py-3 rounded-xl border transition-all outline-none",
                                theme === 'dark'
                                    ? "bg-slate-800 border-white/10 focus:border-blue-500 text-white"
                                    : "bg-white border-slate-200 focus:border-blue-500 text-slate-900"
                            )}
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className={clsx("rounded-2xl border overflow-hidden", theme === 'dark' ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200")}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={clsx("border-b", theme === 'dark' ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                <tr>
                                    {columns[activeTab].map((col, idx) => (
                                        <th key={idx} className="px-6 py-4 text-left text-sm font-semibold">{col.header}</th>
                                    ))}
                                    <th className="px-6 py-4 text-right text-sm font-semibold">Access Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                                ) : filteredProfiles.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No records found</td></tr>
                                ) : (
                                    filteredProfiles.map((item) => {
                                        const { hasAccess, user } = getAccessStatus(item);
                                        return (
                                            <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                                {columns[activeTab].map((col, idx) => (
                                                    <td key={idx} className="px-6 py-4 text-sm">
                                                        {col.render ? col.render(item) : item[col.key] || '-'}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 text-right">
                                                    <span className={clsx(
                                                        "px-3 py-1 rounded-full text-xs font-medium",
                                                        hasAccess
                                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                            : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                                                    )}>
                                                        {hasAccess ? (user?.is_active === false ? 'Inactive' : 'Active') : 'No Access'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {hasAccess ? (
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Button variant="secondary" size="sm" onClick={() => {
                                                                setSelectedUserForPasswordReset(user);
                                                                setShowPasswordModal(true);
                                                            }}>
                                                                <Key size={16} className="mr-2" />
                                                                Reset
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className={clsx(
                                                                    user?.is_active === false
                                                                        ? "text-red-500 hover:bg-red-500/10 border-red-500/20"
                                                                        : "text-green-500 hover:bg-green-500/10 border-green-500/20"
                                                                )}
                                                                onClick={() => handleToggleStatus(user._id)}
                                                            >
                                                                {user?.is_active === false ? <Lock size={16} /> : <Unlock size={16} />}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button variant="primary" size="sm" onClick={() => handleGrantAccess(item)}>
                                                            <UserPlus size={16} className="mr-2" />
                                                            Grant Access
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Grant Access Modal */}
            < Modal
                isOpen={showAccessModal}
                onClose={() => setShowAccessModal(false)}
                title={`Grant Access to ${selectedProfile?.full_name || 'User'}`}
            >
                <form onSubmit={submitAccess} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email (Login ID)</label>
                        <input
                            type="email"
                            required
                            value={credentials.email}
                            onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2 rounded-lg border outline-none",
                                theme === 'dark' ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
                            )}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Set Password</label>
                        <input
                            type="password"
                            required
                            value={credentials.password}
                            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2 rounded-lg border outline-none",
                                theme === 'dark' ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setShowAccessModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Create Login</Button>
                    </div>
                </form>
            </Modal >

            {/* Reset Password Modal */}
            < Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Reset Password"
            >
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={passwordData.newPassword}
                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2 rounded-lg border outline-none",
                                theme === 'dark' ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
                            )}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={passwordData.confirmPassword}
                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2 rounded-lg border outline-none",
                                theme === 'dark' ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Reset Password</Button>
                    </div>
                </form>
            </Modal >
        </div >
    );
};

export default UserManagement;
