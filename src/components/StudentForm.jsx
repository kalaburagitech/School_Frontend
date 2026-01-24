import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import api from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Shield, Phone, MapPin, Truck, Calendar, GraduationCap, CheckCircle, Camera, AlertCircle } from 'lucide-react';

// Move validation rules outside component to prevent recreation
const validationRules = {
    aadhaar_number: (value) => {
        if (!value) return 'Aadhaar number is required';
        if (!/^\d{12}$/.test(value)) return 'Aadhaar must be 12 digits';
        return '';
    },
    first_name: (value) => {
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (!/^[A-Za-z\s]+$/.test(value)) return 'First name can only contain letters and spaces';
        return '';
    },
    last_name: (value) => {
        if (!value) return 'Last name is required';
        if (value.length < 1) return 'Last name is required';
        if (!/^[A-Za-z\s]+$/.test(value)) return 'Last name can only contain letters and spaces';
        return '';
    },
    dob: (value) => {
        if (!value) return 'Date of birth is required';
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();

        if (dob > today) return 'Date of birth cannot be in the future';
        if (age < 3) return 'Student must be at least 3 years old';
        if (age > 22) return 'Student age seems invalid';
        return '';
    },
    gender: (value) => {
        if (!value) return 'Gender is required';
        return '';
    },
    blood_group: (value) => {
        if (value && !/^(A|B|AB|O)[+-]$/.test(value)) return 'Invalid blood group';
        return '';
    },
    address: {
        address_line: (value) => {
            if (!value) return 'Address line is required';
            if (value.length < 5) return 'Address is too short';
            return '';
        },
        city: (value) => {
            if (!value) return 'City is required';
            if (value.length < 2) return 'City name is too short';
            return '';
        },
        pincode: (value) => {
            if (!value) return 'Pincode is required';
            if (!/^\d{6}$/.test(value)) return 'Pincode must be 6 digits';
            return '';
        }
    },
    class_info: {
        grade: (value) => {
            if (!value) return 'Class is required';
            return '';
        },
        section: (value) => {
            if (!value) return 'Section is required';
            if (value.length !== 1) return 'Section must be a single character';
            return '';
        }
    },
    parent_details: {
        father_name: (value) => {
            if (!value) return "Father's name is required";
            if (value.length < 2) return 'Name is too short';
            return '';
        },
        father_phone: (value) => {
            if (!value) return "Father's phone is required";
            if (!/^\d{10}$/.test(value)) return 'Phone must be 10 digits';
            return '';
        },
        mother_name: (value) => {
            if (value && value.length < 2) return 'Name is too short';
            return '';
        },
        mother_phone: (value) => {
            if (value && !/^\d{10}$/.test(value)) return 'Phone must be 10 digits';
            return '';
        },
        primary_contact: (value) => {
            if (!value) return 'Primary contact is required';
            if (!/^\d{10}$/.test(value)) return 'Phone must be 10 digits';
            return '';
        }
    }
};

const StudentForm = ({ initialData, onSubmit, onCancel, loading }) => {
    // State declarations
    const [buses, setBuses] = useState([]);
    const [routeStops, setRouteStops] = useState([]);
    const [isAddingNewStop, setIsAddingNewStop] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [step, setStep] = useState(1);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const totalSteps = 4;

    // Form data state
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

    // Memoize validateField function
    const validateField = useCallback((field, value, parent = null) => {
        try {
            if (parent) {
                // Handle nested validation (e.g., address.city)
                if (typeof validationRules[parent] === 'object' && validationRules[parent][field]) {
                    return validationRules[parent][field](value);
                }
            } else if (validationRules[field]) {
                return validationRules[field](value);
            }
        } catch (error) {
            console.error(`Validation error for field ${field}:`, error);
        }
        return '';
    }, []);

    // Memoize validateStep function
    const validateStep = useCallback((stepNumber, formDataToValidate) => {
        const stepErrors = {};

        switch (stepNumber) {
            case 1:
                stepErrors.aadhaar_number = validateField('aadhaar_number', formDataToValidate.aadhaar_number);
                stepErrors.first_name = validateField('first_name', formDataToValidate.first_name);
                stepErrors.last_name = validateField('last_name', formDataToValidate.last_name);
                break;
            case 2:
                stepErrors.dob = validateField('dob', formDataToValidate.dob);
                stepErrors.gender = validateField('gender', formDataToValidate.gender);
                stepErrors.address_line = validateField('address_line', formDataToValidate.address.address_line, 'address');
                stepErrors.city = validateField('city', formDataToValidate.address.city, 'address');
                stepErrors.pincode = validateField('pincode', formDataToValidate.address.pincode, 'address');
                break;
            case 3:
                stepErrors.grade = validateField('grade', formDataToValidate.class_info.grade, 'class_info');
                stepErrors.section = validateField('section', formDataToValidate.class_info.section, 'class_info');
                stepErrors.father_name = validateField('father_name', formDataToValidate.parent_details.father_name, 'parent_details');
                stepErrors.father_phone = validateField('father_phone', formDataToValidate.parent_details.father_phone, 'parent_details');
                stepErrors.primary_contact = validateField('primary_contact', formDataToValidate.parent_details.primary_contact, 'parent_details');
                break;
            default:
                break;
        }

        // Filter out empty errors
        return Object.fromEntries(
            Object.entries(stepErrors).filter(([_, value]) => value !== '')
        );
    }, [validateField]);

    // Calculate if current step is valid
    const isCurrentStepValid = useMemo(() => {
        const stepErrors = validateStep(step, formData);
        return Object.keys(stepErrors).length === 0;
    }, [step, formData, validateStep]);

    // Handle field blur
    const handleBlur = useCallback((field, parent = null) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        let value;
        if (parent) {
            const keys = parent.split('.');
            if (keys.length === 1) {
                value = formData[parent][field];
            } else {
                value = formData[keys[0]][keys[1]][field];
            }
        } else {
            value = formData[field];
        }

        const error = validateField(field, value, parent);
        setErrors(prev => ({ ...prev, [field]: error }));
    }, [formData, validateField]);

    // Fetch buses and set initial data
    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const { data } = await api.get('/buses');
                setBuses(data);
            } catch (err) {
                console.error('Failed to fetch buses', err);
            }
        };
        fetchBuses();
    }, []);

    // Set initial form data
    useEffect(() => {
        if (!initialData) return;

        const newFormData = {
            student_id: initialData.student_id || '',
            aadhaar_number: initialData.aadhaar_number || '',
            first_name: initialData.full_name?.split(' ')[0] || '',
            last_name: initialData.full_name?.split(' ').slice(1).join(' ') || '',
            dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
            gender: initialData.gender || 'Male',
            blood_group: initialData.blood_group || '',
            religion: initialData.religion || '',
            nationality: initialData.nationality || 'Indian',
            class_info: {
                grade: initialData.class_info?.grade || '',
                section: initialData.class_info?.section || '',
                academic_year: initialData.class_info?.academic_year || new Date().getFullYear().toString()
            },
            parent_details: {
                father_name: initialData.family?.father?.name || '',
                father_phone: initialData.family?.father?.phone || '',
                father_occupation: initialData.family?.father?.occupation || '',
                mother_name: initialData.family?.mother?.name || '',
                mother_phone: initialData.family?.mother?.phone || '',
                mother_occupation: initialData.family?.mother?.occupation || '',
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
            transport: {
                is_using_bus: !!initialData.transport?.bus_id,
                bus_id: initialData.transport?.bus_id?._id || initialData.transport?.bus_id || '',
                route_id: initialData.transport?.route_id?._id || initialData.transport?.route_id || '',
                stop_name: initialData.transport?.stop_name || '',
                latitude: initialData.transport?.latitude || '',
                longitude: initialData.transport?.longitude || ''
            }
        };

        setFormData(newFormData);
    }, [initialData]);

    // Handle bus change
    const handleBusChange = (e) => {
        const busId = e.target.value;
        const selectedBus = buses.find(b => b._id === busId);

        setFormData(prev => ({
            ...prev,
            transport: {
                ...prev.transport,
                bus_id: busId,
                route_id: selectedBus?.route_id?._id || '',
                stop_name: '',
                latitude: '',
                longitude: ''
            }
        }));

        setIsAddingNewStop(false);

        if (selectedBus?.route_id?.stops) {
            setRouteStops(selectedBus.route_id.stops);
        } else {
            setRouteStops([]);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate steps 1-3 (transport is optional)
        let allStepsValid = true;
        const allErrors = {};

        for (let stepNum = 1; stepNum <= 3; stepNum++) {
            const stepErrors = validateStep(stepNum, formData);
            if (Object.keys(stepErrors).length > 0) {
                allStepsValid = false;
                Object.assign(allErrors, stepErrors);
            }
        }

        if (!allStepsValid) {
            setErrors(allErrors);
            alert('Please fix all validation errors before submitting');
            return;
        }

        // Prepare data for submission
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

        // Clean up data
        if (!finalData.student_id || finalData.student_id === 'AUTO-GENERATE') {
            delete finalData.student_id;
        }

        if (!finalData.transport.is_using_bus || !finalData.transport.bus_id) {
            finalData.transport = { is_using_bus: false };
        }

        onSubmit(finalData);
    };

    // Field change handlers
    const handleAadhaarChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
        setFormData(prev => ({ ...prev, aadhaar_number: val }));

        if (touched.aadhaar_number) {
            const error = validateField('aadhaar_number', val);
            setErrors(prev => ({ ...prev, aadhaar_number: error }));
        }
    };

    const handlePhoneChange = (field, value) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 10);
        setFormData(prev => ({
            ...prev,
            parent_details: { ...prev.parent_details, [field]: numericValue }
        }));

        if (touched[field]) {
            const error = validateField(field, numericValue, 'parent_details');
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    // Handle photo upload
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

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
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Step navigation
    const nextStep = () => {
        const currentStepErrors = validateStep(step, formData);

        if (Object.keys(currentStepErrors).length === 0) {
            setStep(s => Math.min(s + 1, totalSteps));
            setErrors({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setErrors(currentStepErrors);
            const newTouched = { ...touched };
            Object.keys(currentStepErrors).forEach(key => {
                newTouched[key] = true;
            });
            setTouched(newTouched);
        }
    };

    const prevStep = () => {
        setStep(s => Math.max(s - 1, 1));
        setErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Steps configuration
    const steps = [
        { id: 1, title: 'Identity', icon: Shield },
        { id: 2, title: 'Personal', icon: User },
        { id: 3, title: 'Class & Family', icon: GraduationCap },
        { id: 4, title: 'Transport', icon: Truck }
    ];

    // Calculate age
    const age = useMemo(() => {
        if (!formData.dob) return null;
        const dob = new Date(formData.dob);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }, [formData.dob]);

    // Render steps progress
    const renderStepProgress = () => (
        <div className="flex items-center justify-between mb-8 px-2 md:px-4">
            {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center group">
                    <div className="flex flex-col items-center">
                        <div className={clsx(
                            "w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                            step >= s.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110"
                                : "bg-slate-100 dark:bg-white/5 text-slate-400"
                        )}>
                            <s.icon size={16} className="md:size-5" strokeWidth={2.5} />
                        </div>
                        <span className={clsx(
                            "text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-2 md:mt-3 transition-colors duration-500 hidden sm:block",
                            step >= s.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                        )}>{s.title}</span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={clsx(
                            "h-0.5 w-6 md:w-8 lg:w-24 mx-2 md:mx-4 rounded-full transition-all duration-1000",
                            step > s.id ? "bg-indigo-600" : "bg-slate-100 dark:bg-white/5"
                        )} />
                    )}
                </div>
            ))}
        </div>
    );

    // Render error banner
    const renderErrorBanner = () => {
        if (Object.keys(errors).length === 0) return null;

        return (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 mb-6 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                            Please fix the following errors:
                        </h4>
                        <ul className="mt-1 text-xs text-rose-700 dark:text-rose-400 space-y-1">
                            {Object.entries(errors).slice(0, 3).map(([field, error]) => (
                                <li key={field} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    {error}
                                </li>
                            ))}
                            {Object.keys(errors).length > 3 && (
                                <li className="text-rose-600 dark:text-rose-500">
                                    ...and {Object.keys(errors).length - 3} more
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    // Step 1: Identity
    const renderStep1 = () => (
        <div data-step="1" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-indigo-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div className="flex items-center gap-2 md:gap-3 text-indigo-900 dark:text-indigo-300">
                        <Shield size={20} className="md:size-6" strokeWidth={2.5} />
                        <h3 className="font-black text-lg md:text-2xl tracking-tight">Identity & Security</h3>
                    </div>
                    {(formData.first_name || formData.last_name) && (
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Application For</span>
                            <span className="font-black text-indigo-900 dark:text-white">{formData.first_name} {formData.last_name}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="space-y-1">
                        <Input
                            label="First Name"
                            required
                            value={formData.first_name}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                setFormData(prev => ({ ...prev, first_name: value }));
                            }}
                            onBlur={() => handleBlur('first_name')}
                            error={touched.first_name && errors.first_name}
                        />
                    </div>

                    <div className="space-y-1">
                        <Input
                            label="Last Name"
                            required
                            value={formData.last_name}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                setFormData(prev => ({ ...prev, last_name: value }));
                            }}
                            onBlur={() => handleBlur('last_name')}
                            error={touched.last_name && errors.last_name}
                        />
                    </div>

                    <div className="space-y-1">
                        <Input
                            label="Aadhaar Number"
                            value={formData.aadhaar_number}
                            onChange={handleAadhaarChange}
                            onBlur={() => handleBlur('aadhaar_number')}
                            maxLength={12}
                            placeholder="12-digit number"
                            required
                            error={touched.aadhaar_number && errors.aadhaar_number}
                        />
                        {formData.aadhaar_number?.length === 12 && !errors.aadhaar_number && (
                            <div className="flex items-center space-x-2 px-2 text-emerald-500">
                                <CheckCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verified Format</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">System Generated ID</label>
                        <div className="px-4 md:px-6 py-3 md:py-3.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-white/10 flex items-center justify-between group transition-all">
                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm md:text-base">
                                {formData.student_id || 'Auto Generated'}
                            </span>
                            <div className="p-1 px-2 md:px-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                Identity
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight px-2">Unique identifier for academic records</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 2: Personal Information
    const renderStep2 = () => (
        <div data-step="2" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Gender</label>
                        <select
                            className="input-field py-3 md:py-3.5 rounded-2xl"
                            value={formData.gender}
                            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                            onBlur={() => handleBlur('gender')}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        {touched.gender && errors.gender && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 ml-2">{errors.gender}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Input
                            label="Date of Birth"
                            type="date"
                            required
                            value={formData.dob}
                            onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                            onBlur={() => handleBlur('dob')}
                            error={touched.dob && errors.dob}
                        />
                        {age !== null && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                Age: <span className="font-bold text-indigo-600 dark:text-indigo-400">{age} years</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-slate-50 dark:bg-white/5 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                    {formData.documents.photo_url ? (
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800">
                            <img src={formData.documents.photo_url} alt="Student" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                            >
                                <Camera size={24} className="md:size-7" />
                                <span className="text-[10px] font-black uppercase mt-2">Change Image</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center hover:text-indigo-500 hover:border-indigo-500 transition-all bg-white dark:bg-slate-900"
                        >
                            {uploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-indigo-600"></div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 dark:bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-4">
                                        <Camera size={24} className="md:size-8" />
                                    </div>
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest px-3 md:px-4 text-center">Upload Portrait</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Blood Group</label>
                    <select
                        className="input-field py-3 md:py-3.5 rounded-2xl"
                        value={formData.blood_group}
                        onChange={(e) => setFormData(prev => ({ ...prev, blood_group: e.target.value }))}
                    >
                        <option value="">Select Group (Optional)</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Religion (Optional)"
                    value={formData.religion}
                    onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value }))}
                />

                <Input
                    label="Nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                <div className="md:col-span-2 space-y-1">
                    <Input
                        label="Address Line"
                        required
                        value={formData.address.address_line}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, address_line: e.target.value }
                        }))}
                        onBlur={() => handleBlur('address_line', 'address')}
                        error={touched.address_line && errors.address_line}
                    />
                </div>

                <div className="space-y-1">
                    <Input
                        label="City"
                        required
                        value={formData.address.city}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                            setFormData(prev => ({
                                ...prev,
                                address: { ...prev.address, city: value }
                            }));
                        }}
                        onBlur={() => handleBlur('city', 'address')}
                        error={touched.city && errors.city}
                    />
                </div>

                <div className="space-y-1">
                    <Input
                        label="Pincode"
                        required
                        value={formData.address.pincode}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setFormData(prev => ({
                                ...prev,
                                address: { ...prev.address, pincode: value }
                            }));
                        }}
                        onBlur={() => handleBlur('pincode', 'address')}
                        maxLength={6}
                        error={touched.pincode && errors.pincode}
                    />
                </div>
            </div>
        </div>
    );

    // Step 3: Academic & Family
    const renderStep3 = () => (
        <div data-step="3" className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Class</label>
                    <select
                        className="input-field py-3 md:py-3.5 rounded-2xl"
                        required
                        value={formData.class_info.grade}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            class_info: { ...prev.class_info, grade: e.target.value }
                        }))}
                        onBlur={() => handleBlur('grade', 'class_info')}
                    >
                        <option value="">Select Class</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>Class {n}</option>
                        ))}
                    </select>
                    {touched.grade && errors.grade && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 ml-2">{errors.grade}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <Input
                        label="Section"
                        required
                        value={formData.class_info.section}
                        onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
                            setFormData(prev => ({
                                ...prev,
                                class_info: { ...prev.class_info, section: value }
                            }));
                        }}
                        onBlur={() => handleBlur('section', 'class_info')}
                        maxLength={1}
                        error={touched.section && errors.section}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/5 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-4 md:space-y-6">
                    <div className="flex items-center space-x-3 mb-1 md:mb-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">F</div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Father's Details</h4>
                    </div>

                    <div className="space-y-1">
                        <Input
                            label="Full Name"
                            required
                            value={formData.parent_details.father_name}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                parent_details: { ...prev.parent_details, father_name: e.target.value }
                            }))}
                            onBlur={() => handleBlur('father_name', 'parent_details')}
                            error={touched.father_name && errors.father_name}
                        />
                    </div>

                    <div className="space-y-1">
                        <Input
                            label="Phone"
                            required
                            value={formData.parent_details.father_phone}
                            onChange={(e) => handlePhoneChange('father_phone', e.target.value)}
                            onBlur={() => handleBlur('father_phone', 'parent_details')}
                            maxLength={10}
                            error={touched.father_phone && errors.father_phone}
                        />
                    </div>

                    <Input
                        label="Occupation (Optional)"
                        value={formData.parent_details.father_occupation}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            parent_details: { ...prev.parent_details, father_occupation: e.target.value }
                        }))}
                    />
                </div>

                <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/5 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-4 md:space-y-6">
                    <div className="flex items-center space-x-3 mb-1 md:mb-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-xl flex items-center justify-center font-black text-xs">M</div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Mother's Details (Optional)</h4>
                    </div>

                    <Input
                        label="Full Name (Optional)"
                        value={formData.parent_details.mother_name}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            parent_details: { ...prev.parent_details, mother_name: e.target.value }
                        }))}
                    />

                    <Input
                        label="Phone (Optional)"
                        value={formData.parent_details.mother_phone}
                        onChange={(e) => handlePhoneChange('mother_phone', e.target.value)}
                        maxLength={10}
                    />

                    <Input
                        label="Occupation (Optional)"
                        value={formData.parent_details.mother_occupation}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            parent_details: { ...prev.parent_details, mother_occupation: e.target.value }
                        }))}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Input
                    label="Primary Emergency Contact (REQUIRED)"
                    required
                    icon={Phone}
                    value={formData.parent_details.primary_contact}
                    onChange={(e) => handlePhoneChange('primary_contact', e.target.value)}
                    onBlur={() => handleBlur('primary_contact', 'parent_details')}
                    maxLength={10}
                    error={touched.primary_contact && errors.primary_contact}
                />
            </div>
        </div>
    );

    // Step 4: Transport
    const renderStep4 = () => (
        <div data-step="4" className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-10 rounded-2xl md:rounded-[3rem] space-y-6 md:space-y-8 shadow-2xl shadow-indigo-500/30 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                    <Truck size={80} className="md:size-[120px]" />
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-0 relative z-10">
                    <div className="space-y-2">
                        <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">Fleet Integration</h3>
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest opacity-80">School Bus tracking & Logistics</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/10 p-2 pr-3 md:pr-4 rounded-2xl md:rounded-3xl border border-white/20 backdrop-blur-xl w-fit">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-white">
                            <input
                                type="checkbox"
                                className="w-5 h-5 md:w-6 md:h-6 rounded-lg text-indigo-600 focus:ring-white/40 border-transparent bg-white/20"
                                checked={formData.transport.is_using_bus}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    transport: { ...prev.transport, is_using_bus: e.target.checked }
                                }))}
                            />
                        </div>
                        <span className="font-extrabold text-white text-sm">Enable School Bus Access</span>
                    </div>
                </div>

                {formData.transport.is_using_bus && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in zoom-in-95 duration-500 relative z-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">Assigned Vehicle</label>
                            <select
                                className="w-full px-4 md:px-6 py-3.5 md:py-4.5 rounded-xl md:rounded-[1.5rem] bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/20 font-black text-sm md:text-base"
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

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">Pick-up / Drop Point</label>
                            {!formData.transport.bus_id ? (
                                <div className="w-full px-4 md:px-6 py-3.5 md:py-4.5 rounded-xl md:rounded-[1.5rem] bg-indigo-500/20 border border-dashed border-white/30 text-white/50 flex items-center italic font-bold text-sm md:text-base">
                                    <MapPin size={16} className="mr-2 md:mr-3 opacity-50" />
                                    Please assign a vehicle first...
                                </div>
                            ) : !isAddingNewStop ? (
                                <select
                                    className="w-full px-4 md:px-6 py-3.5 md:py-4.5 rounded-xl md:rounded-[1.5rem] bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/20 font-black text-sm md:text-base"
                                    value={formData.transport.stop_name}
                                    onChange={(e) => {
                                        if (e.target.value === 'add_new') setIsAddingNewStop(true);
                                        else setFormData(prev => ({
                                            ...prev,
                                            transport: { ...prev.transport, stop_name: e.target.value }
                                        }));
                                    }}
                                >
                                    <option value="">Choose designated stop</option>
                                    {routeStops.map((stop, idx) => (
                                        <option key={idx} value={stop.stop_name}>{stop.stop_name}</option>
                                    ))}
                                    <option value="add_new" className="text-indigo-600 font-black">+ Create Custom Location</option>
                                </select>
                            ) : (
                                <div className="p-4 md:p-6 bg-white/10 rounded-2xl md:rounded-3xl border border-white/20 backdrop-blur-2xl space-y-3 md:space-y-4">
                                    <input
                                        className="w-full px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/20 font-black placeholder-slate-400 text-sm md:text-base"
                                        placeholder="Enter Location Title"
                                        value={formData.transport.stop_name}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            transport: { ...prev.transport, stop_name: e.target.value }
                                        }))}
                                    />

                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <input
                                            className="w-full px-4 md:px-5 py-3 md:py-3.5 rounded-lg md:rounded-xl bg-white/20 border border-white/20 text-white outline-none placeholder-white/40 text-xs font-bold"
                                            placeholder="Latitude"
                                            value={formData.transport.latitude}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^-0-9.]/g, '');
                                                setFormData(prev => ({
                                                    ...prev,
                                                    transport: { ...prev.transport, latitude: value }
                                                }));
                                            }}
                                        />

                                        <input
                                            className="w-full px-4 md:px-5 py-3 md:py-3.5 rounded-lg md:rounded-xl bg-white/20 border border-white/20 text-white outline-none placeholder-white/40 text-xs font-bold"
                                            placeholder="Longitude"
                                            value={formData.transport.longitude}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^-0-9.]/g, '');
                                                setFormData(prev => ({
                                                    ...prev,
                                                    transport: { ...prev.transport, longitude: value }
                                                }));
                                            }}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsAddingNewStop(false)}
                                        className="text-[10px] font-black text-white hover:underline uppercase tracking-widest pl-2"
                                    >
                                        Return to list
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Render current step
    const renderCurrentStep = () => {
        switch (step) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return renderStep1();
        }
    };

    // Render footer buttons
    const renderFooter = () => (
        <div className="flex justify-between items-center pt-6 md:pt-8 border-t border-slate-100 dark:border-white/5 sticky bottom-0 bg-white dark:bg-slate-900 z-20 pb-2 px-1">
            <Button
                type="button"
                variant="secondary"
                onClick={step === 1 ? onCancel : prevStep}
                className="px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
                {step === 1 ? 'Discard' : 'Go Back'}
            </Button>

            <div className="flex gap-3 md:gap-4">
                {step < totalSteps ? (
                    <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!isCurrentStepValid}
                        className={clsx(
                            "px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                            isCurrentStepValid
                                ? "bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105"
                                : "bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        Next Milestone
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        loading={loading}
                        onClick={handleSubmit}
                        className="px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
                    >
                        {initialData ? 'Finalize Update' : 'Initialize Enrollment'}
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {renderStepProgress()}
            {renderErrorBanner()}

            <form onSubmit={handleSubmit} className="space-y-8 max-h-[65vh] overflow-y-auto px-1 scrollbar-hide py-2">
                {renderCurrentStep()}
            </form>

            {renderFooter()}
        </div>
    );
};

export default StudentForm;