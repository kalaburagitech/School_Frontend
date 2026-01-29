import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Shield, Phone, Mail, MapPin, Briefcase, CheckCircle, Camera, Calendar, GraduationCap, AlertCircle, DollarSign } from 'lucide-react';
import clsx from 'clsx';

const StaffForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [buses, setBuses] = useState([]);
    const [routeStops, setRouteStops] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        staff_id: '',
        aadhaar_number: '',
        full_name: '',
        email: '',
        phone: '',
        dob: '',
        blood_group: '',
        photo_url: '',
        qualification: '',
        subjects: '',
        address: '',
        designation: '',
        role_type: 'staff',
        bank_details: {
            bank_name: '',
            account_number: '',
            ifsc_code: ''
        },
        transport: {
            is_using_bus: false,
            bus_id: '',
            route_id: '',
            stop_name: ''
        },
        status: 'Active'
    });

    // --- Helper: Age Calculator ---
    const calculateAge = (dobString) => {
        if (!dobString) return 0;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const { data } = await api.get('/buses');
                setBuses(data);
                if (initialData?.transport?.bus_id) {
                    const bus = data.find(b => b._id === (initialData.transport.bus_id._id || initialData.transport.bus_id));
                    if (bus?.route_id?.stops) setRouteStops(bus.route_id.stops);
                }
            } catch (err) { console.error('Failed to fetch buses', err); }
        };
        fetchBuses();

        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                subjects: Array.isArray(initialData.subjects) ? initialData.subjects.join(', ') : initialData.subjects || '',
                dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
                transport: {
                    ...formData.transport,
                    ...initialData.transport,
                    bus_id: initialData.transport?.bus_id?._id || initialData.transport?.bus_id || '',
                    route_id: initialData.transport?.route_id?._id || initialData.transport?.route_id || '',
                }
            });
        } else {
            setFormData(prev => ({ ...prev, staff_id: 'AUTO-GENERATE' }));
        }
    }, [initialData]);

    const validate = () => {
        const newErrors = {};
        const age = calculateAge(formData.dob);

        if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12)
            newErrors.aadhaar_number = "Aadhaar must be exactly 12 digits";

        if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address";

        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone must be 10 digits";

        if (!formData.dob) {
            newErrors.dob = "Date of Birth is required";
        } else if (age < 18) {
            newErrors.dob = `Staff must be 18+ years old (Current: ${age})`;
        }

        if (!formData.designation) newErrors.designation = "Designation is required";

        // Transport Validation (Only if Bus Access is Enabled)
        if (formData.transport.is_using_bus) {
            if (!formData.transport.bus_id) newErrors.bus_id = "Please select a bus";
            if (!formData.transport.stop_name) newErrors.stop_name = "Please select a stop";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formDataFile = new FormData();
        formDataFile.append('image', file);
        try {
            setUploading(true);
            const { data } = await api.post('/students/photo', formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, photo_url: data.imageUrl }));
        } catch (error) {
            console.error('Photo upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    const handleBusChange = (e) => {
        const busId = e.target.value;
        const selectedBus = buses.find(b => b._id === busId);
        setFormData(prev => ({
            ...prev,
            transport: {
                ...prev.transport,
                bus_id: busId,
                route_id: selectedBus?.route_id?._id || '',
                stop_name: ''
            }
        }));
        setRouteStops(selectedBus?.route_id?.stops || []);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const submissionData = { ...formData };
            submissionData.subjects = formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [];

            if (!initialData) {
                submissionData.staff_id = `STF-${formData.aadhaar_number.slice(-4)}-${Math.floor(Math.random() * 1000)}`;
            }
            onSubmit(submissionData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 scrollbar-hide">

            {/* Master Identification */}
            <div className={clsx(
                "p-4 rounded-xl border transition-all",
                errors.aadhaar_number ? "bg-red-50 border-red-200" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            )}>
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
                            disabled={initialData}
                            value={formData.aadhaar_number}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setFormData({ ...formData, aadhaar_number: val });
                            }}
                            placeholder="xxxx xxxx xxxx"
                            className={clsx(
                                "w-full px-4 py-2 rounded-lg border outline-none font-mono",
                                errors.aadhaar_number ? "border-red-500 bg-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10"
                            )}
                        />
                        {formData.aadhaar_number.length === 12 && (
                            <p className="text-xs text-green-600 font-bold mt-1 flex items-center">
                                <CheckCircle size={12} className="mr-1" /> Valid Format
                            </p>
                        )}
                        {errors.aadhaar_number && <p className="text-xs text-red-500 mt-1">{errors.aadhaar_number}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Staff ID (Auto-Generated)</label>
                        <div className="w-full px-4 py-2 rounded-lg border font-mono font-bold text-slate-500 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-white/10">
                            {initialData ? formData.staff_id : (formData.aadhaar_number.length >= 4 ? `STF-${formData.aadhaar_number.slice(-4)}-XXXX` : 'STF-XXXX-XXXX')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Details & Photo */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <Input
                            label="Full Name"
                            required
                            icon={User}
                            error={errors.full_name}
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Enter full name"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    icon={Calendar}
                                    error={errors.dob}
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                />
                                {formData.dob && (
                                    <span className={clsx(
                                        "absolute top-0 right-0 text-[10px] px-2 py-0.5 rounded-full font-bold",
                                        calculateAge(formData.dob) >= 18 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    )}>
                                        Age: {calculateAge(formData.dob)}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Blood Group</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.blood_group}
                                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 relative group">
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                        {formData.photo_url ? (
                            <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white">
                                <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <Camera size={20} />
                                    <span className="text-[8px] font-black uppercase mt-1">Change</span>
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all bg-white dark:bg-slate-900">
                                {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div> : <><Camera size={24} /><span className="text-[10px] font-black uppercase mt-2">Upload Photo</span></>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Email Address"
                    type="email"
                    required
                    icon={Mail}
                    error={errors.email}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@school.edu"
                />
                <Input
                    label="Phone Number"
                    required
                    icon={Phone}
                    error={errors.phone}
                    value={formData.phone}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val });
                    }}
                />
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Briefcase size={14} className="mr-2" /> Role & Qualification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Designation</label>
                        <select
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white outline-none"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        >
                            <option value="">Select Designation</option>
                            <option value="Admin">Admin</option>
                            <option value="Owner">Owner</option>
                            <option value="Principal">Principal</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Clerk">Clerk</option>
                            <option value="Helper">Helper</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                    <Input
                        label="Qualification"
                        icon={GraduationCap}
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. MBA, B.Com"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Designation"
                        required
                        icon={Briefcase}
                        error={errors.designation}
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Office Manager"
                    />
                    <Input
                        label="Specialization / Subjects"
                        value={formData.subjects}
                        onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                        placeholder="e.g. Accounts, HR (comma separated)"
                    />
                </div>
                <Input
                    label="Residential Address"
                    icon={MapPin}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
            </div>

            {/* Banking Details */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <DollarSign size={14} className="mr-2" /> Banking Details (For Payslip)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Bank Name"
                        value={formData.bank_details?.bank_name || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            bank_details: { ...formData.bank_details, bank_name: e.target.value }
                        })}
                        placeholder="e.g. ICICI Bank"
                    />
                    <Input
                        label="Account Number"
                        value={formData.bank_details?.account_number || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            bank_details: { ...formData.bank_details, account_number: e.target.value }
                        })}
                        placeholder="Enter account number"
                    />
                    <Input
                        label="IFSC Code"
                        value={formData.bank_details?.ifsc_code || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            bank_details: { ...formData.bank_details, ifsc_code: e.target.value.toUpperCase() }
                        })}
                        placeholder="ICIC0001234"
                    />
                </div>
            </div>

            {/* Transport Section - KEPT AS PER ORIGINAL CODE */}
            <div className={clsx(
                "p-6 rounded-2xl space-y-4 border transition-colors",
                (errors.bus_id || errors.stop_name) ? "border-red-300 bg-red-50" : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5"
            )}>
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600"
                        checked={formData.transport.is_using_bus}
                        onChange={(e) => setFormData({
                            ...formData,
                            transport: { ...formData.transport, is_using_bus: e.target.checked }
                        })}
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Enable School Bus Access</span>
                </div>

                {formData.transport.is_using_bus && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Assign Bus</label>
                            <select
                                className={clsx("w-full px-4 py-2 rounded-lg border outline-none", errors.bus_id ? "border-red-500" : "border-slate-200")}
                                value={formData.transport.bus_id}
                                onChange={handleBusChange}
                            >
                                <option value="">Select a Bus</option>
                                {buses.map(bus => (
                                    <option key={bus._id} value={bus._id}>{bus.vehicle_number}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Pickup Point</label>
                            <select
                                className={clsx("w-full px-4 py-2 rounded-lg border outline-none", errors.stop_name ? "border-red-500" : "border-slate-200")}
                                value={formData.transport.stop_name}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    transport: { ...formData.transport, stop_name: e.target.value }
                                })}
                            >
                                <option value="">Select Stop</option>
                                {routeStops.map((stop, idx) => (
                                    <option key={idx} value={stop.stop_name}>{stop.stop_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-white/5 sticky bottom-0 bg-white dark:bg-slate-900">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading}>
                    {initialData ? 'Update Staff Profile' : 'Register Staff'}
                </Button>
            </div>
        </form>
    );
};

export default StaffForm;