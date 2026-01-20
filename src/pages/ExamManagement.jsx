import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Plus, Search, Filter, Calendar, FileText, Award, TrendingUp,
    Edit, Trash2, Eye, CheckCircle, XCircle, Clock
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const ExamManagement = () => {
    const { theme } = useTheme();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [filter, setFilter] = useState({ academic_year: '2025-2026', term: '', status: '' });
    const [formData, setFormData] = useState({
        exam_id: '',
        exam_name: '',
        exam_type: 'Mid-Term',
        academic_year: '2025-2026',
        term: 'Term 1',
        classes: [],
        start_date: '',
        end_date: '',
        total_marks: '',
        passing_marks: '',
        subjects: [],
        description: ''
    });

    useEffect(() => {
        fetchExams();
    }, [filter]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filter);
            const response = await api.get(`/exams?${params}`);
            setExams(response.data);
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedExam) {
                await api.put(`/exams/${selectedExam._id}`, formData);
            } else {
                await api.post('/exams', formData);
            }
            setShowModal(false);
            fetchExams();
            resetForm();
        } catch (error) {
            console.error('Failed to save exam:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this exam?')) {
            try {
                await api.delete(`/exams/${id}`);
                fetchExams();
            } catch (error) {
                console.error('Failed to delete exam:', error);
            }
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const resetForm = () => {
        setFormData({
            exam_id: '',
            exam_name: '',
            exam_type: 'Mid-Term',
            academic_year: '2025-2026',
            term: 'Term 1',
            classes: [],
            start_date: '',
            end_date: '',
            total_marks: '',
            passing_marks: '',
            subjects: [],
            description: ''
        });
        setSelectedExam(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-500/10 text-blue-500';
            case 'Ongoing': return 'bg-yellow-500/10 text-yellow-500';
            case 'Completed': return 'bg-green-500/10 text-green-500';
            case 'Cancelled': return 'bg-red-500/10 text-red-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={clsx(
                        "text-3xl font-bold mb-2",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                        Exams Management
                    </h1>
                    <p className={clsx(
                        "text-sm",
                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                    )}>
                        Schedule, manage, and track all examinations
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Create Exam</span>
                </Button>
            </div>

            {/* Filters */}
            <div className={clsx(
                "p-6 rounded-2xl border",
                theme === 'dark'
                    ? "bg-slate-800/50 border-white/5"
                    : "bg-white border-slate-200"
            )}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={clsx(
                            "block text-sm font-medium mb-2",
                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                        )}>
                            Academic Year
                        </label>
                        <select
                            value={filter.academic_year}
                            onChange={(e) => setFilter({ ...filter, academic_year: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2.5 rounded-xl border transition-colors",
                                theme === 'dark'
                                    ? "bg-slate-700 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="">All Years</option>
                            <option value="2025-2026">2025-2026</option>
                            <option value="2024-2025">2024-2025</option>
                        </select>
                    </div>
                    <div>
                        <label className={clsx(
                            "block text-sm font-medium mb-2",
                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                        )}>
                            Term
                        </label>
                        <select
                            value={filter.term}
                            onChange={(e) => setFilter({ ...filter, term: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2.5 rounded-xl border transition-colors",
                                theme === 'dark'
                                    ? "bg-slate-700 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="">All Terms</option>
                            <option value="Term 1">Term 1</option>
                            <option value="Term 2">Term 2</option>
                            <option value="Term 3">Term 3</option>
                        </select>
                    </div>
                    <div>
                        <label className={clsx(
                            "block text-sm font-medium mb-2",
                            theme === 'dark' ? "text-slate-300" : "text-slate-700"
                        )}>
                            Status
                        </label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            className={clsx(
                                "w-full px-4 py-2.5 rounded-xl border transition-colors",
                                theme === 'dark'
                                    ? "bg-slate-700 border-white/10 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                            )}
                        >
                            <option value="">All Status</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Exams Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam) => (
                        <div
                            key={exam._id}
                            className={clsx(
                                "p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg",
                                theme === 'dark'
                                    ? "bg-slate-800/50 border-white/5 hover:bg-slate-800/70"
                                    : "bg-white border-slate-200 hover:shadow-xl"
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className={clsx(
                                        "text-lg font-bold mb-1",
                                        theme === 'dark' ? "text-white" : "text-slate-900"
                                    )}>
                                        {exam.exam_name}
                                    </h3>
                                    <p className={clsx(
                                        "text-sm",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                                    )}>
                                        {exam.exam_type} • {exam.term}
                                    </p>
                                </div>
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-medium",
                                    getStatusColor(exam.status)
                                )}>
                                    {exam.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
                                        Start Date
                                    </span>
                                    <span className={theme === 'dark' ? "text-white" : "text-slate-900"}>
                                        {new Date(exam.start_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
                                        End Date
                                    </span>
                                    <span className={theme === 'dark' ? "text-white" : "text-slate-900"}>
                                        {new Date(exam.end_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
                                        Total Marks
                                    </span>
                                    <span className={theme === 'dark' ? "text-white" : "text-slate-900"}>
                                        {exam.total_marks}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={() => {
                                        setSelectedExam(exam);
                                        setFormData({
                                            ...exam,
                                            start_date: formatDate(exam.start_date),
                                            end_date: formatDate(exam.end_date)
                                        });
                                        setShowModal(true);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Edit size={16} />
                                </Button>
                                <Button
                                    onClick={() => handleDelete(exam._id)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={clsx(
                    "p-12 rounded-2xl border text-center",
                    theme === 'dark'
                        ? "bg-slate-800/50 border-white/5"
                        : "bg-white border-slate-200"
                )}>
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p className={clsx(
                        "text-lg",
                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                    )}>
                        No exams found
                    </p>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={selectedExam ? 'Edit Exam' : 'Create New Exam'}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Exam Name</label>
                            <input
                                type="text"
                                value={formData.exam_name}
                                onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                                className={clsx(
                                    "w-full px-4 py-2.5 rounded-xl border",
                                    theme === 'dark'
                                        ? "bg-slate-700 border-white/10 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                )}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Exam Type</label>
                            <select
                                value={formData.exam_type}
                                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                                className={clsx(
                                    "w-full px-4 py-2.5 rounded-xl border",
                                    theme === 'dark'
                                        ? "bg-slate-700 border-white/10 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                )}
                            >
                                <option value="Mid-Term">Mid-Term</option>
                                <option value="Final">Final</option>
                                <option value="Unit Test">Unit Test</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Annual">Annual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className={clsx(
                                    "w-full px-4 py-2.5 rounded-xl border",
                                    theme === 'dark'
                                        ? "bg-slate-700 border-white/10 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                )}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">End Date</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className={clsx(
                                    "w-full px-4 py-2.5 rounded-xl border",
                                    theme === 'dark'
                                        ? "bg-slate-700 border-white/10 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                )}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Total Marks</label>
                            <input
                                type="number"
                                value={formData.total_marks}
                                onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                                className={clsx(
                                    "w-full px-4 py-2.5 rounded-xl border",
                                    theme === 'dark'
                                        ? "bg-slate-700 border-white/10 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                )}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Passing Marks</label>
                            <input
                                type="number"
                                value={formData.passing_marks}
                                onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
                                className={clsx(
                                    "w-full px-4 py-2.5 rounded-xl border",
                                    theme === 'dark'
                                        ? "bg-slate-700 border-white/10 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                )}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {selectedExam ? 'Update Exam' : 'Create Exam'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ExamManagement;
