import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash, Search, Filter, Briefcase, GraduationCap, Truck, Mail } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TeacherForm from '../components/TeacherForm';
import SubjectManagement from '../components/SubjectManagement';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';
import { BookOpen } from 'lucide-react';

const TeacherManagement = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        bus_id: ''
    });
    const [options, setOptions] = useState({
        buses: []
    });

    const isAdmin = user?.role === 'admin';

    const fetchTeachers = async () => {
        try {
            const [{ data: teachersData }, { data: busesData }] = await Promise.all([
                api.get('/teachers'),
                api.get('/buses')
            ]);

            setTeachers(teachersData);
            setOptions({
                buses: busesData
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch teachers', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleAdd = () => {
        setSelectedTeacher(null);
        setIsModalOpen(true);
    };

    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this teacher?')) {
            try {
                await api.delete(`/teachers/${id}`);
                showToast('Teacher removed', 'success', 'The profile has been successfully deleted.');
                fetchTeachers();
            } catch (error) {
                console.error('Delete failed', error);
                showToast('Action failed', 'error', 'Could not remove the teacher profile.');
            }
        }
    };

    const handleSubmit = async (formData) => {
        try {
            if (selectedTeacher) {
                await api.put(`/teachers/${selectedTeacher._id}`, formData);
                showToast('Profile Updated', 'success', `${formData.full_name}'s details saved.`);
            } else {
                await api.post('/teachers', formData);
                showToast('Teacher Registered', 'success', 'New profile created successfully.');
            }
            setIsModalOpen(false);
            fetchTeachers();
        } catch (error) {
            console.error('Submit failed', error);
            const msg = error.response?.data?.message || error.message || 'Unknown save error';
            showToast('Save Error', 'error', msg);
        }
    };

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.teacher_id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = !filters.status || t.status === filters.status;
        const matchesBus = !filters.bus_id || t.transport?.bus_id === filters.bus_id;

        return matchesSearch && matchesStatus && matchesBus;
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Teachers</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage faculty profiles, academic assignments, and transport access.</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsSubjectModalOpen(true)}
                            className="h-11 px-6 border-slate-200 dark:border-white/10"
                        >
                            <BookOpen size={18} className="mr-2" />
                            Manage Subjects
                        </Button>
                        <Button onClick={handleAdd} className="h-11 px-6 shadow-xl shadow-indigo-600/20">
                            <Plus size={18} className="mr-2" />
                            Add Teacher
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Retired">Retired</option>
                        </select>
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            value={filters.bus_id}
                            onChange={(e) => setFilters({ ...filters, bus_id: e.target.value })}
                        >
                            <option value="">All Buses</option>
                            {options.buses.map(b => (
                                <option key={b._id} value={b._id}>{b.vehicle_number}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white">Profile</th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white">Designation</th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white">Subjects</th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white">Transport</th>
                                <th className="px-6 py-5 text-right text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="p-24 text-center">
                                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr><td colSpan="5" className="p-24 text-center text-slate-400 font-medium">No teachers found.</td></tr>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher._id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{teacher.full_name}</span>
                                                <span className="text-xs text-slate-500 font-medium">{teacher.teacher_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            {teacher.designation || 'Teacher'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1">
                                                {(teacher.subjects || []).slice(0, 2).map((s, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-400/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100 dark:border-indigo-400/20">
                                                        {typeof s === 'object' ? s.name : s}
                                                    </span>
                                                ))}
                                                {teacher.subjects?.length > 2 && (
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 rounded-md">
                                                        +{teacher.subjects.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
                                                teacher.transport?.is_using_bus
                                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-400"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400"
                                            )}>
                                                {teacher.transport?.is_using_bus ? 'Transport' : 'Self'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end space-x-3">
                                                <button onClick={() => handleEdit(teacher)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(teacher._id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedTeacher ? 'Edit Teacher Profile' : 'Register New Teacher'}
                maxWidth="max-w-2xl"
            >
                <TeacherForm
                    initialData={selectedTeacher}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                title="Subject Registry"
                maxWidth="max-w-4xl"
            >
                <SubjectManagement onSubjectsUpdated={fetchTeachers} />
            </Modal>
        </div>
    );
};

export default TeacherManagement;
