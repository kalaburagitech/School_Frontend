import { useState, useEffect } from 'react';
import {
    Bell, Calendar, MessageSquare, FileText, CheckCircle,
    AlertCircle, Clock, Plus, Filter, Download, Megaphone,
    UserCheck, PartyPopper, ClipboardList
} from 'lucide-react';
import clsx from 'clsx';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const OperationsHub = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeModule, setActiveModule] = useState('DASHBOARD'); // DASHBOARD, NOTICES, LEAVES, EVENTS
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State (Generic)
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'info', // urgent, info, success
        targetRole: 'all',
        startDate: '',
        endDate: ''
    });

    const modules = [
        { id: 'NOTICES', title: 'Start Circulars (Notices)', icon: Megaphone, color: 'blue', desc: 'Broadcast announcements to specific roles.' },
        { id: 'LEAVES', title: 'Leave Portal', icon: UserCheck, color: 'emerald', desc: 'Manage leave requests and approvals.' },
        { id: 'EVENTS', title: 'School Functions', icon: PartyPopper, color: 'violet', desc: 'Calendar, galleries, and consent forms.' },
        { id: 'FEEDBACK', title: 'Feedback & Polls', icon: MessageSquare, color: 'amber', desc: 'Gather opinions and suggestions.' },
    ];

    const fetchItems = async (type) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/communications?type=${type}`);
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeModule !== 'DASHBOARD') {
            // Mapping PLURAL module names to SINGULAR API types is a bithack, fixing:
            const typeMap = { 'NOTICES': 'NOTICE', 'LEAVES': 'LEAVE', 'EVENTS': 'EVENT', 'FEEDBACK': 'FEEDBACK' };
            fetchItems(typeMap[activeModule]);
        }
    }, [activeModule]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const typeMap = { 'NOTICES': 'NOTICE', 'LEAVES': 'LEAVE', 'EVENTS': 'EVENT', 'FEEDBACK': 'FEEDBACK' };
            const payload = {
                moduleType: typeMap[activeModule],
                createdBy: user?.email || user?.name || user?.profile_id?.full_name || 'Anonymous',
                creatorRole: user?.role || 'admin',
                targetAudience: { role: formData.targetRole },
                content: {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    startDate: formData.startDate,
                    endDate: formData.endDate
                },
                status: activeModule === 'LEAVES' ? 'Pending' : 'Published'
            };
            await api.post('/communications', payload);
            showToast('Created Successfully', 'success', 'New item added to the hub.');
            setShowModal(false);
            fetchItems(typeMap[activeModule]);
        } catch (error) {
            showToast('Failed', 'error', 'Could not create item.');
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/communications/${id}/status`, { status: 'Approved' });
            showToast('Approved', 'success', 'Request has been approved.');
            const typeMap = { 'NOTICES': 'NOTICE', 'LEAVES': 'LEAVE', 'EVENTS': 'EVENT', 'FEEDBACK': 'FEEDBACK' };
            fetchItems(typeMap[activeModule]);
        } catch (error) {
            console.error(error);
        }
    };

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-in fade-in">
            {modules.map(m => (
                <div
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={clsx(
                        "p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg group bg-white dark:bg-slate-900",
                        `border-${m.color}-100 hover:border-${m.color}-500 dark:border-white/5`
                    )}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={clsx("p-3 rounded-xl", `bg-${m.color}-50 text-${m.color}-600`)}>
                            <m.icon size={28} />
                        </div>
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500">
                            View Module
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{m.title}</h3>
                    <p className="text-slate-500 text-sm">{m.desc}</p>
                </div>
            ))}
        </div>
    );

    const renderList = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <button onClick={() => setActiveModule('DASHBOARD')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2">
                    ← Back to Hub
                </button>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={18} className="mr-2" />
                    Create New
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">No items found in this module.</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {items.map(item => (
                            <div key={item._id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        {item.content.priority === 'urgent' && <AlertCircle size={16} className="text-rose-500" />}
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.content.title}</h4>
                                        <span className={clsx(
                                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                            item.status === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                                                item.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm">{item.content.description}</p>
                                    <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1">
                                            <UserCheck size={12} />
                                            {activeModule === 'LEAVES' ? 'Private Request' : `For: ${item.targetAudience.role}`}
                                        </span>
                                    </div>
                                </div>
                                {(activeModule === 'LEAVES' && item.status === 'Pending' && user.role === 'admin') && (
                                    <Button size="sm" onClick={() => handleApprove(item._id)}>Approve</Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <ClipboardList size={32} className="text-indigo-600" />
                    Operations Hub
                </h1>
                <p className="text-slate-500">Central command for notices, leaves, and school events.</p>
            </div>

            {activeModule === 'DASHBOARD' ? renderDashboard() : renderList()}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Create {activeModule.toLowerCase().slice(0, -1)}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Title"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Description</label>
                                <textarea
                                    className="input-field min-h-[100px]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            {activeModule === 'NOTICES' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold">Priority</label>
                                    <select className="input-field" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="info">Info (Blue)</option>
                                        <option value="urgent">Urgent (Red)</option>
                                        <option value="success">Success (Green)</option>
                                    </select>
                                </div>
                            )}

                            {(activeModule === 'LEAVES' || activeModule === 'EVENTS') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input type="date" label="Start Date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                    <Input type="date" label="End Date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Publish</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperationsHub;
