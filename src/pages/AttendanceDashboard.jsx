import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Calendar, Plus, Users, CheckCircle, XCircle, Clock,
    TrendingUp, TrendingDown, BarChart3, Download, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../components/ui/Button';
import MarkAttendanceModal from '../components/MarkAttendanceModal';

const AttendanceDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [classSummary, setClassSummary] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classDetails, setClassDetails] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [showMarkModal, setShowMarkModal] = useState(false);

    useEffect(() => {
        fetchClassSummary();
        fetchAnalytics();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchClassDetails(selectedClass.grade, selectedClass.section);
        }
    }, [selectedClass]);

    const fetchClassSummary = async () => {
        try {
            const { data } = await api.get('/attendance/summary');
            setClassSummary(data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassDetails = async (grade, section) => {
        try {
            const { data } = await api.get(`/attendance/class/${grade}/${section}`);
            setClassDetails(data);
        } catch (error) {
            console.error('Failed to fetch class details:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { data } = await api.get('/attendance/analytics?days=30');
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const ClassCard = ({ classData }) => {
        const percentage = parseFloat(classData.percentage) || 0;
        return (
            <div
                onClick={() => setSelectedClass({ grade: classData.grade, section: classData.section })}
                className={clsx(
                    "p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-xl",
                    "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:border-indigo-500 dark:hover:border-indigo-500"
                )}
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            Class {classData.grade}-{classData.section}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {classData.totalStudents} Students
                        </p>
                    </div>
                    <ChevronRight className="text-slate-400" size={24} />
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" /> Present
                        </span>
                        <span className="text-sm font-bold text-green-600">{classData.present}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <XCircle size={16} className="text-red-500" /> Absent
                        </span>
                        <span className="text-sm font-bold text-red-600">{classData.absent}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Today's Attendance</span>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className={clsx(
                                "h-2 rounded-full transition-all",
                                percentage >= 75 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const StatCard = ({ icon: Icon, title, value, change, trend, color }) => (
        <div className="p-6 rounded-2xl border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/5">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">{title}</p>
                    <h3 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{value}</h3>
                    {change && (
                        <div className="flex items-center space-x-1">
                            {trend === 'up' ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-500" />}
                            <span className={clsx("text-sm font-medium", trend === 'up' ? "text-green-500" : "text-red-500")}>{change}</span>
                        </div>
                    )}
                </div>
                <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    color === 'green' && "bg-green-500/10 text-green-500",
                    color === 'red' && "bg-red-500/10 text-red-500",
                    color === 'blue' && "bg-blue-500/10 text-blue-500",
                    color === 'yellow' && "bg-yellow-500/10 text-yellow-500"
                )}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    if (selectedClass && classDetails) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <ChevronRight size={20} className="rotate-180" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Class {selectedClass.grade}-{selectedClass.section}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Detailed attendance records</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowMarkModal(true)} className="flex items-center gap-2">
                        <Plus size={18} /> Mark Attendance
                    </Button>
                </div>

                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-white/5">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student-wise Attendance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Student ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Present</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Absent</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Late</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {classDetails.students?.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900 dark:text-white">{student.student_id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{student.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600">{student.present}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600">{student.absent}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-600">{student.late}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className={clsx(
                                                            "h-2 rounded-full",
                                                            parseFloat(student.percentage) >= 75 ? "bg-green-500" : parseFloat(student.percentage) >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${student.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{student.percentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showMarkModal && (
                    <MarkAttendanceModal
                        isOpen={showMarkModal}
                        onClose={() => setShowMarkModal(false)}
                        selectedClass={selectedClass}
                        onSuccess={() => {
                            setShowMarkModal(false);
                            fetchClassDetails(selectedClass.grade, selectedClass.section);
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Attendance Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track and analyze attendance with detailed insights</p>
                </div>
                <Button onClick={() => setShowMarkModal(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Mark Attendance
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* Overall Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                            change="+5.2%"
                            trend="up"
                            color="green"
                        />
                        <StatCard
                            icon={XCircle}
                            title="Absent Today"
                            value={classSummary.reduce((acc, c) => acc + c.absent, 0)}
                            change="-2.1%"
                            trend="down"
                            color="red"
                        />
                        <StatCard
                            icon={BarChart3}
                            title="Avg Attendance"
                            value={`${(classSummary.reduce((acc, c) => acc + parseFloat(c.percentage), 0) / (classSummary.length || 1)).toFixed(1)}%`}
                            change="+1.8%"
                            trend="up"
                            color="yellow"
                        />
                    </div>

                    {/* Class Cards Grid */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Classes Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classSummary.map((classData, idx) => (
                                <ClassCard key={idx} classData={classData} />
                            ))}
                        </div>
                    </div>
                </>
            )}

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
