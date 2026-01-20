import { useState, useEffect } from 'react';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { Plus, Trash, BookOpen, Hash, Tag } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const SubjectManagement = ({ onSubjectsUpdated }) => {
    const { showToast } = useToast();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        department: ''
    });

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/subjects');
            setSubjects(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch subjects', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subjects', formData);
            showToast('Subject Added', 'success', `${formData.name} has been added to the registry.`);
            setFormData({ name: '', code: '', department: '' });
            fetchSubjects();
            if (onSubjectsUpdated) onSubjectsUpdated();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to add subject';
            showToast('Error', 'error', msg);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await api.delete(`/subjects/${id}`);
                showToast('Subject Deleted', 'success', 'The subject has been removed.');
                fetchSubjects();
                if (onSubjectsUpdated) onSubjectsUpdated();
            } catch (error) {
                showToast('Error', 'error', 'Could not delete subject');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Add Subject Form */}
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-2">
                    <Plus size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Add New Subject</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        placeholder="Subject Name (e.g. Physics)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        placeholder="Code (e.g. PHYS101)"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                    />
                    <div className="flex gap-2">
                        <Input
                            placeholder="Dept (e.g. Science)"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="flex-1"
                        />
                        <Button type="submit" className="shrink-0">
                            Add
                        </Button>
                    </div>
                </div>
            </form>

            <div className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-400">
                    <BookOpen size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Existing Subjects</span>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                        {subjects.map(subject => (
                            <div
                                key={subject._id}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between group transition-all hover:border-indigo-500/30"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Hash size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm dark:text-white">{subject.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subject.code} • {subject.department}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(subject._id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                        {subjects.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-400 italic">
                                No subjects registered yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectManagement;
