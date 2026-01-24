import { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import Button from './ui/Button';
import clsx from 'clsx';
import { useToast } from '../context/ToastContext';

const MarkAttendanceModal = ({ isOpen, onClose, selectedClass, onSuccess }) => {
    const { showToast } = useToast();
    const [attendanceType, setAttendanceType] = useState('student');
    const [classInfo, setClassInfo] = useState(selectedClass ? {
        grade: selectedClass.grade,
        section: selectedClass.section.toUpperCase()
    } : { grade: '', section: '' });
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && attendanceType === 'student' && classInfo.grade && classInfo.section) {
            fetchStudents();
        }
    }, [isOpen, attendanceType, classInfo]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch students for the class
            const studentsRes = await api.get(`/students?grade=${classInfo.grade}&section=${classInfo.section}`);
            const studentList = studentsRes.data.students || studentsRes.data;
            setStudents(studentList);

            // Fetch existing attendance for TODAY to see if we are editing
            const today = new Date().toISOString().split('T')[0];
            const attendanceRes = await api.get(`/attendance/class/${classInfo.grade}/${classInfo.section}?startDate=${today}&endDate=${today}`);

            const existingRecords = attendanceRes.data.records || [];
            const initialRecords = {};

            if (existingRecords.length > 0) {
                // EDIT MODE: Pre-fill with existing status
                studentList.forEach(student => {
                    const record = existingRecords.find(r => r.student_id?._id === student._id || r.student_id === student._id);
                    initialRecords[student._id] = record ? record.status : 'Present';
                });
                showToast(`Editing existing attendance for ${today}`, 'info');
            } else {
                // NEW MODE: Default to Present
                studentList.forEach(student => {
                    initialRecords[student._id] = 'Present';
                });
            }

            setAttendanceRecords(initialRecords);
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load class data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkStatus = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleBulkAction = (status) => {
        const updated = {};
        students.forEach(student => {
            updated[student._id] = status;
        });
        setAttendanceRecords(updated);
    };

    const handleSubmit = async () => {
        if (attendanceType === 'student' && students.length === 0) {
            showToast('No students to mark attendance for', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const records = students.map(student => ({
                student_id: student._id,
                status: attendanceRecords[student._id] || 'Present',
                class_info: {
                    grade: classInfo.grade,
                    section: classInfo.section
                }
            }));

            await api.post('/attendance/mark', {
                date: new Date().toISOString().split('T')[0],
                class_info: classInfo,
                records,
                attendance_type: 'student'
            });

            showToast('Attendance saved successfully', 'success');
            onSuccess();
        } catch (error) {
            console.error('Failed to mark attendance:', error);
            showToast(error.response?.data?.message || 'Failed to mark attendance', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const getStatusCount = (status) => {
        return Object.values(attendanceRecords).filter(s => s === status).length;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Mark Attendance</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Type Selection */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setAttendanceType('student')}
                            className={clsx(
                                "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all",
                                attendanceType === 'student'
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                        >
                            <Users size={18} className="inline mr-2" />
                            Student Attendance
                        </button>
                        {/* 
                         Teacher Self-Attendance disabled as per requirement for now
                        <button
                            onClick={() => setAttendanceType('teacher')}
                            className={clsx( ... )}
                        > ... </button> 
                        */}
                    </div>
                </div>

                {attendanceType === 'student' && (
                    <>
                        {/* Class Selection */}
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                            {/* Edit Mode Banner */}
                            {Object.keys(attendanceRecords).length > 0 && students.length > 0 && (
                                <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-lg flex items-center gap-2">
                                    <Clock size={16} />
                                    {attendanceRecords[students[0]?._id] // simplistic check if logic was "Edit"
                                        ? "Reviewing Class Attendance"
                                        : "Marking New Attendance"}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Grade</label>
                                    <select
                                        value={classInfo.grade}
                                        onChange={(e) => !selectedClass && setClassInfo({ ...classInfo, grade: e.target.value })}
                                        disabled={!!selectedClass}
                                        className={clsx(
                                            "w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white",
                                            selectedClass
                                                ? "border-slate-100 dark:border-white/5 opacity-70 cursor-not-allowed"
                                                : "border-slate-200 dark:border-white/10"
                                        )}
                                    >
                                        <option value="">Select Grade</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                                            <option key={g} value={g}>Grade {g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Section</label>
                                    <select
                                        value={classInfo.section}
                                        onChange={(e) => !selectedClass && setClassInfo({ ...classInfo, section: e.target.value })}
                                        disabled={!!selectedClass}
                                        className={clsx(
                                            "w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white",
                                            selectedClass
                                                ? "border-slate-100 dark:border-white/5 opacity-70 cursor-not-allowed"
                                                : "border-slate-200 dark:border-white/10"
                                        )}
                                    >
                                        <option value="">Select Section</option>
                                        {['A', 'B', 'C', 'D', 'E'].map(s => (
                                            <option key={s} value={s}>Section {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Summary & Bulk Actions */}
                        {students.length > 0 && (
                            <div className="px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-indigo-50 dark:bg-indigo-950/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="text-xs">
                                            <span className="font-bold text-green-600">{getStatusCount('Present')}</span>
                                            <span className="text-slate-600 dark:text-slate-400 ml-1">Present</span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="font-bold text-red-600">{getStatusCount('Absent')}</span>
                                            <span className="text-slate-600 dark:text-slate-400 ml-1">Absent</span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="font-bold text-yellow-600">{getStatusCount('Late')}</span>
                                            <span className="text-slate-600 dark:text-slate-400 ml-1">Late</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleBulkAction('Present')}
                                            className="px-2 py-1 bg-green-500 text-white rounded text-[10px] font-bold hover:bg-green-600 transition-all uppercase tracking-wide"
                                        >
                                            Mark All Present
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('Absent')}
                                            className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600 transition-all uppercase tracking-wide"
                                        >
                                            Mark All Absent
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    {classInfo.grade && classInfo.section ? 'No students found in this class' : 'Please select a class'}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {students.map(student => (
                                        <div
                                            key={student._id}
                                            className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                {student.photo_url ? (
                                                    <img src={student.photo_url} alt={student.full_name} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                        {student.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{student.full_name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{student.student_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleMarkStatus(student._id, 'Present')}
                                                    className={clsx(
                                                        "w-8 h-8 rounded flex items-center justify-center font-bold text-xs transition-all",
                                                        attendanceRecords[student._id] === 'Present'
                                                            ? "bg-green-500 text-white shadow-sm"
                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-green-500 hover:text-white"
                                                    )}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    onClick={() => handleMarkStatus(student._id, 'Absent')}
                                                    className={clsx(
                                                        "w-8 h-8 rounded flex items-center justify-center font-bold text-xs transition-all",
                                                        attendanceRecords[student._id] === 'Absent'
                                                            ? "bg-red-500 text-white shadow-sm"
                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-500 hover:text-white"
                                                    )}
                                                >
                                                    A
                                                </button>
                                                <button
                                                    onClick={() => handleMarkStatus(student._id, 'Late')}
                                                    className={clsx(
                                                        "w-8 h-8 rounded flex items-center justify-center font-bold text-xs transition-all",
                                                        attendanceRecords[student._id] === 'Late'
                                                            ? "bg-yellow-500 text-white shadow-sm"
                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-yellow-500 hover:text-white"
                                                    )}
                                                >
                                                    L
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {attendanceType === 'teacher' && (
                    <div className="flex-1 p-12 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">Teacher self-attendance feature coming soon</p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Mark your own attendance for today</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 bg-slate-50 dark:bg-white/[0.02]">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={attendanceType === 'student' && students.length === 0}
                    >
                        Save Attendance
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MarkAttendanceModal;
