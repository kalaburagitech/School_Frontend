import { useState, useEffect } from 'react';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { Bus as BusIcon, Gauge, Calendar, User, Route as RouteIcon } from 'lucide-react';

const BusForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [drivers, setDrivers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        bus_id: '',
        vehicle_number: '',
        model: '',
        total_capacity: '',
        status: '',
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
                setDrivers(dRes.data || []);
                setRoutes(rRes.data || []);
            } catch (err) {
                console.error('Data fetch failed', err);
            }
        };
        fetchData();

        if (initialData) {
            setFormData({
                ...initialData,
                insurance_expiry: initialData.insurance_expiry
                    ? new Date(initialData.insurance_expiry).toISOString().split('T')[0]
                    : '',
                driver_id: initialData.driver_id?._id || '',
                route_id: initialData.route_id?._id || ''
            });
        } else {
            setFormData(prev => ({
                ...prev,
                bus_id: 'AUTO-GENERATE',
                status: 'Active'
            }));
        }
    }, [initialData]);

    // 🔴 VALIDATION
    const validate = () => {
        const newErrors = {};

        if (!formData.bus_id) newErrors.bus_id = 'Bus ID is required';

        if (!formData.vehicle_number)
            newErrors.vehicle_number = 'Vehicle number is required';
        else if (!/^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/.test(formData.vehicle_number))
            newErrors.vehicle_number = 'Invalid vehicle number format';

        if (!formData.model)
            newErrors.model = 'Bus model is required';

        if (!formData.total_capacity || Number(formData.total_capacity) <= 0)
            newErrors.total_capacity = 'Capacity must be greater than 0';

        if (!formData.insurance_expiry)
            newErrors.insurance_expiry = 'Insurance expiry date is required';

        if (!formData.status)
            newErrors.status = 'Status is required';

        if (!formData.driver_id)
            newErrors.driver_id = 'Driver assignment is required';

        if (!formData.route_id)
            newErrors.route_id = 'Route assignment is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            ...formData,
            total_capacity: Number(formData.total_capacity)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Bus ID & Vehicle Number */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Bus ID"
                    required
                    disabled={!initialData}
                    value={formData.bus_id}
                    onChange={e => setFormData({ ...formData, bus_id: e.target.value })}
                    error={errors.bus_id}
                />

                <Input
                    label="Vehicle Number"
                    required
                    icon={BusIcon}
                    placeholder="MH-12-AB-1234"
                    value={formData.vehicle_number}
                    onChange={e => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                    error={errors.vehicle_number}
                />
            </div>

            {/* Model & Capacity */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Bus Model"
                    required
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    error={errors.model}
                />

                <Input
                    label="Total Capacity"
                    required
                    type="number"
                    icon={Gauge}
                    value={formData.total_capacity}
                    onChange={e => setFormData({ ...formData, total_capacity: e.target.value })}
                    error={errors.total_capacity}
                />
            </div>

            {/* Insurance */}
            <Input
                label="Insurance Expiry"
                required
                type="date"
                icon={Calendar}
                value={formData.insurance_expiry}
                onChange={e => setFormData({ ...formData, insurance_expiry: e.target.value })}
                error={errors.insurance_expiry}
            />

            {/* Status */}
            <div>
                <label className="text-sm font-semibold">Status *</label>
                <select
                    className="input-field"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Route">On Route</option>
                </select>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>

            {/* Driver & Route */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                    <label className="text-sm font-semibold flex items-center">
                        <User size={14} className="mr-2" /> Assign Driver *
                    </label>
                    <select
                        className="input-field"
                        value={formData.driver_id}
                        onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
                    >
                        <option value="">Select Driver</option>
                        {drivers.map(d => (
                            <option key={d._id} value={d._id}>{d.full_name}</option>
                        ))}
                    </select>
                    {errors.driver_id && <p className="text-red-500 text-xs mt-1">{errors.driver_id}</p>}
                </div>

                <div>
                    <label className="text-sm font-semibold flex items-center">
                        <RouteIcon size={14} className="mr-2" /> Assign Route *
                    </label>
                    <select
                        className="input-field"
                        value={formData.route_id}
                        onChange={e => setFormData({ ...formData, route_id: e.target.value })}
                    >
                        <option value="">Select Route</option>
                        {routes.map(r => (
                            <option key={r._id} value={r._id}>{r.route_name}</option>
                        ))}
                    </select>
                    {errors.route_id && <p className="text-red-500 text-xs mt-1">{errors.route_id}</p>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
