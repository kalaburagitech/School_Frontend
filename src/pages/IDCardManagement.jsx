import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    Search, Filter, CreditCard, User,
    GraduationCap, Briefcase, Truck, Users,
    Download, Printer, ChevronRight, CheckCircle2
} from 'lucide-react';
import IDCardGenerator from '../components/IDCardGenerator';
import Button from '../components/ui/Button';
import clsx from 'clsx';

const IDCardManagement = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeType, setActiveType] = useState('student');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPeople, setSelectedPeople] = useState([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [previewPerson, setPreviewPerson] = useState(null);

    // Data states
    const [students, setStudents] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filterClass, setFilterClass] = useState('all');
    const [options, setOptions] = useState({ grades: [] });

    // Access control: owner, admin, principal
    const canAccess = ['owner', 'admin', 'principal'].includes(user?.role);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeType === 'student') {
                const res = await api.get('/students');
                setStudents(res.data);
                const uniqueGrades = [...new Set(res.data.map(s => s.class_info?.grade).filter(Boolean))].sort((a, b) => a - b);
                setOptions({ grades: uniqueGrades });
            } else {
                const [teachersRes, driversRes, staffRes] = await Promise.all([
                    api.get('/teachers'),
                    api.get('/drivers'),
                    api.get('/users?role=admin,owner,principal,staff')
                ]);

                const normalize = (data, type) => data.map(item => ({
                    ...item,
                    type,
                    displayType: type === 'staff' ? (item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'Staff') : type.charAt(0).toUpperCase() + type.slice(1)
                }));

                const allEmps = [
                    ...normalize(teachersRes.data, 'teacher'),
                    ...normalize(driversRes.data, 'driver'),
                    ...normalize(staffRes.data.users || staffRes.data, 'staff')
                ];
                setEmployees(allEmps);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast('Error', 'error', 'Failed to load records.');
        } finally {
            setLoading(false);
        }
    }, [activeType, showToast]);

    useEffect(() => {
        if (canAccess) fetchData();
    }, [fetchData, canAccess]);

    const filteredList = useMemo(() => {
        const list = activeType === 'student' ? students : employees;
        return list.filter(person => {
            const name = (person.full_name || person.name || '').toLowerCase();
            const idValue = (person.student_id || person.teacher_id || person.employee_id || person.driver_id || person.id || person._id || '').toLowerCase();
            const matchesSearch = name.includes(searchQuery.toLowerCase()) || idValue.includes(searchQuery.toLowerCase());

            if (activeType === 'student' && filterClass !== 'all') {
                return matchesSearch && person.class_info?.grade === filterClass;
            }
            return matchesSearch;
        });
    }, [activeType, students, employees, searchQuery, filterClass]);

    const toggleSelection = (person) => {
        const idValue = person.student_id || person.teacher_id || person.employee_id || person.driver_id || person._id;
        setSelectedPeople(prev =>
            prev.includes(idValue) ? prev.filter(i => i !== idValue) : [...prev, idValue]
        );
    };

    const handlePreview = (person) => {
        setPreviewPerson(person);
        setIsGeneratorOpen(true);
    };

    if (!canAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <CreditCard size={64} className="mb-4 opacity-20" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p>Only Owner, Admin, and Principal can manage ID cards.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/5">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest">
                        <CreditCard size={14} />
                        ID Card Hub
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        ID Card Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Generate and manage identification for all school members
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setActiveType('student')}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
                                activeType === 'student' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xl" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <GraduationCap size={18} />
                            STUDENTS
                        </button>
                        <button
                            onClick={() => setActiveType('employee')}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
                                activeType === 'employee' ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-xl" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <Briefcase size={18} />
                            EMPLOYEES
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${activeType}s by name or ID...`}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {activeType === 'student' && (
                    <select
                        className="w-full md:w-48 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="all">All Classes</option>
                        {options.grades.map(g => (
                            <option key={g} value={g}>Grade {g}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Selection Info */}
            {selectedPeople.length > 0 && (
                <div className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-white">
                            {selectedPeople.length}
                        </div>
                        <p className="font-bold">Items selected for bulk action</p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-white text-indigo-600 hover:bg-slate-50 rounded-xl font-black text-xs uppercase" onClick={() => showToast('Coming Soon', 'info', 'Bulk download is being optimized.')}>
                            <Download size={16} className="mr-2" /> Download All
                        </Button>
                        <button
                            onClick={() => setSelectedPeople([])}
                            className="text-white/70 hover:text-white px-4 font-bold text-xs uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-white/5 animate-pulse rounded-[2rem]"></div>
                    ))
                ) : filteredList.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-300 dark:border-white/10">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Users size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">No records found</h3>
                        <p className="text-slate-400">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredList.map(person => {
                        const personId = person.student_id || person.teacher_id || person.employee_id || person.driver_id || person._id;
                        const isSelected = selectedPeople.includes(personId);
                        const photo = person.documents?.photo_url || person.photo || person.photo_url;

                        return (
                            <div
                                key={personId}
                                className={clsx(
                                    "group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
                                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200 dark:border-white/5"
                                )}
                                onClick={() => toggleSelection(person)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden border-2 border-slate-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
                                            {photo ? (
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <User size={32} />
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg ring-2 ring-white dark:ring-slate-900 scale-110 animate-in zoom-in">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                activeType === 'student' ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                                            )}>
                                                {person.displayType || (activeType === 'student' ? `${person.class_info?.grade}th` : 'Employee')}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-slate-900 dark:text-white truncate">
                                            {person.full_name || person.name}
                                        </h3>
                                        <p className="text-xs font-mono font-bold text-slate-400 tracking-wider">
                                            {personId}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Preview Card
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(person);
                                        }}
                                        className="w-10 h-10 bg-slate-100 dark:bg-white/5 hover:bg-indigo-600 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div> */}

            {/* TABLE VIEW */}
            <table className="w-full border-collapse bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                        <th className="p-4 text-left">Name</th>
                        <th className="p-4">ID</th>
                        {activeType === "student" && <th className="p-4">Class</th>}
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredList.map(person => (
                        <tr key={person._id} className="border-t hover:bg-slate-50 dark:hover:bg-white/5">
                            <td className="p-4 font-bold">{person.full_name || person.name}</td>
                            <td className="p-4 font-mono text-xs">{person.student_id || person.teacher_id}</td>
                            {activeType === "student" && (
                                <td className="p-4">{person.class_info?.grade}</td>
                            )}
                            <td className="p-4 uppercase text-xs">{person.displayType}</td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => handlePreview(person)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs"
                                >
                                    Preview
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>


            {/* Generator Modal */}
            {isGeneratorOpen && previewPerson && (
                <IDCardGenerator
                    person={previewPerson}
                    type={activeType === 'student' ? 'student' : previewPerson.type || 'employee'}
                    onClose={() => {
                        setIsGeneratorOpen(false);
                        setPreviewPerson(null);
                    }}
                />
            )}
        </div>
    );
};

export default IDCardManagement;
