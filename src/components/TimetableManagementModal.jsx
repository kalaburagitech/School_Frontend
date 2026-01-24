import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Edit2, User, Clock, MapPin, Download, BookOpen, Search, Users, Building, Calendar, Settings } from 'lucide-react';
import api from '../utils/api';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const TimetableManagementModal = ({ isOpen, onClose }) => {
    const { user, hasRole } = useAuth();
    const [viewMode, setViewMode] = useState('class'); // 'class' or 'teacher'
    const [timetable, setTimetable] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [schoolSettings, setSchoolSettings] = useState({
        startTime: '09:00',
        endTime: '16:00',
        slotDuration: 45,
        breakTime: '12:00',
        breakDuration: 30
    });
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Selection State
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingSidebar, setLoadingSidebar] = useState(false);

    // Modal for Add/Edit Slot
    const [showSlotForm, setShowSlotForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [newSlot, setNewSlot] = useState({
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: '',
        class_info: { grade: '', section: '' },
        teacher_id: '',
        room: '',
        subject_color: '#3B82F6' // Default blue
    });

    // Color palette for subjects
    const subjectColors = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#8B5CF6', // Purple
        '#EF4444', // Red
        '#F59E0B', // Amber
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlotsDefault = [
        '08:00', '08:45', '09:30', '10:15', '11:00', '11:45',
        '12:30', '13:15', '14:00', '14:45', '15:30', '16:15'
    ];

    const isAdmin = hasRole(['admin', 'principal']);
    const isTeacher = hasRole(['teacher']);

    // Fetch all necessary data
    useEffect(() => {
        if (!isOpen) return;
        fetchAllData();
    }, [isOpen, viewMode]);

    const fetchAllData = async () => {
        setLoadingSidebar(true);
        try {
            // Fetch Settings
            const { data: settingsData } = await api.get('/settings');
            if (settingsData) {
                setSchoolSettings(prev => ({ ...prev, ...settingsData }));
            }

            // Fetch classes
            const { data: classesData } = await api.get('/attendance/summary');
            const uniqueClasses = classesData.map(c => ({
                id: `${c.grade}-${c.section}`,
                label: `Class ${c.grade}-${c.section}`,
                grade: c.grade,
                section: c.section,
                totalStudents: c.totalStudents
            })).sort((a, b) => a.grade - b.grade);
            setClasses(uniqueClasses);

            // Fetch teachers
            const { data: teachersData } = await api.get('/teachers');
            setTeachers(teachersData);

            // Fetch subjects
            const { data: subjectsData } = await api.get('/subjects');
            setSubjects(subjectsData);

            // Set default selection
            if (!selectedEntity && uniqueClasses.length > 0) {
                setSelectedEntity({ type: 'class', ...uniqueClasses[0] });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoadingSidebar(false);
        }
    };

    // Fetch timetable when selection changes
    useEffect(() => {
        if (selectedEntity) {
            fetchTimetable();
        } else {
            setTimetable([]);
        }
    }, [selectedEntity]);

    // Filter Logic for Sidebar
    const filteredSidebarItems = useMemo(() => {
        if (viewMode === 'class') {
            return classes.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()));
        } else {
            return teachers.filter(t => t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
    }, [classes, teachers, viewMode, searchQuery]);

    const fetchTimetable = async () => {
        if (!selectedEntity) return;
        setLoading(true);
        try {
            let url = '';
            let params = {};

            if (selectedEntity.type === 'class') {
                url = `/timetable/class/${selectedEntity.grade}/${selectedEntity.section}`;
            } else {
                url = '/timetable/teacher';
                params = { teacher_id: selectedEntity.id };
            }

            const { data } = await api.get(url, { params });
            setTimetable(data || []);
        } catch (error) {
            console.error('Timetable fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSlot = async () => {
        try {
            const payload = { ...newSlot };

            // Validate required fields
            if (!payload.subject.trim()) {
                alert("Please select a subject");
                return;
            }

            // Set class info if in class view
            if (viewMode === 'class') {
                // Teacher is now optional - no validation needed
                payload.class_info = {
                    grade: selectedEntity.grade,
                    section: selectedEntity.section
                };
            } else {
                // In teacher view, teacher_id comes from selected entity
                payload.teacher_id = selectedEntity.id;

                // Validate class selection
                if (!payload.class_info.grade || !payload.class_info.section) {
                    alert("Please select a class for this teacher's slot");
                    return;
                }
            }

            // Calculate end time if not provided
            if (!payload.endTime) {
                payload.endTime = calculateEndTime(payload.startTime);
            }

            if (editingSlot) {
                await api.put(`/timetable/${editingSlot._id}`, payload);
            } else {
                await api.post('/timetable', payload);
            }

            setShowSlotForm(false);
            setEditingSlot(null);
            resetNewSlot();
            fetchTimetable();
        } catch (error) {
            console.error('Save failed:', error);
            alert(error.response?.data?.message || 'Failed to save slot');
        }
    };

    const resetNewSlot = () => {
        setNewSlot({
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            subject: '',
            class_info: viewMode === 'class' ?
                { grade: selectedEntity?.grade || '', section: selectedEntity?.section || '' } :
                { grade: '', section: '' },
            teacher_id: viewMode === 'teacher' ? selectedEntity?.id || '' : '',
            room: '',
            subject_color: subjectColors[Math.floor(Math.random() * subjectColors.length)]
        });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this timetable slot?")) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetable();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete slot');
        }
    };

    const prepareForm = (slot = null, day = 'Monday', time = '09:00') => {
        if (slot) {
            setEditingSlot(slot);
            setNewSlot({
                ...slot,
                teacher_id: slot.teacher_id?._id || slot.teacher_id,
                subject_color: slot.subject_color || subjectColors[0]
            });
        } else {
            setEditingSlot(null);
            resetNewSlot();
            setNewSlot(prev => ({
                ...prev,
                day,
                startTime: time,
                endTime: calculateEndTime(time)
            }));
        }
        setShowSlotForm(true);
    };

    const calculateEndTime = (startTime) => {
        const [h, m] = startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + 45); // Default 45-minute class
        return date.toTimeString().slice(0, 5);
    };

    // Get subject color
    const getSubjectColor = (subjectName) => {
        // Try to find existing color from subjects list
        const existingSubject = subjects.find(s => s.name === subjectName);
        if (existingSubject?.color) return existingSubject.color;

        // Generate color based on subject name
        const colors = subjectColors;
        const index = Math.abs(subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
        return colors[index];
    };

    // Get all time slots from timetable
    // Generate Time Slots based on Settings
    const timeSlots = useMemo(() => {
        const slots = [];
        let [startH, startM] = schoolSettings.startTime.split(':').map(Number);
        const [endH, endM] = schoolSettings.endTime.split(':').map(Number);
        const [breakH, breakM] = (schoolSettings.breakTime || '12:00').split(':').map(Number);

        let current = new Date();
        current.setHours(startH, startM, 0);
        current.setSeconds(0);

        const end = new Date();
        end.setHours(endH, endM, 0);
        end.setSeconds(0);

        // Define break period for current day reference
        const breakStart = new Date(current);
        breakStart.setHours(breakH, breakM, 0);
        breakStart.setSeconds(0);

        const breakEnd = new Date(breakStart);
        breakEnd.setMinutes(breakStart.getMinutes() + Number(schoolSettings.breakDuration || 0));

        while (current < end) {
            // Check if current slot falls within break time
            // We verify if the START of the slot is inside the break
            // OR if the slot ENDS after the break starts (overlap)

            // Simple check: if current time >= breakStart AND < breakEnd, skip to breakEnd
            if (current >= breakStart && current < breakEnd) {
                current.setTime(breakEnd.getTime());
                continue;
            }

            const slotStart = current.toTimeString().slice(0, 5);
            slots.push(slotStart);
            current.setMinutes(current.getMinutes() + Number(schoolSettings.slotDuration));

            // Safety break to prevent infinite loops if duration is 0
            if (Number(schoolSettings.slotDuration) <= 0) break;
        }

        return slots;
    }, [schoolSettings]);

    const formatTime12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const saveSettings = async () => {
        try {
            await api.post('/settings', { key: 'startTime', value: schoolSettings.startTime });
            await api.post('/settings', { key: 'endTime', value: schoolSettings.endTime });
            await api.post('/settings', { key: 'slotDuration', value: schoolSettings.slotDuration });
            await api.post('/settings', { key: 'breakTime', value: schoolSettings.breakTime });
            await api.post('/settings', { key: 'breakDuration', value: schoolSettings.breakDuration });
            setShowSettingsModal(false);
            alert('Settings saved! The timetable grid will update.');
        } catch (error) {
            console.error('Failed to save settings', error);
        }
    };

    const getSlot = (day, time) => {
        return timetable.find(t => t.day === day && t.startTime === time);
    };

    const exportPDF = () => {
        if (!selectedEntity) return;

        const doc = new jsPDF('l');
        doc.setFontSize(20);
        doc.text(`Timetable - ${selectedEntity.label}`, 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

        const tableBody = [];
        timeSlots.forEach(time => {
            const row = [time];
            days.forEach(day => {
                const slot = getSlot(day, time);
                row.push(slot ? `${slot.subject}\n${slot.teacher_id?.full_name || ''}\nRoom: ${slot.room || 'N/A'}` : '');
            });
            tableBody.push(row);
        });

        doc.autoTable({
            head: [['Time', ...days]],
            body: tableBody,
            startY: 35,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [33, 37, 41]
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            }
        });

        doc.save(`${selectedEntity.label.replace(/\s+/g, '_')}_Timetable.pdf`);
    };

    // Get teacher name by ID
    const getTeacherName = (teacherId) => {
        if (!teacherId) return 'N/A';
        const teacher = teachers.find(t => t._id === teacherId || t.teacher_id === teacherId);
        return teacher?.full_name || 'Unknown Teacher';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">School Timetable Management</h2>
                            <div className="flex gap-4 text-sm mt-1">
                                <button
                                    onClick={() => setViewMode('class')}
                                    className={clsx(
                                        "hover:text-indigo-200 font-bold transition-all px-2 py-1 rounded-lg",
                                        viewMode === 'class' && "bg-white/20 underline decoration-2"
                                    )}
                                >
                                    <Users size={14} className="inline mr-2" />
                                    Classes
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setViewMode('teacher')}
                                        className={clsx(
                                            "hover:text-indigo-200 font-bold transition-all px-2 py-1 rounded-lg",
                                            viewMode === 'teacher' && "bg-white/20 underline decoration-2"
                                        )}
                                    >
                                        <User size={14} className="inline mr-2" />
                                        Teachers
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Button variant="white" onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2 hover:bg-white/20">
                                <Settings size={16} /> Settings
                            </Button>
                        )}
                        <Button
                            variant="white"
                            onClick={exportPDF}
                            className="flex items-center gap-2 hover:bg-white/20"
                        >
                            <Download size={16} /> Export PDF
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar */}
                    <div className="w-64 bg-white border-r border-gray-100 overflow-y-auto hidden md:flex flex-col">
                        <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                {viewMode === 'class' ? (
                                    <>
                                        <Users size={12} /> All Classes
                                    </>
                                ) : (
                                    <>
                                        <User size={12} /> All Teachers
                                    </>
                                )}
                            </h3>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-2 space-y-1">
                            {loadingSidebar ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : filteredSidebarItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-400">No {viewMode === 'class' ? 'classes' : 'teachers'} found</p>
                                </div>
                            ) : (
                                filteredSidebarItems.map(item => (
                                    <button
                                        key={item.id || item._id}
                                        onClick={() => setSelectedEntity(
                                            viewMode === 'class'
                                                ? { type: 'class', ...item }
                                                : { type: 'teacher', id: item._id, label: item.full_name }
                                        )}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group relative overflow-hidden",
                                            (selectedEntity?.id === (item.id || item._id))
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200"
                                                : "text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                (selectedEntity?.id === (item.id || item._id))
                                                    ? "bg-white/20"
                                                    : "bg-gray-100"
                                            )}>
                                                {viewMode === 'class' ? (
                                                    <span className={clsx(
                                                        "text-sm font-black",
                                                        (selectedEntity?.id === item.id)
                                                            ? "text-white"
                                                            : "text-indigo-600"
                                                    )}>
                                                        {item.grade}
                                                    </span>
                                                ) : (
                                                    <User size={14} className={
                                                        (selectedEntity?.id === item._id)
                                                            ? "text-white"
                                                            : "text-gray-500"
                                                    } />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold">{item.label || item.full_name}</div>
                                                {viewMode === 'class' && (
                                                    <div className="text-xs opacity-75 mt-0.5">
                                                        {item.totalStudents} students
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedEntity?.id === (item.id || item._id) && (
                                            <div className="absolute right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content - Timetable Grid */}
                    <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                        {selectedEntity ? (
                            <div className="h-full flex flex-col">
                                {/* Header Bar */}
                                <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                                    {viewMode === 'class' ? (
                                                        <span className="font-black text-lg">{selectedEntity.grade}</span>
                                                    ) : (
                                                        <User size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div>{selectedEntity.label}</div>
                                                    <div className="text-sm font-normal text-gray-500 mt-1">
                                                        {viewMode === 'class'
                                                            ? `${selectedEntity.totalStudents || 0} students • Weekly Schedule`
                                                            : 'Teacher Schedule'
                                                        }
                                                    </div>
                                                </div>
                                            </h3>
                                        </div>
                                        <Button
                                            onClick={() => prepareForm(null)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200"
                                        >
                                            <Plus size={18} className="mr-2" /> Add Slot
                                        </Button>
                                    </div>
                                </div>

                                {/* Timetable Grid */}
                                <div className="flex-1 overflow-auto p-4">
                                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-w-[800px]">
                                        <div className="sticky top-0 z-20">
                                            {/* Days Header */}
                                            <div className="grid grid-cols-8 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                                                <div className="p-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider w-24 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-20 border-r">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} />
                                                        Time
                                                    </div>
                                                </div>
                                                {days.map((day, index) => (
                                                    <div
                                                        key={day}
                                                        className={clsx(
                                                            "p-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider border-r last:border-r-0",
                                                            index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-center gap-2">
                                                            {day}
                                                            <span className="text-xs font-normal text-gray-500">
                                                                ({timetable.filter(t => t.day === day).length})
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Time Slots */}
                                        <div className="divide-y divide-gray-100">
                                            {timeSlots.map((time, timeIndex) => (
                                                <div key={time} className="grid grid-cols-8 hover:bg-gray-50/50 transition-colors">
                                                    {/* Time Column */}
                                                    <div className="p-4 border-r bg-gradient-to-r from-gray-50 to-white text-xs font-bold text-gray-900 sticky left-0 z-10 min-h-[100px]">
                                                        <div className="text-lg font-black text-indigo-600">{formatTime12Hour(time)}</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-bold">
                                                            {(() => {
                                                                const [h, m] = time.split(':').map(Number);
                                                                const endTime = new Date();
                                                                endTime.setHours(h, m + 45); // Visual only, accurate calc depends on dur
                                                                const endH = endTime.getHours();
                                                                const endM = endTime.getMinutes();
                                                                const endPeriod = endH >= 12 ? 'PM' : 'AM';
                                                                // Simple 12h display for end time
                                                                return `${endH % 12 || 12}:${endM.toString().padStart(2, '0')} ${endPeriod}`;
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Day Columns */}
                                                    {days.map((day, dayIndex) => {
                                                        const slot = getSlot(day, time);
                                                        const color = slot ? getSubjectColor(slot.subject) : '';
                                                        const teacherName = slot ? getTeacherName(slot.teacher_id) : '';

                                                        return (
                                                            <div
                                                                key={day}
                                                                className={clsx(
                                                                    "p-2 border-r last:border-r-0 relative group min-h-[100px]",
                                                                    dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                                                                )}
                                                            >
                                                                {slot ? (
                                                                    <div
                                                                        onClick={() => prepareForm(slot)}
                                                                        className={clsx(
                                                                            "h-full w-full rounded-xl p-3 cursor-pointer transition-all shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden",
                                                                            "hover:scale-[1.02] transform transition-transform duration-200"
                                                                        )}
                                                                        style={{
                                                                            backgroundColor: `${color}10`,
                                                                            borderLeft: `4px solid ${color}`,
                                                                            borderTop: `1px solid ${color}30`
                                                                        }}
                                                                    >
                                                                        <div className="absolute inset-0 opacity-10"
                                                                            style={{ backgroundColor: color }} />

                                                                        <div className="relative z-10">
                                                                            <div className="font-bold text-gray-900 text-base mb-2">
                                                                                {slot.subject}
                                                                            </div>
                                                                            {teacherName && teacherName !== 'Unknown Teacher' && (
                                                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                                                    <User size={10} />
                                                                                    <span className="font-medium">{teacherName}</span>
                                                                                </div>
                                                                            )}
                                                                            {slot.class_info && (
                                                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                                                    <Building size={9} />
                                                                                    Class {slot.class_info.grade}-{slot.class_info.section}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDelete(slot._id);
                                                                                }}
                                                                                className="p-1 bg-white rounded-lg text-red-500 hover:bg-red-50 shadow-sm border border-red-100"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    prepareForm(slot);
                                                                                }}
                                                                                className="p-1 bg-white rounded-lg text-indigo-500 hover:bg-indigo-50 shadow-sm border border-indigo-100"
                                                                            >
                                                                                <Edit2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() => prepareForm(null, day, time)}
                                                                        className={clsx(
                                                                            "h-full w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer",
                                                                            "hover:border-indigo-300 hover:bg-indigo-50/20 transition-all duration-200",
                                                                            timeIndex % 2 === 0 ? "border-gray-200" : "border-gray-100"
                                                                        )}
                                                                    >
                                                                        <Plus size={20} className="text-gray-300 mb-1" />
                                                                        <span className="text-xs text-gray-400 font-medium">Add Class</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                                            <div className="text-sm font-medium text-blue-700">Total Classes</div>
                                            <div className="text-2xl font-black text-blue-900">{timetable.length}</div>
                                        </div>
                                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                                            <div className="text-sm font-medium text-green-700">Unique Subjects</div>
                                            <div className="text-2xl font-black text-green-900">
                                                {[...new Set(timetable.map(t => t.subject))].length}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                                            <div className="text-sm font-medium text-purple-700">Teachers Assigned</div>
                                            <div className="text-2xl font-black text-purple-900">
                                                {[...new Set(timetable.map(t => t.teacher_id))].length}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                                            <div className="text-sm font-medium text-amber-700">Busiest Day</div>
                                            <div className="text-2xl font-black text-amber-900">
                                                {(() => {
                                                    const dayCounts = days.map(day => ({
                                                        day,
                                                        count: timetable.filter(t => t.day === day).length
                                                    }));
                                                    const busiest = dayCounts.reduce((a, b) => a.count > b.count ? a : b);
                                                    return `${busiest.day} (${busiest.count})`;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                                <div className="relative">
                                    <div className="w-48 h-48 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
                                        <Calendar size={96} className="text-indigo-300" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-600 mb-2">Welcome to Timetable Management</h3>
                                <p className="text-gray-500 text-center max-w-md mb-6">
                                    Select a {viewMode === 'class' ? 'class' : 'teacher'} from the sidebar to view and manage their weekly schedule.
                                </p>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white mb-2 mx-auto">
                                            <Plus size={20} />
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">Add Classes</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white mb-2 mx-auto">
                                            <Edit2 size={20} />
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">Edit Schedule</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-2 mx-auto">
                                            <Download size={20} />
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">Export PDF</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Slot Form Modal */}
                {showSlotForm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200 mx-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                                        {editingSlot ? <Edit2 size={16} /> : <Plus size={16} />}
                                    </div>
                                    {editingSlot ? 'Edit Timetable Slot' : 'Add New Slot'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSlotForm(false);
                                        setEditingSlot(null);
                                        resetNewSlot();
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                            <Calendar size={12} /> Day
                                        </label>
                                        <select
                                            className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            value={newSlot.day}
                                            onChange={e => setNewSlot({ ...newSlot, day: e.target.value })}
                                        >
                                            {days.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                            <Clock size={12} /> Start Time
                                        </label>
                                        <input
                                            type="time"
                                            className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            value={newSlot.startTime}
                                            onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                        <BookOpen size={12} /> Subject
                                    </label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                        value={newSlot.subject}
                                        onChange={e => setNewSlot({ ...newSlot, subject: e.target.value })}
                                    >
                                        <option value="">Select a subject...</option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Teacher selection (only in class view) - OPTIONAL */}
                                {viewMode === 'class' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                                            <User size={12} /> Teacher <span className="text-gray-400 text-[10px] ml-1">(Optional)</span>
                                        </label>
                                        <select
                                            className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            value={newSlot.teacher_id}
                                            onChange={e => setNewSlot({ ...newSlot, teacher_id: e.target.value })}
                                        >
                                            <option value="">No teacher assigned</option>
                                            {teachers.map(t => (
                                                <option key={t._id} value={t._id}>
                                                    {t.full_name} ({t.teacher_id || t._id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Class selection (only in teacher view) */}
                                {viewMode === 'teacher' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 mb-1 block">Class Grade</label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                                value={newSlot.class_info.grade}
                                                onChange={e => setNewSlot({
                                                    ...newSlot,
                                                    class_info: { ...newSlot.class_info, grade: e.target.value }
                                                })}
                                            >
                                                <option value="">Select Grade</option>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 mb-1 block">Section</label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                                value={newSlot.class_info.section}
                                                onChange={e => setNewSlot({
                                                    ...newSlot,
                                                    class_info: { ...newSlot.class_info, section: e.target.value }
                                                })}
                                            >
                                                <option value="">Select Section</option>
                                                {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                                                    <option key={s} value={s}>Section {s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Color selection */}
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-2 block">Subject Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {subjectColors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewSlot({ ...newSlot, subject_color: color })}
                                                className={clsx(
                                                    "w-8 h-8 rounded-full border-2 transition-transform",
                                                    newSlot.subject_color === color
                                                        ? "border-gray-800 scale-110"
                                                        : "border-transparent hover:scale-105"
                                                )}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowSlotForm(false);
                                            setEditingSlot(null);
                                            resetNewSlot();
                                        }}
                                        className="flex-1 border-gray-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveSlot}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200"
                                    >
                                        {editingSlot ? 'Update Slot' : 'Add Slot'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Settings Modal */}
                {showSettingsModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-indigo-600" /> Timetable Settings
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-800 mb-1 block">School Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl font-black text-gray-900 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={schoolSettings.startTime}
                                        onChange={e => setSchoolSettings({ ...schoolSettings, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-800 mb-1 block">School End Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl font-black text-gray-900 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={schoolSettings.endTime}
                                        onChange={e => setSchoolSettings({ ...schoolSettings, endTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-800 mb-1 block">Slot Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl font-black text-gray-900 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={schoolSettings.slotDuration}
                                        onChange={e => setSchoolSettings({ ...schoolSettings, slotDuration: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-black text-gray-800 mb-1 block">Break Start (Lunch)</label>
                                        <input
                                            type="time"
                                            className="w-full p-3 border-2 border-gray-200 rounded-xl font-black text-gray-900 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                            value={schoolSettings.breakTime}
                                            onChange={e => setSchoolSettings({ ...schoolSettings, breakTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-800 mb-1 block">Break Duration</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-gray-200 rounded-xl font-black text-gray-900 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                            value={schoolSettings.breakDuration}
                                            onChange={e => setSchoolSettings({ ...schoolSettings, breakDuration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button variant="secondary" onClick={() => setShowSettingsModal(false)} className="flex-1">Cancel</Button>
                                    <Button onClick={saveSettings} className="flex-1">Save Configuration</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimetableManagementModal;