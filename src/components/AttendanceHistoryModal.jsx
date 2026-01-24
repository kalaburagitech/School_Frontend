import React from 'react';
import { X, Calendar } from 'lucide-react';
import Button from './ui/Button';

const AttendanceHistoryModal = ({ isOpen, onClose, classInfo }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Attendance History
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-8 text-center">
                    <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        History for Class {classInfo?.grade}-{classInfo?.section}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Detailed attendance history view is coming soon.
                    </p>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryModal;
