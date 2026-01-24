import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import {
    Users, CheckCircle, XCircle, Clock,
    TrendingUp, TrendingDown, BarChart3, ChevronRight,
    FileSpreadsheet, Filter, History, Plus
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../components/ui/Button';
import MarkAttendanceModal from '../components/MarkAttendanceModal';
import AttendanceHistoryModal from '../components/AttendanceHistoryModal';
import { socket } from '../context/AuthContext';

const AttendanceDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [classSummary, setClassSummary] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classDetails, setClassDetails] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    // Reporting States
    const [reportRange, setReportRange] = useState('today');
    const [isDownloading, setIsDownloading] = useState(false);

    // Initial data fetch
    useEffect(() => {
        fetchData();

        // Real-time updates
        const handleUpdate = (data) => {
            console.log('Real-time attendance update:', data);

            // Refresh Summary
            fetchClassSummary();

            // Refresh Detail if open
            if (selectedClass &&
                selectedClass.grade == data.class_info.grade &&
                selectedClass.section.toLowerCase() === data.class_info.section.toLowerCase()) {
                fetchClassDetails(selectedClass.grade, selectedClass.section);
            }
        };

        socket.on('attendance_update', handleUpdate);
        return () => {
            socket.off('attendance_update', handleUpdate);
        };
    }, []); // Empty dependency array = run once on mount

    // Re-fetch when filters change (for analytics/summary if they depended on it, but here mainly for local state)
    useEffect(() => {
        if (reportRange !== 'today') {
            // If we want the summary cards to reflect the range, we'd need backend support.
            // Currently backend summary is "Today" based. 
            // For now, we'll keep summary as "Today's Status" but update Analytics.
            fetchAnalytics();
        }
    }, [reportRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchClassSummary(),
                fetchAnalytics()
            ]);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassSummary = async () => {
        try {
            const { data } = await api.get('/attendance/summary');
            setClassSummary(data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            let days = 1;
            if (reportRange === 'week') days = 7;
            if (reportRange === 'month') days = 30;

            const { data } = await api.get(`/attendance/analytics?days=${days}`);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const fetchClassDetails = async (grade, section) => {
        try {
            const { data } = await api.get(`/attendance/class/${grade}/${section}?detailed=true`);
            setClassDetails(data);
        } catch (error) {
            console.error('Failed to fetch class details:', error);
        }
    };

    // When a class is selected, fetch its details
    useEffect(() => {
        if (selectedClass) {
            fetchClassDetails(selectedClass.grade, selectedClass.section);
        } else {
            setClassDetails(null);
        }
    }, [selectedClass]);

    const filteredStudents = useMemo(() => {
        if (!classDetails?.students) return [];
        if (filterStatus === 'all') return classDetails.students;
        return classDetails.students.filter(student => {
            if (filterStatus === 'present') return parseFloat(student.percentage) >= 75;
            if (filterStatus === 'warning') return parseFloat(student.percentage) < 75 && parseFloat(student.percentage) >= 50;
            if (filterStatus === 'critical') return parseFloat(student.percentage) < 50;
            return true;
        });
    }, [classDetails, filterStatus]);

    const downloadReport = async () => {
        setIsDownloading(true);
        try {
            let query = `format=excel`;
            const today = new Date();
            let start, end;

            if (reportRange === 'today') {
                start = end = today.toISOString().split('T')[0];
            } else if (reportRange === 'week') {
                const prior = new Date();
                prior.setDate(today.getDate() - 7);
                start = prior.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
            } else if (reportRange === 'month') {
                const prior = new Date();
                prior.setDate(today.getDate() - 30);
                start = prior.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
            }

            if (start && end) query += `&startDate=${start}&endDate=${end}`;
            if (selectedClass) query += `&classId=${selectedClass.grade}-${selectedClass.section}`;

            const response = await api.get(`/reports/attendance?${query}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_Report_${start}_to_${end}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download report');
        } finally {
            setIsDownloading(false);
        }
    };

    const ClassCard = ({ classData }) => {
        const percentage = parseFloat(classData.percentage) || 0;
        const isLowAttendance = percentage < 75;

        return (
            <div
                onClick={() => setSelectedClass({ grade: classData.grade, section: classData.section })}
                className={clsx(
                    "p-6 rounded-2xl border bg-white border-slate-200 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-indigo-200",
                    isLowAttendance && "border-l-4 border-l-red-500"
                )}
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">
                            Class {classData.grade}-{classData.section}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {classData.totalStudents} Students
                        </p>
                    </div>
                    <ChevronRight className="text-slate-300" size={20} />
                </div>

                <div className="flex justify-between items-center text-sm text-slate-600 mb-4">
                    <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg w-20">
                        <span className="font-bold text-green-700 text-lg">{classData.present}</span>
                        <span className="text-xs">Present</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg w-20">
                        <span className="font-bold text-red-700 text-lg">{classData.absent}</span>
                        <span className="text-xs">Absent</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg w-20">
                        <span className="font-bold text-yellow-700 text-lg">{classData.late || 0}</span>
                        <span className="text-xs">Late</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Attendance Rate</span>
                        <span className={clsx(
                            "text-sm font-black",
                            percentage >= 75 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                            className={clsx(
                                "h-1.5 rounded-full transition-all",
                                percentage >= 75 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const StatCard = ({ icon: Icon, title, value, color }) => (
        <div className="p-6 rounded-2xl border bg-white border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900">{value}</h3>
                </div>
                <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    color === 'blue' && "bg-blue-50 text-blue-600",
                    color === 'green' && "bg-green-50 text-green-600",
                    color === 'red' && "bg-red-50 text-red-600",
                    color === 'yellow' && "bg-yellow-50 text-yellow-600"
                )}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    // --- DETAILED VIEW ---
    if (selectedClass && classDetails) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedClass(null)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="rotate-180 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Class {selectedClass.grade}-{selectedClass.section}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {classDetails.totalStudents} students enrolled
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center gap-2"
                        >
                            <History size={16} /> History
                        </Button>
                        <Button
                            onClick={() => setShowMarkModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus size={16} /> Mark Attendance
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <Filter size={18} className="text-slate-400 ml-2" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm border-none bg-transparent focus:ring-0 text-slate-700 font-medium cursor-pointer"
                    >
                        <option value="all">All Students</option>
                        <option value="present">Present Only</option>
                        <option value="warning">Low Attendance Warning</option>
                        <option value="critical">Critical Attendance</option>
                    </select>
                </div>

                {/* Student List Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Today's Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Arrival Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Attendance %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => {
                                    const todayRecord = classDetails.todayRecords?.find(
                                        r => r.student_id === student._id
                                    );

                                    return (
                                        <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {student.photo_url ? (
                                                        <img
                                                            src={student.photo_url}
                                                            alt={student.name}
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                            {student.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{student.name}</div>
                                                        <div className="text-xs text-slate-500">{student.student_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {todayRecord ? (
                                                    <span className={clsx(
                                                        "inline-flex px-3 py-1 rounded-full text-xs font-bold",
                                                        todayRecord.status === 'Present' && "bg-green-100 text-green-700",
                                                        todayRecord.status === 'Absent' && "bg-red-100 text-red-700",
                                                        todayRecord.status === 'Late' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                    )}>
                                                        {todayRecord.status}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                                                        Not Marked
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-mono text-slate-600">
                                                {todayRecord?.markedAt ?
                                                    new Date(todayRecord.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                                    '--:--'
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                                                        <div
                                                            className={clsx(
                                                                "h-full rounded-full",
                                                                parseFloat(student.percentage) >= 75 ? "bg-green-500" :
                                                                    parseFloat(student.percentage) >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                            )}
                                                            style={{ width: `${student.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{student.percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals for Detail View */}
                {showMarkModal && (
                    <MarkAttendanceModal
                        isOpen={showMarkModal}
                        onClose={() => setShowMarkModal(false)}
                        selectedClass={selectedClass}
                        onSuccess={() => {
                            setShowMarkModal(false);
                            fetchClassDetails(selectedClass.grade, selectedClass.section);
                            fetchClassSummary(); // update main counts too
                        }}
                    />
                )}

                {showHistoryModal && (
                    <AttendanceHistoryModal
                        isOpen={showHistoryModal}
                        onClose={() => setShowHistoryModal(false)}
                        classInfo={selectedClass}
                    />
                )}
            </div>
        );
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage attendance and track analytics.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={downloadReport} variant="secondary" disabled={isDownloading} className="flex items-center gap-2 border-none bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {isDownloading ? <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full" /> : <FileSpreadsheet size={16} />}
                        Export
                    </Button>

                    <Button onClick={() => setShowMarkModal(true)} className="flex items-center gap-2 bg-indigo-600 border-none shadow-lg shadow-indigo-100">
                        <Plus size={16} /> Mark Attendance
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-b-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={Users}
                            title="Total Students"
                            value={classSummary.reduce((acc, c) => acc + c.totalStudents, 0)}
                            color="blue"
                        />
                        <StatCard
                            icon={CheckCircle}
                            title="Present Today"
                            value={classSummary.reduce((acc, c) => acc + c.present, 0)}
                            color="green"
                        />
                        <StatCard
                            icon={XCircle}
                            title="Absent Today"
                            value={classSummary.reduce((acc, c) => acc + c.absent, 0)}
                            color="red"
                        />
                        <StatCard
                            icon={BarChart3}
                            title="Avg Rate"
                            value={`${(classSummary.reduce((acc, c) => acc + parseFloat(c.percentage), 0) / (classSummary.length || 1)).toFixed(1)}%`}
                            color="yellow"
                        />
                    </div>

                    {/* Classes Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Class Overview</h2>
                            <span className="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                {classSummary.length} Classes Active
                            </span>
                        </div>

                        {classSummary.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {classSummary.map((classData, idx) => (
                                    <ClassCard key={idx} classData={classData} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Users size={40} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-600">No classes found</h3>
                                <p className="text-slate-400">Add classes and students to start tracking.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Global Modals */}
            {showMarkModal && (
                <MarkAttendanceModal
                    isOpen={showMarkModal}
                    onClose={() => setShowMarkModal(false)}
                    onSuccess={() => {
                        setShowMarkModal(false);
                        fetchClassSummary();
                    }}
                />
            )}
        </div>
    );
};

export default AttendanceDashboard;
