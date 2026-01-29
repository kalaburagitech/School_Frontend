import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Edit, Trash, Search, Filter, Eye,
    User, Truck, MapPin, GraduationCap, Shield, CreditCard
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StudentForm from '../components/StudentForm';
import { useToast } from '../context/ToastContext';

const StudentManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // State management
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        grade: '',
        bus_id: '',
        transport_status: ''
    });
    const [options, setOptions] = useState({
        grades: [],
        routes: [],
        buses: []
    });

    const isAdmin = user?.role === 'admin';
    const isTeacher = user?.role === 'teacher';
    const isStudent = user?.role === 'student';
    const isDriver = user?.role === 'driver';
    const canGenerateIDCard = isAdmin || isTeacher; // Only admin and teachers can generate ID cards

    // Fetch students and related data
    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const [studentsRes, busesRes, routesRes] = await Promise.all([
                api.get('/students'),
                api.get('/buses'),
                api.get('/routes')
            ]);

            const studentsData = studentsRes.data;
            setStudents(studentsData);

            const uniqueGrades = [...new Set(
                studentsData
                    .map(s => s.class_info?.grade)
                    .filter(Boolean)
            )].sort((a, b) => a - b);

            setOptions({
                grades: uniqueGrades,
                buses: busesRes.data,
                routes: routesRes.data
            });
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast('Failed to load data', 'error', error.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Filtered students with memoization
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                student.full_name?.toLowerCase().includes(searchLower) ||
                student.student_id?.toLowerCase().includes(searchLower) ||
                student.admission_number?.toLowerCase().includes(searchLower);

            const matchesGrade = !filters.grade ||
                student.class_info?.grade === filters.grade;

            const matchesBus = !filters.bus_id ||
                student.transport?.bus_id?._id === filters.bus_id ||
                student.transport?.bus_id === filters.bus_id;

            const matchesTransport = !filters.transport_status ||
                (filters.transport_status === 'bus'
                    ? student.transport?.is_using_bus
                    : !student.transport?.is_using_bus);

            return matchesSearch && matchesGrade && matchesBus && matchesTransport;
        });
    }, [students, searchQuery, filters]);

    // Handlers
    const handleAdd = useCallback(() => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    }, []);

    const handleView = useCallback((student) => {
        setViewingStudent(student);
        setIsViewModalOpen(true);
    }, []);


    const handleDelete = useCallback(async (id, studentName) => {
        if (!window.confirm(`Are you sure you want to delete ${studentName}?`)) {
            return;
        }

        try {
            await api.delete(`/students/${id}`);
            showToast('Student deleted', 'success', 'Record removed successfully');
            fetchStudents();
        } catch (error) {
            console.error('Delete failed:', error);
            showToast('Delete failed', 'error', error.response?.data?.message || 'Server error');
        }
    }, [fetchStudents, showToast]);

    const handleSubmit = useCallback(async (formData) => {
        try {
            if (selectedStudent) {
                await api.put(`/students/${selectedStudent._id}`, formData);
                showToast('Updated!', 'success', `${formData.full_name} updated successfully`);
            } else {
                await api.post('/students', formData);
                showToast('Enrolled!', 'success', `${formData.full_name} added to directory`);
            }
            setIsModalOpen(false);
            setSelectedStudent(null);
            fetchStudents();
        } catch (error) {
            console.error('Submit failed:', error);
            showToast('Save failed', 'error', error.response?.data?.message || 'Failed to save');
        }
    }, [selectedStudent, fetchStudents, showToast]);

    const resetFilters = useCallback(() => {
        setFilters({ grade: '', bus_id: '', transport_status: '' });
        setSearchQuery('');
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Students
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Manage student records, class assignments, and ID cards
                    </p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={handleAdd}
                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                    >
                        <Plus size={18} className="mr-2" />
                        Add Student
                    </Button>
                )}
            </div>

            {/* Filters Section - Hide for non-admin users */}
            {(isAdmin || isTeacher) && (
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, student ID, or admission number..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[140px]"
                            value={filters.grade}
                            onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                        >
                            <option value="">All Classes</option>
                            {options.grades.map(grade => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                            ))}
                        </select>

                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[140px]"
                            value={filters.transport_status}
                            onChange={(e) => setFilters(prev => ({ ...prev, transport_status: e.target.value }))}
                        >
                            <option value="">All Transport</option>
                            <option value="bus">Using Bus</option>
                            <option value="self">Self/Private</option>
                        </select>

                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[140px]"
                            value={filters.bus_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, bus_id: e.target.value }))}
                        >
                            <option value="">All Buses</option>
                            {options.buses.map(bus => (
                                <option key={bus._id} value={bus._id}>{bus.vehicle_number}</option>
                            ))}
                        </select>

                        <button
                            onClick={resetFilters}
                            className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-xl transition-all"
                            title="Reset Filters"
                            aria-label="Reset all filters"
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Results count */}
            {!loading && (isAdmin || isTeacher) && (
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Showing {filteredStudents.length} of {students.length} students
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Student ID
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Full Name
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Class & Section
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Contact
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Date of Birth
                                </th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-24 text-center">
                                        <div className="flex flex-col items-center space-y-3 text-slate-300 dark:text-slate-600">
                                            <Search size={48} strokeWidth={1} />
                                            <p className="text-lg font-medium">No students found</p>
                                            <p className="text-sm">Try adjusting your filters or search query</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <StudentRow
                                        key={student._id}
                                        student={student}
                                        isAdmin={isAdmin}
                                        isTeacher={isTeacher}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        formatDate={formatDate}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isAdmin && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedStudent(null);
                    }}
                    title={selectedStudent ? 'Edit Student Profile' : 'Add New Student'}
                >
                    <StudentForm
                        initialData={selectedStudent}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setIsModalOpen(false);
                            setSelectedStudent(null);
                        }}
                    />
                </Modal>
            )}

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingStudent(null);
                }}
                title="Student Details"
            >
                {viewingStudent && (
                    <StudentDetails
                        student={viewingStudent}
                        onClose={() => {
                            setIsViewModalOpen(false);
                            setViewingStudent(null);
                        }}
                        formatDate={formatDate}
                        canGenerateIDCard={canGenerateIDCard}
                    />
                )}
            </Modal>

        </div>
    );
};

// Student Row Component
const StudentRow = ({ student, isAdmin, isTeacher, onView, onEdit, onDelete, formatDate }) => {
    const handleRowClick = () => onView(student);

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(student);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(student._id, student.full_name);
    };

    const handleViewClick = (e) => {
        e.stopPropagation();
        onView(student);
    };

    const canGenerateIDCard = isAdmin || isTeacher;

    return (
        <tr
            onClick={handleRowClick}
            className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer"
        >
            <td className="px-6 py-5">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {student.student_id || '---'}
                </span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/5 ring-4 ring-white dark:ring-slate-900 shadow-sm flex-shrink-0">
                        {student.documents?.photo_url ? (
                            <img
                                src={student.documents.photo_url}
                                alt={student.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {student.full_name}
                    </span>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-400/20">
                        {student.class_info?.grade}th - {student.class_info?.section}
                    </span>
                    {student.transport?.is_using_bus && (
                        <div
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                            title={`Bus: ${student.transport.bus_id?.vehicle_number || 'Assigned'}`}
                        >
                            <Truck size={12} strokeWidth={3} />
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {student.contact_info?.phone || student.parent_details?.primary_contact || '---'}
                </span>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {formatDate(student.dob)}
                </span>
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={handleViewClick}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                        aria-label="View student details"
                    >
                        <Eye size={18} strokeWidth={2.5} />
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                onClick={handleEditClick}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                aria-label="Edit student"
                            >
                                <Edit size={18} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                aria-label="Delete student"
                            >
                                <Trash size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

// Student Details Component
const StudentDetails = ({ student, onClose, formatDate, canGenerateIDCard }) => {
    return (
        <div className="space-y-8 max-h-[80vh] overflow-y-auto px-2 py-4">
            {/* Header with Photo */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 rounded-[2rem] bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800 flex-shrink-0">
                    {student.documents?.photo_url ? (
                        <img
                            src={student.documents.photo_url}
                            alt={student.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User size={48} />
                        </div>
                    )}
                </div>
                <div className="space-y-2 flex-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {student.full_name}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {student.student_id}
                        </span>
                    </div>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-bold mt-4">
                        <MapPin size={16} className="mr-2 text-indigo-500" />
                        {student.address?.permanent?.city || student.address || 'Location Not Set'}
                    </div>

                </div>
            </div>

            {/* Academic & Transport Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Info */}
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center">
                        <GraduationCap size={14} className="mr-2" /> Academic Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Class" value={`${student.class_info?.grade} - ${student.class_info?.section}`} />
                        <InfoItem label="Aadhaar" value={student.aadhaar_number} />
                        <InfoItem label="DOB" value={formatDate(student.dob)} />
                        <InfoItem label="Gender" value={student.gender} />
                        <InfoItem label="Blood Group" value={student.blood_group} />
                        <InfoItem label="Religion" value={student.religion} />
                        <InfoItem label="Nationality" value={student.nationality} />
                    </div>
                </div>

                {/* Transport Info */}
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center">
                        <Truck size={14} className="mr-2" /> Transport Status
                    </h4>
                    {student.transport?.is_using_bus ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-500/10">
                                <span className="text-xs font-bold">Assigned Bus</span>
                                <span className="text-xs font-black text-emerald-600">
                                    {student.transport.bus_id?.vehicle_number || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-500/10">
                                <span className="text-xs font-bold">Pick-up Stop</span>
                                <span className="text-xs font-black text-indigo-600">
                                    {student.transport.stop_name || 'N/A'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-20 text-slate-400 italic">
                            <p className="text-xs font-bold">Self Transport</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Guardian Details */}
            <div className="p-8 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-500/10">
                <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center">
                    <Shield size={16} className="mr-2" /> Guardian Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GuardianCard
                        type="father"
                        name={student.parent_details?.father_name}
                        phone={student.parent_details?.father_phone}
                        occupation={student.parent_details?.father_occupation}
                        color="indigo"
                    />
                    <GuardianCard
                        type="mother"
                        name={student.parent_details?.mother_name}
                        phone={student.parent_details?.mother_phone}
                        occupation={student.parent_details?.mother_occupation}
                        color="rose"
                    />
                </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
                <Button
                    variant="secondary"
                    onClick={onClose}
                    className="px-8 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                    Close
                </Button>
            </div>
        </div>
    );
};

// Helper Components
const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
        <p className="font-bold text-slate-900 dark:text-white">{value || '---'}</p>
    </div>
);

const GuardianCard = ({ type, name, phone, occupation, color }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-${color}-500 shadow-sm border border-${color}-100/50`}>
                <User size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">
                    {type === 'father' ? "Father's Details" : "Mother's Details"}
                </p>
                <p className="font-extrabold text-slate-900 dark:text-white text-base">
                    {name || '---'}
                </p>
                <p className={`text-sm font-bold text-${color}-600`}>
                    {phone || '---'}
                </p>
                <p className="text-[10px] font-black text-slate-500 uppercase mt-1">
                    {occupation || 'Occupation N/A'}
                </p>
            </div>
        </div>
    </div>
);

export default StudentManagement;