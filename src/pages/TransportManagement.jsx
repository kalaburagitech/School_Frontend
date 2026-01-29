import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Bus as BusIcon, User, Edit, Trash, MapPin, Gauge, Route as RouteIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import BusForm from '../components/BusForm';
import DriverForm from '../components/DriverForm';
import RouteForm from '../components/RouteForm';
import clsx from 'clsx';

const TransportManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('buses');
    const [buses, setBuses] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const isAdmin = user?.role === 'admin';

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/${activeTab}`);
            if (activeTab === 'buses') setBuses(data);
            else if (activeTab === 'drivers') setDrivers(data);
            else setRoutes(data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleAdd = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
            try {
                await api.delete(`/${activeTab}/${id}`);
                fetchData();
            } catch (error) {
                console.error('Delete failed', error);
                alert('Delete failed. Ensure this item is not assigned elsewhere.');
            }
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            if (selectedItem) {
                await api.put(`/${activeTab}/${selectedItem._id}`, formData);
            } else {
                await api.post(`/${activeTab}`, formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Submit failed', error);
            const msg = error.response?.data?.message || error.message || 'Failed to save record. Please verify all required fields.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const renderItems = () => {
        const items = activeTab === 'buses' ? buses : activeTab === 'drivers' ? drivers : routes;

        return items.map(item => (
            <Card
                key={item._id}
                className={clsx(
                    "group hover:scale-[1.02] transition-all duration-300 border-none shadow-premium relative overflow-hidden",
                    activeTab === 'routes' && "cursor-pointer"
                )}
                onClick={() => activeTab === 'routes' && handleEdit(item)}
            >
                {isAdmin && (
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-20">
                        <button onClick={() => handleEdit(item)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-primary transition-colors">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-start justify-between mb-6">
                    <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
                        activeTab === 'buses' ? 'bg-indigo-50 text-indigo-600' :
                            activeTab === 'drivers' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                        {activeTab === 'buses' ? <BusIcon size={28} /> :
                            activeTab === 'drivers' ? <User size={28} /> : <RouteIcon size={28} />}
                    </div>
                    <div className="text-right">
                        <span className={clsx(
                            "inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            'bg-slate-100 text-slate-600'
                        )}>
                            {activeTab.slice(0, -1)}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {item.vehicle_number || item.full_name || item.route_name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mb-4 truncate">
                        {item.model || item.license_number || `${item.start_point} ↔ ${item.end_point}`}
                    </p>

                    <div className="space-y-3 pt-4 border-t border-slate-50">
                        {activeTab === 'buses' && (
                            <>
                                <div className="flex items-center text-sm font-medium text-slate-600">
                                    <Gauge size={16} className="mr-3 text-slate-400" />
                                    {item.current_occupancy || 0} / {item.total_capacity} Capacity
                                </div>
                                <div className="flex items-center text-sm font-medium text-slate-600">
                                    <User size={16} className="mr-3 text-slate-400" />
                                    {item.driver_id?.full_name || 'No Driver'}
                                </div>
                            </>
                        )}
                        {activeTab === 'drivers' && (
                            <>
                                <div className="flex items-center text-sm font-medium text-slate-600">
                                    <BusIcon size={16} className="mr-3 text-slate-400" />
                                    {item.assigned_bus_id?.vehicle_number || 'No assignment'}
                                </div>
                                <div className="flex items-center text-sm font-medium text-slate-600">
                                    <Gauge size={16} className="mr-3 text-slate-400" />
                                    {item.phone_number}
                                </div>
                            </>
                        )}
                        {activeTab === 'routes' && (
                            <>
                                <div className="flex items-center text-sm font-medium text-slate-600">
                                    <MapPin size={16} className="mr-3 text-slate-400" />
                                    {item.stops?.length || 0} Stop points
                                </div>
                                <div className="flex items-center text-sm font-medium text-slate-600">
                                    <RouteIcon size={16} className="mr-3 text-slate-400" />
                                    Active Mainline
                                </div>
                                <div className="pt-2 text-[10px] font-bold text-primary/60 uppercase tracking-widest animate-pulse">
                                    Click card to manage stops
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        ));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight tracking-tighter">Transport Network</h1>
                        {!isAdmin && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">View Only</span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">Manage your fleet, personnel and transit routes.</p>
                </div>
                <div className="flex items-center bg-white p-1 rounded-2xl shadow-premium border border-slate-100">
                    {['buses', 'drivers', 'routes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                'px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 capitalize',
                                activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderItems()}

                {isAdmin && (
                    <button
                        onClick={handleAdd}
                        className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group min-h-[240px]"
                    >
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all mb-4">
                            <Plus size={32} />
                        </div>
                        <p className="font-bold text-slate-600 group-hover:text-primary">Add {activeTab.slice(0, -1)}</p>
                    </button>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
            >
                {activeTab === 'buses' && <BusForm initialData={selectedItem} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} loading={loading} />}
                {activeTab === 'drivers' && <DriverForm initialData={selectedItem} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} loading={loading} />}
                {activeTab === 'routes' && <RouteForm initialData={selectedItem} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} loading={loading} />}
            </Modal>
        </div>
    );
};

export default TransportManagement;
