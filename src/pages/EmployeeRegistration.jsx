import { useState } from 'react';
import api from '../utils/api';
import { GraduationCap, Truck, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../context/ToastContext';
import TeacherForm from '../components/TeacherForm';
import DriverForm from '../components/DriverForm';
import StaffForm from '../components/StaffForm';

const EmployeeRegistration = () => {
    const { showToast } = useToast();
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

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
            // Staff creation goes to /users with expanded profile creation logic in backend
            // We need to ensure the backend supports the 'staff' flow we built earlier
            await api.post('/users', {
                ...formData,
                password: 'password123', // Default
                role: formData.role_type
            });
            showToast('Staff Registered', 'success', 'New staff member added successfully.');
            setRole('');
        } catch (error) {
            console.error('Submit failed', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.message || 'Could not register staff.';
            showToast('Registration Failed', 'error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employee Onboarding</h1>
                <p className="text-slate-500">Select a role to begin the registration process.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[500px]">

                {/* Role Selection Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { id: 'teacher', icon: GraduationCap, label: 'Teacher' },
                        { id: 'driver', icon: Truck, label: 'Driver' },
                        { id: 'staff', icon: Briefcase, label: 'Staff / Admin' }
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setRole(item.id)}
                            className={clsx(
                                "cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3",
                                role === item.id
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 shadow-md transform scale-105"
                                    : "border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                            )}
                        >
                            <item.icon size={32} strokeWidth={1.5} />
                            <span className="font-bold text-lg">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Conditional Form Rendering */}
                <div className="mt-8">
                    {!role && (
                        <div className="text-center py-12 text-slate-400">
                            <p>Please select an employee role above to view the registration form.</p>
                        </div>
                    )}

                    {role === 'teacher' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Teacher Profile</h2>
                                <p className="text-sm text-slate-500">Academic & Transport Details</p>
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
                            <div className="mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Driver Profile</h2>
                                <p className="text-sm text-slate-500">License & Vehicle Assignment</p>
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
                            <div className="mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Staff / Admin</h2>
                                <p className="text-sm text-slate-500">System Access & Role Configuration</p>
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
