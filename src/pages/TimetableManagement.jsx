import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Edit2, User, Clock, Download, BookOpen, Search, Users, Building, Calendar, Settings, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const TimetableManagement = () => {
    const { user, hasRole } = useAuth();
    const [timetable, setTimetable] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Class Management
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [newClass, setNewClass] = useState({ grade: '', section: '' });

    // Test/Exam specific
    const [isExamMode, setIsExamMode] = useState(false);
    const [examDetails, setExamDetails] = useState({
        name: '',
        date: '',
        startTime: '10:40',
        endTime: '11:20',
        submissionDate: '',
        ptmDate: ''
    });

    const [schoolSettings, setSchoolSettings] = useState({
        startTime: '09:00',
        endTime: '16:00',
        slotDuration: 45,
        breakTime: '12:00',
        breakDuration: 30
    });

    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Selection State
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [loading, setLoading] = useState(false);

    // Modal for Add/Edit Slot
    const [showSlotForm, setShowSlotForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [newSlot, setNewSlot] = useState({
        date: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: '',
        subject_color: '#3B82F6',
        isExam: false
    });

    const subjectColors = [
        '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isAdmin = hasRole(['admin', 'principal', 'owner']);
    const isTeacher = hasRole(['teacher']);
    const canEdit = hasRole(['admin', 'principal', 'owner', 'teacher']);
    const canManageSettings = hasRole(['admin', 'principal', 'owner']);

    // Fetch all necessary data
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
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
            if (!selectedClass && uniqueClasses.length > 0) {
                setSelectedClass(uniqueClasses[0]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // Fetch timetable when selection changes
    useEffect(() => {
        if (selectedClass) {
            fetchTimetable();
        } else {
            setTimetable([]);
        }
    }, [selectedClass, selectedWeek]);

    const fetchTimetable = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const { data } = await api.get('/timetable', {
                params: {
                    grade: selectedClass.grade,
                    section: selectedClass.section,
                    isExam: isExamMode
                }
            });
            setTimetable(data || []);
        } catch (error) {
            console.error('Timetable fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSlot = async () => {
        try {
            const payload = {
                ...newSlot,
                class_info: {
                    grade: selectedClass.grade,
                    section: selectedClass.section
                },
                isExam: isExamMode
            };

            if (!payload.subject.trim()) {
                alert("Please select a subject");
                return;
            }

            if (!payload.date && isExamMode) {
                alert("Please select a date for exam schedule");
                return;
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
            date: '',
            day: days[0],
            startTime: isExamMode ? '10:40' : '09:00',
            endTime: isExamMode ? '11:20' : '10:00',
            subject: '',
            subject_color: subjectColors[Math.floor(Math.random() * subjectColors.length)],
            isExam: isExamMode
        });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this slot?")) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetable();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete slot');
        }
    };

    const prepareForm = (slot = null, day = null, date = null) => {
        if (slot) {
            setEditingSlot(slot);
            setNewSlot({
                ...slot,
                subject_color: slot.subject_color || subjectColors[0]
            });
        } else {
            setEditingSlot(null);
            resetNewSlot();
            const targetDay = day || days[0];
            const targetDate = date || '';

            setNewSlot(prev => ({
                ...prev,
                day: targetDay,
                date: targetDate
            }));
        }
        setShowSlotForm(true);
    };

    const getSubjectColor = (subjectName) => {
        const existingSubject = subjects.find(s => s.name === subjectName);
        if (existingSubject?.color) return existingSubject.color;

        const colors = subjectColors;
        const index = Math.abs(subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
        return colors[index];
    };

    // Get time slots based on mode
    const timeSlots = useMemo(() => {
        if (isExamMode) {
            return ['10:40']; // Fixed exam time
        }

        const slots = [];
        let [startH, startM] = schoolSettings.startTime.split(':').map(Number);
        const [endH, endM] = schoolSettings.endTime.split(':').map(Number);
        const [breakH, breakM] = (schoolSettings.breakTime || '12:00').split(':').map(Number);

        let current = new Date();
        current.setHours(startH, startM, 0, 0);

        const end = new Date();
        end.setHours(endH, endM, 0, 0);

        const breakStart = new Date(current);
        breakStart.setHours(breakH, breakM, 0, 0);

        const breakEnd = new Date(breakStart);
        breakEnd.setMinutes(breakStart.getMinutes() + Number(schoolSettings.breakDuration || 0));

        while (current < end) {
            if (current >= breakStart && current < breakEnd) {
                current.setTime(breakEnd.getTime());
                continue;
            }

            const slotStart = current.toTimeString().slice(0, 5);
            slots.push(slotStart);
            current.setMinutes(current.getMinutes() + Number(schoolSettings.slotDuration));

            if (Number(schoolSettings.slotDuration) <= 0) break;
        }

        return slots;
    }, [schoolSettings, isExamMode]);

    // Generate weekly dates for the timetable
    const generateWeekDates = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Find the nearest Monday
        const monday = new Date(today);
        const diff = currentDay === 0 ? -6 : 1 - currentDay;
        monday.setDate(today.getDate() + diff + (selectedWeek * 7));

        const weekDates = [];
        for (let i = 0; i < 6; i++) { // Monday to Saturday
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            weekDates.push({
                date: date.toISOString().split('T')[0],
                day: days[i],
                displayDate: date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            });
        }
        return weekDates;
    };

    const exportPDF = () => {
        if (!selectedClass) return;

        const doc = new jsPDF('l');

        // Title
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text(`${isExamMode ? examDetails.name || 'EXAM' : 'TIMETABLE'} - CLASS ${selectedClass.grade}-${selectedClass.section}`, 105, 15, null, null, 'center');

        // Dates
        doc.setFontSize(10);
        doc.setTextColor(100);
        const weekDates = generateWeekDates();
        doc.text(`Week: ${weekDates[0].displayDate} to ${weekDates[5].displayDate}`, 105, 23, null, null, 'center');

        if (isExamMode && examDetails.submissionDate) {
            doc.text(`Submission of Question Papers: ${examDetails.submissionDate}`, 105, 28, null, null, 'center');
            doc.text(`PTM: ${examDetails.ptmDate}`, 105, 33, null, null, 'center');
        }

        // Table data
        const tableData = [];
        const timeHeader = isExamMode ? ['TIME'] : ['PERIOD / TIME'];

        // Add day headers with dates
        const dayHeaders = weekDates.map(wd => `${wd.day}\n${wd.displayDate}`);
        const headers = [...timeHeader, ...dayHeaders];

        // Add time slots
        timeSlots.forEach((timeSlot, index) => {
            const row = [timeSlot];
            weekDates.forEach(day => {
                const slot = timetable.find(t =>
                    t.date === day.date &&
                    t.startTime === timeSlot
                );
                row.push(slot ? slot.subject : '-');
            });
            tableData.push(row);
        });

        // Auto table
        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 40,
            theme: 'grid',
            styles: {
                fontSize: isExamMode ? 10 : 9,
                cellPadding: 3,
                textColor: [33, 37, 41]
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontSize: isExamMode ? 11 : 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 249, 250] }
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            }
        });

        // Footer note for exam mode
        if (isExamMode) {
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Exam Timing: ${examDetails.startTime} to ${examDetails.endTime}`, 105, finalY, null, null, 'center');
        }

        doc.save(`${isExamMode ? 'Exam' : 'Timetable'}_Class${selectedClass.grade}-${selectedClass.section}.pdf`);
    };

    const handleAddClass = async () => {
        if (!newClass.grade || !newClass.section) {
            alert("Please enter both grade and section");
            return;
        }

        try {
            // Create class in the system
            await api.post('/classes', newClass);
            setShowAddClassModal(false);
            setNewClass({ grade: '', section: '' });
            fetchAllData();
            alert('Class added successfully!');
        } catch (error) {
            console.error('Failed to add class:', error);
            alert('Failed to add class');
        }
    };

    const handleExamModeToggle = () => {
        setIsExamMode(!isExamMode);
        if (!isExamMode) {
            setExamDetails({
                name: '',
                date: '',
                startTime: '10:40',
                endTime: '11:20',
                submissionDate: '',
                ptmDate: ''
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-screen flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white shadow-sm border-b px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Calendar size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Timetable Management</h2>
                                <p className="text-sm text-gray-600">Manage class schedules and exam timetables</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Exam Mode Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Regular</span>
                                <button
                                    onClick={handleExamModeToggle}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isExamMode ? 'bg-red-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isExamMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm font-medium text-gray-700">Exam</span>
                            </div>

                            {/* Week Navigation */}
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                                <button
                                    onClick={() => setSelectedWeek(prev => prev - 1)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-medium">Week {selectedWeek + 1}</span>
                                <button
                                    onClick={() => setSelectedWeek(prev => prev + 1)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {canEdit && (
                                <Button
                                    onClick={() => prepareForm(null)}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Plus size={18} className="mr-2" />
                                    {isExamMode ? 'Add Exam' : 'Add Class'}
                                </Button>
                            )}

                            {canManageSettings && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSettingsModal(true)}
                                >
                                    <Settings size={16} />
                                </Button>
                            )}

                            <Button
                                onClick={exportPDF}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Download size={16} className="mr-2" /> Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Exam Mode Header */}
                    {isExamMode && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-red-700">Exam Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Periodic Test - 2"
                                        className="w-full p-2 text-sm border border-red-300 rounded"
                                        value={examDetails.name}
                                        onChange={e => setExamDetails({ ...examDetails, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-700">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 text-sm border border-red-300 rounded"
                                        value={examDetails.startTime}
                                        onChange={e => setExamDetails({ ...examDetails, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-700">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 text-sm border border-red-300 rounded"
                                        value={examDetails.endTime}
                                        onChange={e => setExamDetails({ ...examDetails, endTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-700">Paper Submission</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 text-sm border border-red-300 rounded"
                                        value={examDetails.submissionDate}
                                        onChange={e => setExamDetails({ ...examDetails, submissionDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-700">PTM Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 text-sm border border-red-300 rounded"
                                        value={examDetails.ptmDate}
                                        onChange={e => setExamDetails({ ...examDetails, ptmDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Classes */}
                    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-700">Classes</h3>
                                <button
                                    onClick={() => setShowAddClassModal(true)}
                                    className="text-indigo-600 hover:text-indigo-800 p-1"
                                    title="Add New Class"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search class..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="p-2 space-y-1">
                            {classes
                                .filter(c =>
                                    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.grade.includes(searchQuery)
                                )
                                .map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls)}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                            selectedClass?.id === cls.id
                                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                : "text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                selectedClass?.id === cls.id
                                                    ? "bg-indigo-100 text-indigo-700"
                                                    : "bg-gray-100 text-gray-600"
                                            )}>
                                                <span className="font-bold">{cls.grade}</span>
                                            </div>
                                            <div>
                                                <div className="font-semibold">Class {cls.grade}-{cls.section}</div>
                                                <div className="text-xs text-gray-500">{cls.totalStudents || 0} students</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Main Content - Timetable */}
                    <div className="flex-1 overflow-auto bg-white">
                        {selectedClass ? (
                            <div className="h-full flex flex-col">
                                {/* Timetable Header */}
                                <div className="p-4 border-b bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {isExamMode ? 'Exam Timetable' : 'Weekly Timetable'} - Class {selectedClass.grade}-{selectedClass.section}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {isExamMode ? 'Manage examination schedule' : 'Manage regular class schedule'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Timetable Grid */}
                                <div className="p-4 overflow-auto">
                                    {loading ? (
                                        <div className="flex justify-center py-20">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-7 border-b bg-gray-50">
                                                <div className="p-3 font-bold text-gray-700 border-r">
                                                    {isExamMode ? 'TIME' : 'PERIOD / TIME'}
                                                </div>
                                                {generateWeekDates().map((day, index) => (
                                                    <div key={index} className="p-3 text-center border-r last:border-r-0">
                                                        <div className="font-bold text-gray-900">{shortDays[index]}</div>
                                                        <div className="text-xs text-gray-600 mt-1">{day.displayDate}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Time Slots */}
                                            <div className="divide-y divide-gray-100">
                                                {timeSlots.map((timeSlot, timeIndex) => (
                                                    <div key={timeSlot} className="grid grid-cols-7">
                                                        {/* Time Column */}
                                                        <div className="p-3 border-r bg-gray-50 font-medium text-gray-900">
                                                            {timeSlot}
                                                            {!isExamMode && (
                                                                <div className="text-xs text-gray-500">Period {timeIndex + 1}</div>
                                                            )}
                                                        </div>

                                                        {/* Day Columns */}
                                                        {generateWeekDates().map((day, dayIndex) => {
                                                            const slot = timetable.find(t =>
                                                                t.date === day.date &&
                                                                t.startTime === timeSlot
                                                            );

                                                            return (
                                                                <div
                                                                    key={dayIndex}
                                                                    className="p-3 border-r last:border-r-0 min-h-[80px] hover:bg-gray-50 transition-colors"
                                                                    onClick={() => canEdit && !slot && prepareForm(null, day.day, day.date)}
                                                                >
                                                                    {slot ? (
                                                                        <div
                                                                            className={clsx(
                                                                                "h-full rounded p-2 cursor-pointer transition-all",
                                                                                canEdit && "hover:shadow-sm"
                                                                            )}
                                                                            style={{
                                                                                backgroundColor: `${getSubjectColor(slot.subject)}10`,
                                                                                borderLeft: `3px solid ${getSubjectColor(slot.subject)}`
                                                                            }}
                                                                            onClick={() => canEdit && prepareForm(slot)}
                                                                        >
                                                                            <div className="font-bold text-gray-900">{slot.subject}</div>
                                                                            {!isExamMode && slot.teacher_id && (
                                                                                <div className="text-xs text-gray-600 mt-1">
                                                                                    {teachers.find(t => t._id === slot.teacher_id)?.full_name || 'Teacher'}
                                                                                </div>
                                                                            )}
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                {slot.startTime} - {slot.endTime}
                                                                            </div>

                                                                            {canEdit && (
                                                                                <div className="flex gap-1 mt-2">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDelete(slot._id);
                                                                                        }}
                                                                                        className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            prepareForm(slot);
                                                                                        }}
                                                                                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded text-xs"
                                                                                    >
                                                                                        <Edit2 size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className={clsx(
                                                                            "h-full flex items-center justify-center border-2 border-dashed rounded",
                                                                            canEdit
                                                                                ? "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 text-gray-400"
                                                                                : "text-gray-300"
                                                                        )}>
                                                                            {canEdit ? (
                                                                                <div className="text-center">
                                                                                    <Plus size={16} className="mx-auto mb-1" />
                                                                                    <span className="text-xs">Add Class</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-xs">-</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Notes for Exam Mode */}
                                    {isExamMode && (
                                        <div className="mt-6 space-y-2">
                                            <div className="text-sm text-gray-600">
                                                <strong>Exam Timing:</strong> {examDetails.startTime} to {examDetails.endTime}
                                            </div>
                                            {examDetails.submissionDate && (
                                                <div className="text-sm text-gray-600">
                                                    <strong>Submission of Question Papers:</strong> {examDetails.submissionDate}
                                                </div>
                                            )}
                                            {examDetails.ptmDate && (
                                                <div className="text-sm text-gray-600">
                                                    <strong>PTM:</strong> {examDetails.ptmDate}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                <Calendar size={64} className="mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Class Selected</h3>
                                <p className="text-gray-500 text-center max-w-sm">
                                    Select a class from the sidebar to view and manage timetable
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Class Modal */}
                {showAddClassModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Add New Class</h3>
                                <button onClick={() => setShowAddClassModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Grade</label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newClass.grade}
                                        onChange={e => setNewClass({ ...newClass, grade: e.target.value })}
                                    >
                                        <option value="">Select Grade</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Section</label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newClass.section}
                                        onChange={e => setNewClass({ ...newClass, section: e.target.value })}
                                    >
                                        <option value="">Select Section</option>
                                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(s => (
                                            <option key={s} value={s}>Section {s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddClassModal(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddClass}
                                        className="flex-1 bg-indigo-600 text-white"
                                    >
                                        Add Class
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Slot Form Modal */}
                {showSlotForm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">
                                    {editingSlot ? 'Edit' : 'Add'} {isExamMode ? 'Exam' : 'Class'} Slot
                                </h3>
                                <button onClick={() => {
                                    setShowSlotForm(false);
                                    setEditingSlot(null);
                                }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {isExamMode && (
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Exam Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border rounded"
                                            value={newSlot.date}
                                            onChange={e => setNewSlot({ ...newSlot, date: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Day</label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newSlot.day}
                                        onChange={e => setNewSlot({ ...newSlot, day: e.target.value })}
                                    >
                                        {days.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-2 border rounded"
                                            value={newSlot.startTime}
                                            onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-2 border rounded"
                                            value={newSlot.endTime}
                                            onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Subject</label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newSlot.subject}
                                        onChange={e => setNewSlot({ ...newSlot, subject: e.target.value })}
                                    >
                                        <option value="">Select subject</option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {!isExamMode && (
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Teacher (Optional)</label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={newSlot.teacher_id || ''}
                                            onChange={e => setNewSlot({ ...newSlot, teacher_id: e.target.value })}
                                        >
                                            <option value="">No teacher</option>
                                            {teachers.map(t => (
                                                <option key={t._id} value={t._id}>{t.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowSlotForm(false);
                                            setEditingSlot(null);
                                        }}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveSlot}
                                        className="flex-1 bg-indigo-600 text-white"
                                    >
                                        {editingSlot ? 'Update' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettingsModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold mb-4">Timetable Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded"
                                        value={schoolSettings.startTime}
                                        onChange={e => setSchoolSettings({ ...schoolSettings, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded"
                                        value={schoolSettings.endTime}
                                        onChange={e => setSchoolSettings({ ...schoolSettings, endTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Slot Duration (minutes)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded"
                                        value={schoolSettings.slotDuration}
                                        onChange={e => setSchoolSettings({ ...schoolSettings, slotDuration: parseInt(e.target.value) || 45 })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Break Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-2 border rounded"
                                            value={schoolSettings.breakTime}
                                            onChange={e => setSchoolSettings({ ...schoolSettings, breakTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Break Duration</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border rounded"
                                            value={schoolSettings.breakDuration}
                                            onChange={e => setSchoolSettings({ ...schoolSettings, breakDuration: parseInt(e.target.value) || 30 })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSettingsModal(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={saveSettings}
                                        className="flex-1 bg-indigo-600 text-white"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimetableManagement;