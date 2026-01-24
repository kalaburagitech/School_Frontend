import { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Clock, Calendar, Bell, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Button from './ui/Button';

const TimetableBasedAttendance = ({ isOpen, onClose, onSelectClass }) => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    });

    useEffect(() => {
        if (isOpen) {
            fetchTimetable();
        }
    }, [isOpen]);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/timetable/teacher');
            setTimetable(data.timetable || []);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPeriod = () => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return timetable.find(slot => {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            const startTime = startHour * 60 + startMinute;
            const endTime = endHour * 60 + endMinute;

            return slot.day === selectedDay && currentTime >= startTime && currentTime <= endTime;
        });
    };

    const getUpcomingPeriods = () => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return timetable.filter(slot => {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const startTime = startHour * 60 + startMinute;

            return slot.day === selectedDay && startTime > currentTime;
        }).sort((a, b) => {
            const [aHour, aMinute] = a.startTime.split(':').map(Number);
            const [bHour, bMinute] = b.startTime.split(':').map(Number);
            return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
        });
    };

    const formatTime = (timeStr) => {
        const [hour, minute] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    const currentPeriod = getCurrentPeriod();
    const upcomingPeriods = getUpcomingPeriods();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Timetable Attendance</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Mark attendance based on scheduled classes
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Day Selector */}
                <div className="p-4 border-b border-slate-100 dark:border-white/5 overflow-x-auto">
                    <div className="flex space-x-2 min-w-max">
                        {days.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                                    selectedDay === day
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Current Period */}
                {currentPeriod && (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Bell size={16} className="text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                        Current Class
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {currentPeriod.subject} - Class {currentPeriod.classInfo.grade}-{currentPeriod.classInfo.section}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mt-1">
                                    {formatTime(currentPeriod.startTime)} - {formatTime(currentPeriod.endTime)} • Room {currentPeriod.room}
                                </p>
                            </div>
                            <Button
                                onClick={() => onSelectClass(currentPeriod.classInfo)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Mark Attendance
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : timetable.length === 0 ? (
                        <div className="text-center py-20">
                            <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Timetable Found</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Your timetable hasn't been set up yet. Contact administration.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Upcoming Classes */}
                            {upcomingPeriods.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upcoming Classes</h3>
                                    <div className="space-y-3">
                                        {upcomingPeriods.map((slot, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border border-slate-200 dark:border-white/5 rounded-xl hover:border-indigo-500 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                                            {slot.subject} - Class {slot.classInfo.grade}-{slot.classInfo.section}
                                                        </h4>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                                                <Clock size={14} />
                                                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                            </span>
                                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                Room {slot.room}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => onSelectClass(slot.classInfo)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        Mark Later
                                                        <ChevronRight size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Classes for Selected Day */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    All Classes - {selectedDay}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {timetable
                                        .filter(slot => slot.day === selectedDay)
                                        .sort((a, b) => {
                                            const [aHour, aMinute] = a.startTime.split(':').map(Number);
                                            const [bHour, bMinute] = b.startTime.split(':').map(Number);
                                            return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
                                        })
                                        .map((slot, index) => (
                                            <div
                                                key={index}
                                                className={clsx(
                                                    "p-4 border rounded-xl transition-all",
                                                    slot === currentPeriod
                                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                        : "border-slate-200 dark:border-white/5 hover:border-indigo-500"
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                {slot.subject}
                                                            </span>
                                                            {slot === currentPeriod && (
                                                                <span className="text-xs font-bold px-2 py-1 rounded bg-green-500 text-white">
                                                                    NOW
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                                            Class {slot.classInfo.grade}-{slot.classInfo.section}
                                                        </h4>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onSelectClass(slot.classInfo)}
                                                    >
                                                        Mark
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimetableBasedAttendance;
