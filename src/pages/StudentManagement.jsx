import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash, Search, Filter, MoreVertical, User, Truck, Phone, Eye, Mail, MapPin, Calendar, Shield, GraduationCap } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StudentForm from '../components/StudentForm';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';

const StudentManagement = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        grade: '',
        route_id: '',
        bus_id: '',
        transport_status: ''
    });
    const [options, setOptions] = useState({
        grades: [],
        routes: [],
        buses: []
    });

    const isAdmin = user?.role === 'admin';

    const fetchStudents = async () => {
        try {
            const [{ data: studentsData }, { data: busesData }, { data: routesData }] = await Promise.all([
                api.get('/students'),
                api.get('/buses'),
                api.get('/routes')
            ]);

            setStudents(studentsData);
            setOptions({
                grades: [...new Set(studentsData.map(s => s.class_info?.grade).filter(Boolean))].sort(),
                buses: busesData,
                routes: routesData
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleAdd = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await api.delete(`/students/${id}`);
                showToast('Student deleted successfully', 'success', 'The student record has been removed from the directory.');
                fetchStudents();
            } catch (error) {
                console.error('Delete failed', error);
                showToast('Failed to delete student', 'error', error.response?.data?.message || 'A server error occurred.');
            }
        }
    };

    const handleSubmit = async (formData) => {
        try {
            if (selectedStudent) {
                await api.put(`/students/${selectedStudent._id}`, formData);
                showToast('Successfully updated!', 'success', `Details for ${formData.full_name} have been saved.`);
            } else {
                await api.post('/students', formData);
                showToast('Successfully enrolled!', 'success', `${formData.full_name} is now part of the directory.`);
            }
            setIsModalOpen(false);
            fetchStudents();
        } catch (error) {
            console.error('Submit failed', error);
            const msg = error.response?.data?.message || error.message || 'Failed to save student.';
            showToast('Save failed', 'error', msg);
        }
    };

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingStudent, setViewingStudent] = useState(null);

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesGrade = !filters.grade || s.class_info?.grade === filters.grade;
        const matchesBus = !filters.bus_id || s.transport?.bus_id?._id === filters.bus_id || s.transport?.bus_id === filters.bus_id;
        const matchesTransport = !filters.transport_status ||
            (filters.transport_status === 'bus' ? s.transport?.is_using_bus : !s.transport?.is_using_bus);

        return matchesSearch && matchesGrade && matchesBus && matchesTransport;
    });

    const handleView = (student) => {
        setViewingStudent(student);
        setIsViewModalOpen(true);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Students</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">A list of all students including their name, class, academic ID and transport role.</p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }}
                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                    >
                        Add student
                    </Button>
                )}
            </div>

            <div className="flex flex-col space-y-6">
                {/* Filters Section */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or roll..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer min-w-[140px]"
                            value={filters.grade}
                            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                        >
                            <option value="">All Classes</option>
                            {options.grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer min-w-[140px]"
                            value={filters.transport_status}
                            onChange={(e) => setFilters({ ...filters, transport_status: e.target.value })}
                        >
                            <option value="">All Transport</option>
                            <option value="bus">Using Bus</option>
                            <option value="self">Self/Private</option>
                        </select>
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer min-w-[140px]"
                            value={filters.bus_id}
                            onChange={(e) => setFilters({ ...filters, bus_id: e.target.value })}
                        >
                            <option value="">All Fleets</option>
                            {options.buses.map(b => (
                                <option key={b._id} value={b._id}>{b.vehicle_number}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setFilters({ grade: '', route_id: '', bus_id: '', transport_status: '' })}
                            className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-xl transition-all"
                            title="Reset Filters"
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student ID</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Section</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Contact</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">DOB</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4"><div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl"></div></td>
                                    </tr>
                                ))
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="6" className="p-24 text-center">
                                    <div className="flex flex-col items-center space-y-3 text-slate-300 dark:text-slate-600">
                                        <Search size={48} strokeWidth={1} />
                                        <p className="text-lg font-medium">No results matched your search</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr
                                        key={student._id}
                                        onClick={() => handleView(student)}
                                        className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer border-b border-slate-50 dark:border-white/5"
                                    >
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{student.student_id || '---'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/5 ring-4 ring-white dark:ring-slate-900 shadow-sm">
                                                    {student.documents?.photo_url ? (
                                                        <img src={student.documents.photo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-[10px]">No Photo</div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{student.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-400/20">
                                                    {student.class_info?.grade}th Class - {student.class_info?.section}
                                                </span>
                                                {student.transport?.is_using_bus && (
                                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-500/20" title={`Bus: ${student.transport.bus_id?.vehicle_number || 'Assigned'}`}>
                                                        <Truck size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{student.contact_info?.phone || student.parent_details?.primary_contact || '---'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleView(student); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                                >
                                                    <Eye size={18} strokeWidth={2.5} />
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(student); }}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                                        >
                                                            <Edit size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(student._id); }}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Registration Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedStudent ? 'Modify Academic Profile' : 'Professional Enrollment'}
            >
                <StudentForm
                    initialData={selectedStudent}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Student Academic Record"
            >
                {viewingStudent && (
                    <div className="space-y-8 max-h-[80vh] overflow-y-auto px-2 scrollbar-hide py-4">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-32 h-32 rounded-[2rem] bg-slate-100 overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800 flex-shrink-0">
                                {viewingStudent.documents?.photo_url ? (
                                    <img src={viewingStudent.documents.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={48} /></div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{viewingStudent.full_name}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{viewingStudent.student_id}</span>
                                </div>
                                <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-bold mt-4">
                                    <MapPin size={16} className="mr-2 text-indigo-500" />
                                    {viewingStudent.address?.permanent?.city || viewingStudent.address || 'Location Not Set'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center">
                                    <GraduationCap size={14} className="mr-2" /> Academic Profile
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Class</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.class_info?.grade} - {viewingStudent.class_info?.section}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Aadhaar</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.aadhaar_number || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">DOB</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.dob ? new Date(viewingStudent.dob).toLocaleDateString() : '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Gender</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Blood Group</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.blood_group || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Religion</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.religion || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Nationality</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{viewingStudent.nationality || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center">
                                    <Truck size={14} className="mr-2" /> Transport Status
                                </h4>
                                {viewingStudent.transport?.is_using_bus ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-500/10">
                                            <span className="text-xs font-bold">Assigned Bus</span>
                                            <span className="text-xs font-black text-emerald-600">{viewingStudent.transport.bus_id?.vehicle_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-500/10">
                                            <span className="text-xs font-bold">Pick-up Stop</span>
                                            <span className="text-xs font-black text-indigo-600">{viewingStudent.transport.stop_name || 'N/A'}</span>
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
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/50">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Father's Details</p>
                                            <p className="font-extrabold text-slate-900 dark:text-white text-base">{viewingStudent.parent_details?.father_name || '---'}</p>
                                            <p className="text-sm font-bold text-indigo-600">{viewingStudent.parent_details?.father_phone || '---'}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{viewingStudent.parent_details?.father_occupation || 'Occupation N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100/50">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Mother's Details</p>
                                            <p className="font-extrabold text-slate-900 dark:text-white text-base">{viewingStudent.parent_details?.mother_name || '---'}</p>
                                            <p className="text-sm font-bold text-rose-600">{viewingStudent.parent_details?.mother_phone || '---'}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{viewingStudent.parent_details?.mother_occupation || 'Occupation N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)} className="px-8 rounded-2xl font-black uppercase tracking-widest text-xs">
                                Close Record
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentManagement;
