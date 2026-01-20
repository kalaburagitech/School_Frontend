import { useState, useEffect } from 'react';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Phone, Shield, Briefcase, Bus as BusIcon, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const DriverForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [buses, setBuses] = useState([]);
    const [formData, setFormData] = useState({
        driver_id: '',
        aadhaar_number: '',
        full_name: '',
        dob: '',
        blood_group: '',
        license_number: '',
        license_expiry_date: '',
        phone: '',
        experience: '',
        assigned_bus_id: '',
        emergency_contact: ''
    });

    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const { data } = await api.get('/buses');
                setBuses(data);
            } catch (err) { console.error('Failed to fetch buses', err); }
        };
        fetchBuses();

        if (initialData) {
            setFormData({
                ...initialData,
                dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
                blood_group: initialData.blood_group || '',
                phone: initialData.phone || initialData.phone_number || '',
                license_expiry_date: initialData.license_expiry_date ? new Date(initialData.license_expiry_date).toISOString().split('T')[0] : '',
                assigned_bus_id: initialData.assigned_bus_id?._id || initialData.assigned_bus_id || '',
                emergency_contact: initialData.emergency_contact || ''
            });
        } else {
            setFormData(prev => ({ ...prev, driver_id: 'AUTO-GENERATE' }));
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            experience: parseInt(formData.experience) || 0,
            assigned_bus_id: formData.assigned_bus_id && formData.assigned_bus_id !== '' ? formData.assigned_bus_id : null
        };
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Master Identification */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-4 text-blue-800 dark:text-blue-300">
                    <Shield size={18} />
                    <h3 className="font-bold">Master Identification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Aadhaar Number (12 Digits)</label>
                        <input
                            type="text"
                            maxLength={12}
                            required
                            disabled={initialData} // Lock Aadhaar on edit
                            value={formData.aadhaar_number || ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setFormData({ ...formData, aadhaar_number: val });
                            }}
                            placeholder="xxxx xxxx xxxx"
                            className={clsx(
                                "w-full px-4 py-2 rounded-lg border outline-none font-mono",
                                "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10"
                            )}
                        />
                        {formData.aadhaar_number?.length === 12 && (
                            <p className="text-xs text-green-600 font-bold mt-1 flex items-center">
                                <CheckCircle size={12} className="mr-1" /> Valid Format
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Driver ID (Auto-Generated)</label>
                        <div className={clsx(
                            "w-full px-4 py-2 rounded-lg border font-mono font-bold text-slate-500 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50",
                            "border-slate-200 dark:border-white/10"
                        )}>
                            {initialData
                                ? formData.driver_id
                                : (formData.aadhaar_number?.length >= 4
                                    ? `DRV-${formData.aadhaar_number.slice(-4)}-0001`
                                    : 'DRV-XXXX-0001')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Full Name"
                    required
                    icon={User}
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                />
                <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input
                        type="date"
                        required
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className={clsx(
                            "w-full px-4 py-2 rounded-lg border outline-none",
                            "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10"
                        )}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Blood Group</label>
                    <select
                        value={formData.blood_group}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                        className={clsx(
                            "w-full px-4 py-2 rounded-lg border outline-none cursor-pointer",
                            "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10"
                        )}
                    >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>
                <Input
                    label="License Number"
                    required
                    icon={Shield}
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="e.g. DL-14202XXXXXXXX"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Input
                    label="License Expiry Date"
                    type="date"
                    required
                    value={formData.license_expiry_date}
                    onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Phone Number"
                    required
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98XXX XXXXX"
                />
                <Input
                    label="Experience (Years)"
                    type="number"
                    icon={Briefcase}
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 5"
                />
            </div>

            <Input
                label="Emergency Contact Number"
                icon={Phone}
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="Alternate phone number"
            />

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 flex items-center ml-1">
                    <BusIcon size={14} className="mr-2" /> Assign to Bus
                </label>
                <select
                    className="input-field cursor-pointer"
                    value={formData.assigned_bus_id}
                    onChange={(e) => setFormData({ ...formData, assigned_bus_id: e.target.value })}
                >
                    <option value="">No Bus Assigned</option>
                    {buses.map(bus => (
                        <option key={bus._id} value={bus._id}>{bus.vehicle_number} ({bus.model})</option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading}>
                    {initialData ? 'Update Driver' : 'Add Driver'}
                </Button>
            </div>
        </form>
    );
};

export default DriverForm;
