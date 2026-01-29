import { useState, useEffect } from 'react';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Phone, Shield, Briefcase, Bus as BusIcon, CheckCircle, DollarSign } from 'lucide-react';
import clsx from 'clsx';

const DriverForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [buses, setBuses] = useState([]);
    const [errors, setErrors] = useState({});

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
        emergency_contact: '',
        bank_details: {
            bank_name: '',
            account_number: '',
            ifsc_code: ''
        }
    });

    useEffect(() => {
        api.get('/buses').then(res => setBuses(res.data || []));

        if (initialData) {
            setFormData({
                ...initialData,
                dob: initialData.dob?.split('T')[0] || '',
                license_expiry_date: initialData.license_expiry_date?.split('T')[0] || '',
                assigned_bus_id: initialData.assigned_bus_id?._id || '',
            });
        } else {
            setFormData(prev => ({ ...prev, driver_id: 'AUTO-GENERATE' }));
        }
    }, [initialData]);

    // 🔴 VALIDATION
    const validate = () => {
        const e = {};

        if (formData.aadhaar_number.length !== 12)
            e.aadhaar_number = 'Aadhaar must be 12 digits';

        if (!formData.full_name || formData.full_name.length < 3)
            e.full_name = 'Full name is required';

        if (!formData.dob)
            e.dob = 'Date of birth is required';

        if (!formData.blood_group)
            e.blood_group = 'Blood group is required';

        if (!formData.license_number)
            e.license_number = 'License number is required';

        if (!formData.license_expiry_date)
            e.license_expiry_date = 'License expiry date is required';

        if (!/^[6-9]\d{9}$/.test(formData.phone))
            e.phone = 'Invalid phone number';

        if (formData.experience < 0)
            e.experience = 'Experience cannot be negative';

        if (!/^[6-9]\d{9}$/.test(formData.emergency_contact))
            e.emergency_contact = 'Invalid emergency contact';

        if (!formData.assigned_bus_id)
            e.assigned_bus_id = 'Bus assignment is required';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            ...formData,
            experience: Number(formData.experience)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Aadhaar */}
            <Input
                label="Aadhaar Number"
                required
                disabled={initialData}
                value={formData.aadhaar_number}
                onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '') })}
                error={errors.aadhaar_number}
            />

            {/* Name & DOB */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Full Name"
                    required
                    icon={User}
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    error={errors.full_name}
                />
                <Input
                    label="Date of Birth"
                    type="date"
                    required
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    error={errors.dob}
                />
            </div>

            {/* Blood & License */}
            <div className="grid grid-cols-2 gap-4">
                <select
                    className="input-field"
                    value={formData.blood_group}
                    onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                >
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                    ))}
                </select>
                {errors.blood_group && <p className="text-red-500 text-xs">{errors.blood_group}</p>}

                <Input
                    label="License Number"
                    required
                    icon={Shield}
                    value={formData.license_number}
                    onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                    error={errors.license_number}
                />
            </div>

            <Input
                label="License Expiry Date"
                type="date"
                required
                value={formData.license_expiry_date}
                onChange={e => setFormData({ ...formData, license_expiry_date: e.target.value })}
                error={errors.license_expiry_date}
            />

            {/* Phone */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Phone Number"
                    required
                    icon={Phone}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    error={errors.phone}
                />
                <Input
                    label="Experience (Years)"
                    type="number"
                    icon={Briefcase}
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })}
                    error={errors.experience}
                />
            </div>

            <Input
                label="Emergency Contact"
                required
                icon={Phone}
                value={formData.emergency_contact}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value.replace(/\D/g, '') })}
                error={errors.emergency_contact}
            />

            {/* Banking Details */}
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <DollarSign size={14} className="mr-2" /> Banking Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Bank Name"
                        value={formData.bank_details?.bank_name}
                        onChange={e => setFormData({
                            ...formData,
                            bank_details: { ...formData.bank_details, bank_name: e.target.value }
                        })}
                    />
                    <Input
                        label="Account Number"
                        value={formData.bank_details?.account_number}
                        onChange={e => setFormData({
                            ...formData,
                            bank_details: { ...formData.bank_details, account_number: e.target.value }
                        })}
                    />
                </div>
                <Input
                    label="IFSC Code"
                    value={formData.bank_details?.ifsc_code}
                    onChange={e => setFormData({
                        ...formData,
                        bank_details: { ...formData.bank_details, ifsc_code: e.target.value.toUpperCase() }
                    })}
                />
            </div>

            {/* Bus */}
            <select
                className="input-field"
                value={formData.assigned_bus_id}
                onChange={e => setFormData({ ...formData, assigned_bus_id: e.target.value })}
            >
                <option value="">Select Bus</option>
                {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                        {bus.vehicle_number} ({bus.model})
                    </option>
                ))}
            </select>
            {errors.assigned_bus_id && <p className="text-red-500 text-xs">{errors.assigned_bus_id}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={loading}>
                    {initialData ? 'Update Driver' : 'Add Driver'}
                </Button>
            </div>
        </form>
    );
};

export default DriverForm;
