import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { GraduationCap, Truck, Briefcase, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../context/ToastContext';
import TeacherForm from '../components/TeacherForm';
import DriverForm from '../components/DriverForm';
import StaffForm from '../components/StaffForm';
import StudentForm from '../components/StudentForm';

const EmployeeRegistration = () => {
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam && ['teacher', 'driver', 'staff', 'student'].includes(roleParam)) {
            setRole(roleParam);
        }
    }, [searchParams]);

    const handleTeacherSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/teachers', formData);
            showToast('Teacher Registered', 'success', 'New teacher profile created successfully.');
            setRole(''); // Reset
        } catch (error) {
            console.error('Submit failed', error);
            showToast('Registration Failed', 'error', error.response?.data?.message || 'Could not register teacher.');
        } finally {
            setLoading(false);
        }
    };

    const handleDriverSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/drivers', formData);
            showToast('Driver Registered', 'success', 'New driver profile created successfully.');
            setRole('');
        } catch (error) {
            console.error('Submit failed', error);
            showToast('Registration Failed', 'error', error.response?.data?.message || 'Could not register driver.');
        } finally {
            setLoading(false);
        }
    };

    const handleStaffSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/users', {
                ...formData,
                password: 'password123', // Default
                role: formData.role_type
            });
            showToast('Staff Registered', 'success', 'New staff member added successfully.');
            setRole('');
        } catch (error) {
            console.error('Submit failed', error);
            const errorMsg = error.response?.data?.message || 'Could not register staff.';
            showToast('Registration Failed', 'error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSubmit = async (formData) => {
        setLoading(true);
        try {
            await api.post('/students', formData);
            showToast('Student Enrolled', 'success', `${formData.full_name} has been registered successfully.`);
            setRole('');
        } catch (error) {
            console.error('Submit failed', error);
            showToast('Enrollment Failed', 'error', error.response?.data?.message || 'Could not register student.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Onboarding</h1>
                <p className="text-slate-500 font-medium italic">"Every great journey begins with a single step." — Select a role to start.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[500px]">

                {/* Role Selection Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { id: 'student', icon: UserPlus, label: 'Student', color: 'indigo' },
                        { id: 'teacher', icon: GraduationCap, label: 'Teacher', color: 'emerald' },
                        { id: 'driver', icon: Truck, label: 'Driver', color: 'amber' },
                        { id: 'staff', icon: Briefcase, label: 'Staff', color: 'rose' }
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setRole(item.id)}
                            className={clsx(
                                "cursor-pointer p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden",
                                role === item.id
                                    ? `border-${item.color}-600 bg-${item.color}-50 dark:bg-${item.color}-900/10 text-${item.color}-600 shadow-lg transform scale-105`
                                    : "border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:-translate-y-1"
                            )}
                        >
                            <item.icon size={32} strokeWidth={1.5} className={clsx("transition-transform group-hover:scale-110", role === item.id && "animate-bounce")} />
                            <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Conditional Form Rendering */}
                <div className="mt-8">
                    {!role && (
                        <div className="text-center py-24 text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <UserPlus size={40} strokeWidth={1} />
                            </div>
                            <p className="text-lg font-medium">Please select an onboarding role above</p>
                        </div>
                    )}

                    {role === 'student' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Academic Enrollment</h2>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">New Student Profile</p>
                            </div>
                            <StudentForm
                                onSubmit={handleStudentSubmit}
                                onCancel={() => setRole('')}
                                loading={loading}
                            />
                        </div>
                    )}

                    {role === 'teacher' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Faculty Registration</h2>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Academic & Transport Scope</p>
                            </div>
                            <TeacherForm
                                onSubmit={handleTeacherSubmit}
                                onCancel={() => setRole('')}
                                loading={loading}
                            />
                        </div>
                    )}

                    {role === 'driver' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Logistic Operator</h2>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">License & Fleet Assignment</p>
                            </div>
                            <DriverForm
                                onSubmit={handleDriverSubmit}
                                onCancel={() => setRole('')}
                                loading={loading}
                            />
                        </div>
                    )}

                    {role === 'staff' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Administrative Access</h2>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">System Permissions & Metadata</p>
                            </div>
                            <StaffForm
                                onSubmit={handleStaffSubmit}
                                onCancel={() => setRole('')}
                                loading={loading}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeRegistration;
