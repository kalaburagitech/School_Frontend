import { useState, useEffect } from 'react';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { Bus as BusIcon, Gauge, Calendar, User, Route as RouteIcon } from 'lucide-react';

const BusForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [drivers, setDrivers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [formData, setFormData] = useState({
        bus_id: '',
        vehicle_number: '',
        model: '',
        total_capacity: '',
        status: 'Active',
        driver_id: '',
        route_id: '',
        insurance_expiry: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dRes, rRes] = await Promise.all([
                    api.get('/drivers'),
                    api.get('/routes')
                ]);
                setDrivers(dRes.data);
                setRoutes(rRes.data);
            } catch (err) { console.error('Data fetch failed', err); }
        };
        fetchData();

        if (initialData) {
            setFormData({
                ...initialData,
                insurance_expiry: initialData.insurance_expiry ? new Date(initialData.insurance_expiry).toISOString().split('T')[0] : '',
                driver_id: initialData.driver_id?._id || initialData.driver_id || '',
                route_id: initialData.route_id?._id || initialData.route_id || ''
            });
        } else {
            setFormData(prev => ({ ...prev, bus_id: 'AUTO-GENERATE' }));
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            total_capacity: parseInt(formData.total_capacity) || 0,
            driver_id: formData.driver_id && formData.driver_id !== '' ? formData.driver_id : null,
            route_id: formData.route_id && formData.route_id !== '' ? formData.route_id : null,
            insurance_expiry: formData.insurance_expiry && formData.insurance_expiry !== '' ? formData.insurance_expiry : null
        };
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Bus ID"
                    required
                    disabled={!initialData}
                    value={formData.bus_id}
                    onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                    placeholder="Auto-generated (BUS-2026-001)"
                    className={!initialData ? "bg-slate-50 opacity-70" : ""}
                />
                <Input
                    label="Vehicle Number"
                    required
                    icon={BusIcon}
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    placeholder="e.g. MH-12-AB-1234"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Total Capacity"
                    required
                    type="number"
                    icon={Gauge}
                    value={formData.total_capacity}
                    onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })}
                    placeholder="e.g. 50"
                />
                <Input
                    label="Insurance Expiry"
                    type="date"
                    icon={Calendar}
                    value={formData.insurance_expiry}
                    onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Status</label>
                <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Route">On Route</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center ml-1">
                        <User size={14} className="mr-2" /> Assign Driver
                    </label>
                    <select
                        className="input-field cursor-pointer"
                        value={formData.driver_id}
                        onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    >
                        <option value="">No Driver Assigned</option>
                        {drivers.map(driver => (
                            <option key={driver._id} value={driver._id}>{driver.full_name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center ml-1">
                        <RouteIcon size={14} className="mr-2" /> Assign Route
                    </label>
                    <select
                        className="input-field cursor-pointer"
                        value={formData.route_id}
                        onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                    >
                        <option value="">No Route Assigned</option>
                        {routes.map(route => (
                            <option key={route._id} value={route._id}>{route.route_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading}>
                    {initialData ? 'Update Bus' : 'Add Bus'}
                </Button>
            </div>
        </form>
    );
};

export default BusForm;
