import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Shield, Phone, MapPin, Truck, Calendar, GraduationCap, CheckCircle, Camera } from 'lucide-react';

const StudentForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [buses, setBuses] = useState([]);
    const [routeStops, setRouteStops] = useState([]);
    const [isAddingNewStop, setIsAddingNewStop] = useState(false);

    const [formData, setFormData] = useState({
        student_id: '',
        aadhaar_number: '',
        first_name: '',
        last_name: '',
        full_name: '',
        roll_number: '',
        admission_number: '',
        dob: '',
        joining_date: new Date().toISOString().split('T')[0],
        gender: 'Male',
        blood_group: '',
        religion: '',
        nationality: 'Indian',
        class_info: {
            grade: '',
            section: '',
            academic_year: new Date().getFullYear().toString()
        },
        parent_details: {
            father_name: '',
            father_phone: '',
            father_occupation: '',
            mother_name: '',
            mother_phone: '',
            mother_occupation: '',
            primary_contact: ''
        },
        address: {
            address_line: '',
            city: '',
            pincode: ''
        },
        documents: {
            photo_url: ''
        },
        transport: {
            is_using_bus: false,
            bus_id: '',
            route_id: '',
            stop_name: '',
            latitude: '',
            longitude: ''
        }
    });

    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const { data } = await api.get('/buses');
                setBuses(data);

                // If editing, find stops for the initial bus
                if (initialData?.transport?.bus_id) {
                    const bus = data.find(b => b._id === (initialData.transport.bus_id._id || initialData.transport.bus_id));
                    if (bus?.route_id?.stops) {
                        setRouteStops(bus.route_id.stops);
                    }
                }
            } catch (err) { console.error('Failed to fetch buses', err); }
        };
        fetchBuses();

        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                first_name: initialData.full_name?.split(' ')[0] || '',
                last_name: initialData.full_name?.split(' ').slice(1).join(' ') || '',
                parent_details: {
                    ...prev.parent_details,
                    ...(initialData.family?.father ? {
                        father_name: initialData.family.father.name,
                        father_phone: initialData.family.father.phone,
                        father_occupation: initialData.family.father.occupation
                    } : {}),
                    ...(initialData.family?.mother ? {
                        mother_name: initialData.family.mother.name,
                        mother_phone: initialData.family.mother.phone,
                        mother_occupation: initialData.family.mother.occupation
                    } : {}),
                    primary_contact: initialData.contact_info?.phone || ''
                },
                address: {
                    address_line: initialData.address?.permanent?.address_line || '',
                    city: initialData.address?.permanent?.city || '',
                    pincode: initialData.address?.permanent?.pincode || ''
                },
                documents: {
                    photo_url: initialData.documents?.photo_url || ''
                },
                class_info: {
                    grade: initialData.class_info?.grade || '',
                    section: initialData.class_info?.section || '',
                    academic_year: initialData.class_info?.academic_year || prev.class_info.academic_year
                },
                transport: {
                    ...prev.transport,
                    bus_id: initialData.transport?.bus_id?._id || initialData.transport?.bus_id || '',
                    route_id: initialData.transport?.route_id?._id || initialData.transport?.route_id || '',
                    stop_name: initialData.transport?.stop_name || '',
                    latitude: initialData.transport?.latitude || '',
                    longitude: initialData.transport?.longitude || ''
                },
                dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
                joining_date: initialData.joining_date ? new Date(initialData.joining_date).toISOString().split('T')[0] : prev.joining_date
            }));
        }
    }, [initialData]);

    const handleBusChange = (e) => {
        const busId = e.target.value;
        setIsAddingNewStop(false);
        const selectedBus = buses.find(b => b._id === busId);

        setFormData(prev => ({
            ...prev,
            transport: {
                ...prev.transport,
                bus_id: busId,
                route_id: selectedBus?.route_id?._id || '',
                stop_name: '', // Reset stop when bus changes
                latitude: '',
                longitude: ''
            }
        }));

        if (selectedBus?.route_id?.stops) {
            setRouteStops(selectedBus.route_id.stops);
            setIsAddingNewStop(false);
        } else {
            setRouteStops([]);
            setIsAddingNewStop(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Construct backend-compliant object
        const finalData = {
            ...formData,
            full_name: `${formData.first_name} ${formData.last_name}`.trim(),
            contact_info: {
                phone: formData.parent_details.primary_contact,
                email: formData.email
            },
            family: {
                father: {
                    name: formData.parent_details.father_name,
                    phone: formData.parent_details.father_phone,
                    occupation: formData.parent_details.father_occupation
                },
                mother: {
                    name: formData.parent_details.mother_name,
                    phone: formData.parent_details.mother_phone,
                    occupation: formData.parent_details.mother_occupation
                }
            },
            address: {
                permanent: {
                    address_line: formData.address.address_line,
                    city: formData.address.city,
                    pincode: formData.address.pincode
                }
            }
        };

        // Student ID auto-handling
        if (!finalData.student_id || finalData.student_id === 'AUTO-GENERATE') {
            delete finalData.student_id;
        }

        // Transport handling
        if (!finalData.transport.is_using_bus || !finalData.transport.bus_id) {
            finalData.transport = { is_using_bus: false };
        } else if (isAddingNewStop && finalData.transport.stop_name) {
            finalData.transport.is_new_stop = true;
            finalData.transport.latitude = parseFloat(finalData.transport.latitude);
            finalData.transport.longitude = parseFloat(finalData.transport.longitude);
        }

        // Unique field safety
        if (finalData.admission_number) finalData.admission_number = finalData.admission_number.trim();
        if (!finalData.admission_number) delete finalData.admission_number;

        if (finalData.roll_number) finalData.roll_number = finalData.roll_number.trim();
        if (!finalData.roll_number) delete finalData.roll_number;

        // Final Validation Check
        const isProcessValid = [1, 2, 3].every(s => validateStep(s));
        if (!isProcessValid) {
            console.error('Validation failed on one or more milestones');
            return;
        }

        onSubmit(finalData);
    };

    const handleAadhaarChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
        setFormData(prev => ({
            ...prev,
            aadhaar_number: val,
            // Let backend handle ID generation to avoid "XXXX" and collisions
            student_id: prev.student_id
        }));
    };

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

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
            setFormData(prev => ({
                ...prev,
                documents: { ...prev.documents, photo_url: data.imageUrl }
            }));
        } catch (error) {
            console.error('Photo upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const validateStep = (currentStep) => {
        switch (currentStep) {
            case 1:
                return formData.aadhaar_number?.length === 12 && formData.first_name && formData.last_name;
            case 2:
                return formData.dob &&
                    formData.gender && formData.address.address_line &&
                    formData.address.city && formData.address.pincode;
            case 3:
                return formData.class_info.grade && formData.class_info.section &&
                    formData.parent_details.father_name && formData.parent_details.father_phone &&
                    formData.parent_details.primary_contact;
            case 4:
                return true; // Transport is optional
            default:
                return false;
        }
    };

    const canGoNext = Array.from({ length: step }, (_, i) => i + 1).every(s => validateStep(s));

    const nextStep = () => {
        if (canGoNext) setStep(s => Math.min(s + 1, totalSteps));
    };
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const steps = [
        { id: 1, title: 'Identity', icon: Shield },
        { id: 2, title: 'Personal', icon: User },
        { id: 3, title: 'Class & Family', icon: GraduationCap },
        { id: 4, title: 'Transport', icon: Truck }
    ];

    return (
        <div className="space-y-6">
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-8 px-4">
                {steps.map((s, idx) => (
                    <div key={s.id} className="flex items-center group">
                        <div className="flex flex-col items-center">
                            <div className={clsx(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                                step >= s.id
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110"
                                    : "bg-slate-100 dark:bg-white/5 text-slate-400"
                            )}>
                                <s.icon size={20} strokeWidth={2.5} />
                            </div>
                            <span className={clsx(
                                "text-[10px] font-black uppercase tracking-widest mt-3 transition-colors duration-500",
                                step >= s.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                            )}>{s.title}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={clsx(
                                "h-0.5 w-12 md:w-24 mx-4 rounded-full transition-all duration-1000",
                                step > s.id ? "bg-indigo-600" : "bg-slate-100 dark:bg-white/5"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 max-h-[65vh] overflow-y-auto px-1 scrollbar-hide py-2">
                {/* Step 1: Master Identity */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3 text-indigo-900 dark:text-indigo-300">
                                    <Shield size={24} strokeWidth={2.5} />
                                    <h3 className="font-black text-2xl tracking-tight">Identity & Security</h3>
                                </div>
                                {(formData.first_name || formData.last_name) && (
                                    <div className="hidden md:flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Application For</span>
                                        <span className="font-black text-indigo-900 dark:text-white">{formData.first_name} {formData.last_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <Input
                                    label="First Name"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                                <Input
                                    label="Last Name"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                                <div className="space-y-2">
                                    <Input
                                        label="Aadhaar Number"
                                        value={formData.aadhaar_number}
                                        onChange={handleAadhaarChange}
                                        maxLength={12}
                                        placeholder="xxxx xxxx xxxx"
                                        required
                                    />
                                    {formData.aadhaar_number?.length === 12 && (
                                        <div className="flex items-center space-x-2 px-2 text-emerald-500">
                                            <CheckCircle size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Verified Format</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">System Generated ID</label>
                                    <div className="px-6 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-white/10 flex items-center justify-between group transition-all">
                                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                                            {formData.student_id || 'Auto Generated'}
                                        </span>
                                        <div className="p-1 px-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                            Identity
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight px-2">Unique identifier for academic records</p>
                                </div>
                            </div>

                            {/* Live Preview Card */}
                            {(formData.first_name || formData.aadhaar_number) && (
                                <div className="mt-10 p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-indigo-100 dark:border-white/5 shadow-xl shadow-indigo-500/5 animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                                {formData.first_name || 'New'} {formData.last_name || 'Student'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest">
                                                    {formData.student_id || 'Auto Generated'}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Enrollment Phase</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Student Information */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Gender</label>
                                    <select
                                        className="input-field py-3.5 rounded-2xl"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    required
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 relative group">
                                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                {formData.documents.photo_url ? (
                                    <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800">
                                        <img src={formData.documents.photo_url} alt="Student" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                                        >
                                            <Camera size={28} />
                                            <span className="text-[10px] font-black uppercase mt-2">Change Image</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-40 h-40 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all bg-white dark:bg-slate-900 shadow-sm"
                                    >
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                                                    <Camera size={32} />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest px-4 text-center">Upload Portrait</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Blood Group</label>
                                <select
                                    className="input-field py-3.5 rounded-2xl"
                                    value={formData.blood_group}
                                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                >
                                    <option value="">Select Group</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                            <Input label="Religion" value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} />
                            <Input label="Nationality" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2">
                                <Input label="Address Line" value={formData.address.address_line} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, address_line: e.target.value } })} />
                            </div>
                            <Input label="City" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                            <Input label="Pincode" value={formData.address.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} />
                        </div>
                    </div>
                )}

                {/* Step 3: Academic & Parents */}
                {step === 3 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Academic Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Class</label>
                                <select
                                    className="input-field py-3.5 rounded-2xl"
                                    required
                                    value={formData.class_info.grade}
                                    onChange={(e) => setFormData({ ...formData, class_info: { ...formData.class_info, grade: e.target.value } })}
                                >
                                    <option value="">Select Class</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <option key={n} value={n}>Class {n}</option>
                                    ))}
                                </select>
                            </div>
                            <Input label="Section" required value={formData.class_info.section} onChange={(e) => setFormData({ ...formData, class_info: { ...formData.class_info, section: e.target.value } })} />
                        </div>

                        {/* Guardian Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">F</div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Father's Details</h4>
                                </div>
                                <Input label="Full Name" value={formData.parent_details.father_name} onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, father_name: e.target.value } })} />
                                <Input label="Phone" value={formData.parent_details.father_phone} onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, father_phone: e.target.value } })} />
                                <Input label="Occupation" value={formData.parent_details.father_occupation} onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, father_occupation: e.target.value } })} />
                            </div>
                            <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-8 h-8 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-xl flex items-center justify-center font-black text-xs">M</div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Mother's Details (Optional)</h4>
                                </div>
                                <Input label="Full Name" value={formData.parent_details.mother_name} onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, mother_name: e.target.value } })} />
                                <Input label="Phone" value={formData.parent_details.mother_phone} onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, mother_phone: e.target.value } })} />
                                <Input label="Occupation" value={formData.parent_details.mother_occupation} onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, mother_occupation: e.target.value } })} />
                            </div>
                        </div>

                        <Input
                            label="Primary Emergency Contact (REQUIRED)"
                            required
                            icon={Phone}
                            value={formData.parent_details.primary_contact}
                            onChange={(e) => setFormData({ ...formData, parent_details: { ...formData.parent_details, primary_contact: e.target.value } })}
                        />
                    </div>
                )}

                {/* Step 4: Transport */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] space-y-8 shadow-2xl shadow-indigo-500/30 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Truck size={120} />
                            </div>

                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-white tracking-tight">Fleet Integration</h3>
                                    <p className="text-indigo-100 text-xs font-black uppercase tracking-widest opacity-80">School Bus tracking & Logistics</p>
                                </div>
                                <div className="flex items-center space-x-3 bg-white/10 p-2 pr-4 rounded-3xl border border-white/20 backdrop-blur-xl">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-white/40 border-transparent bg-white/20"
                                            checked={formData.transport.is_using_bus}
                                            onChange={(e) => setFormData({ ...formData, transport: { ...formData.transport, is_using_bus: e.target.checked } })}
                                        />
                                    </div>
                                    <span className="font-extrabold text-white text-sm">Use School Transport</span>
                                </div>
                            </div>

                            {formData.transport.is_using_bus && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">Assigned Vehicle</label>
                                        <select
                                            className="w-full px-6 py-4.5 rounded-[1.5rem] bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/20 transition-all font-black"
                                            value={formData.transport.bus_id}
                                            onChange={handleBusChange}
                                        >
                                            <option value="">Select Fleet</option>
                                            {buses.map(bus => (
                                                <option key={bus._id} value={bus._id}>
                                                    {bus.vehicle_number} | {bus.model}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">Pick-up / Drop Point</label>
                                        {!formData.transport.bus_id ? (
                                            <div className="w-full px-6 py-4.5 rounded-[1.5rem] bg-indigo-500/20 border border-dashed border-white/30 text-white/50 flex items-center italic font-bold">
                                                <MapPin size={18} className="mr-3 opacity-50" />
                                                Please assign a vehicle first...
                                            </div>
                                        ) : !isAddingNewStop ? (
                                            <select
                                                className="w-full px-6 py-4.5 rounded-[1.5rem] bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/20 transition-all font-black"
                                                value={formData.transport.stop_name}
                                                onChange={(e) => {
                                                    if (e.target.value === 'add_new') setIsAddingNewStop(true);
                                                    else setFormData({ ...formData, transport: { ...formData.transport, stop_name: e.target.value } });
                                                }}
                                            >
                                                <option value="">Choose designated stop</option>
                                                {routeStops.map((stop, idx) => (
                                                    <option key={idx} value={stop.stop_name}>{stop.stop_name}</option>
                                                ))}
                                                <option value="add_new" className="text-indigo-600 font-black">+ Create Custom Location</option>
                                            </select>
                                        ) : (
                                            <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-2xl space-y-4">
                                                <input
                                                    className="w-full px-5 py-3.5 rounded-2xl bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/20 font-black placeholder-slate-400"
                                                    placeholder="Enter Location Title"
                                                    value={formData.transport.stop_name}
                                                    onChange={(e) => setFormData({ ...formData, transport: { ...formData.transport, stop_name: e.target.value } })}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input className="w-full px-5 py-3.5 rounded-xl bg-white/20 border border-white/20 text-white outline-none placeholder-white/40 text-xs font-bold" placeholder="Lat" value={formData.transport.latitude} onChange={(e) => setFormData({ ...formData, transport: { ...formData.transport, latitude: e.target.value } })} />
                                                    <input className="w-full px-5 py-3.5 rounded-xl bg-white/20 border border-white/20 text-white outline-none placeholder-white/40 text-xs font-bold" placeholder="Lng" value={formData.transport.longitude} onChange={(e) => setFormData({ ...formData, transport: { ...formData.transport, longitude: e.target.value } })} />
                                                </div>
                                                <button type="button" onClick={() => setIsAddingNewStop(false)} className="text-[10px] font-black text-white hover:underline uppercase tracking-widest pl-2">Return to list</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </form>

            <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-white/5 sticky bottom-0 bg-white dark:bg-slate-900 z-20 pb-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={step === 1 ? onCancel : prevStep}
                    className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                    {step === 1 ? 'Discard' : 'Go Back'}
                </Button>

                <div className="flex gap-4">
                    {step < totalSteps ? (
                        <Button
                            type="button"
                            onClick={nextStep}
                            disabled={!canGoNext}
                            className={clsx(
                                "px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                                canGoNext
                                    ? "bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105"
                                    : "bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed opacity-50"
                            )}
                        >
                            Next Milestone
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            loading={loading}
                            onClick={handleSubmit}
                            disabled={!canGoNext}
                            className={clsx(
                                "px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                                canGoNext
                                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 hover:scale-105"
                                    : "bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed opacity-50"
                            )}
                        >
                            {initialData ? 'Finalize Update' : 'Initialize Enrollment'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentForm;
