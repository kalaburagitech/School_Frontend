import { useState, useRef } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Mail, Shield, Camera, Lock, Key, ChevronRight, Save, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import clsx from 'clsx';
import Skeleton from './ui/Skeleton';

const ProfileModal = ({ onCancel }) => {
    const { user, updateUser, logout } = useAuth();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || user?.email?.split('@')[0] || 'Admin',
        email: user?.email || '',
        role: user?.role || 'Administrator',
        profile_image: user?.profile_image || null
    });

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, profile_image: reader.result }));
        };
        reader.readAsDataURL(file);

        // Upload to server
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        setUploading(true);
        try {
            const { data } = await api.post('/auth/profile-image', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update profile with new image URL
            await api.put('/auth/profile', { profile_image: data.imageUrl });
            updateUser({ profile_image: data.imageUrl });
            showToast('Profile image updated successfully.', 'success');
        } catch (error) {
            showToast('Failed to upload image.', 'error', error.response?.data?.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', {
                full_name: formData.full_name,
                email: formData.email
            });
            updateUser(data);
            showToast('Profile Updated', 'success', 'Your personal details have been saved successfully.');
            // onCancel(); // Optional: close on save
        } catch (error) {
            showToast('Update Failed', 'error', error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast('Passwords do not match', 'error', 'Please make sure both passwords are identical.');
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/password', {
                currentPassword: passwordData.current,
                newPassword: passwordData.new
            });
            showToast('Password Updated', 'success');
            setPasswordData({ current: '', new: '', confirm: '' });
            setActiveTab('general');
        } catch (error) {
            showToast('Password Update Failed', 'error', error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 p-1">
                {/* Navigation / Sidebar Info */}
                <div className="md:col-span-4 space-y-6">
                    <div className="relative group">
                        <div className="relative overflow-hidden w-full aspect-square rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500 border-4 border-white dark:border-slate-800">
                            {formData.profile_image ? (
                                <img
                                    src={formData.profile_image.startsWith('/') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://school-backend-61j7.onrender.com'}${formData.profile_image}` : formData.profile_image}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt="Profile"
                                />
                            ) : (
                                <span className="text-6xl font-black text-white/90 drop-shadow-lg">
                                    {formData.full_name.charAt(0).toUpperCase()}
                                </span>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                {uploading ? (
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Uploading...</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-4 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                                    >
                                        <Camera size={24} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <h2 className="text-2xl font-black tracking-tight dark:text-white capitalize truncate">{formData.full_name}</h2>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                            {formData.role}
                        </div>
                    </div>

                    <nav className="flex flex-col space-y-2">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={clsx(
                                "flex items-center space-x-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                                activeTab === 'general'
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-400"
                            )}
                        >
                            <UserCircle size={20} className={activeTab === 'general' ? "animate-pulse" : ""} />
                            <span>General Information</span>
                            {activeTab === 'general' && <ChevronRight size={16} className="ml-auto" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={clsx(
                                "flex items-center space-x-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                                activeTab === 'security'
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-400"
                            )}
                        >
                            <Lock size={20} className={activeTab === 'security' ? "animate-pulse" : ""} />
                            <span>Password & Security</span>
                            {activeTab === 'security' && <ChevronRight size={16} className="ml-auto" />}
                        </button>
                    </nav>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                        <button
                            onClick={logout}
                            className="flex items-center space-x-3 w-full px-5 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="md:col-span-8">
                    {activeTab === 'general' ? (
                        <div className="animate-in slide-in-from-right-8 duration-500 space-y-8">
                            <div className="relative">
                                <h3 className="text-3xl font-black dark:text-white tracking-tight">Personal Details</h3>
                                <p className="text-slate-500 font-medium">Keep your identity up to date on the platform.</p>
                                <div className="absolute -left-4 top-2 bottom-2 w-1.5 bg-indigo-600 rounded-full"></div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black dark:text-slate-400 uppercase tracking-widest flex items-center">
                                            <User size={14} className="mr-2 text-indigo-500" />
                                            Full Name
                                        </label>
                                        <div className="group relative">
                                            <Input
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                placeholder="Enter your name"
                                                className="h-14 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-500/20 dark:text-white font-bold transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black dark:text-slate-400 uppercase tracking-widest flex items-center">
                                            <Mail size={14} className="mr-2 text-indigo-500" />
                                            Email Address
                                        </label>
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="your@email.com"
                                            className="h-14 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-500/20 dark:text-white font-bold transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-amber-500/[0.03] border-2 border-amber-500/10 flex items-start space-x-4">
                                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-amber-700 dark:text-amber-500 tracking-tight">Identity Verification</h4>
                                        <p className="text-sm text-amber-600/80 font-medium mt-1">Changes to your name or email may require administrative review in some departments.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                                    >
                                        <Save size={20} className="mr-3" />
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-8 duration-500 space-y-8">
                            <div className="relative">
                                <h3 className="text-3xl font-black dark:text-white tracking-tight">Account Security</h3>
                                <p className="text-slate-500 font-medium">Secure your account with a complex passphrase.</p>
                                <div className="absolute -left-4 top-2 bottom-2 w-1.5 bg-indigo-600 rounded-full"></div>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black dark:text-slate-400 uppercase tracking-widest">Current Password</label>
                                        <Input
                                            type="password"
                                            value={passwordData.current}
                                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                            placeholder="••••••••"
                                            className="h-14 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-500/20 dark:text-white font-bold transition-all duration-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black dark:text-slate-400 uppercase tracking-widest">New Password</label>
                                            <Input
                                                type="password"
                                                value={passwordData.new}
                                                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                placeholder="••••••••"
                                                className="h-14 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-500/20 dark:text-white font-bold transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black dark:text-slate-400 uppercase tracking-widest">Confirm New</label>
                                            <Input
                                                type="password"
                                                value={passwordData.confirm}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                placeholder="••••••••"
                                                className="h-14 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-500/20 dark:text-white font-bold transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-600/5 dark:bg-indigo-600/[0.03] p-8 rounded-[2.5rem] border-2 border-indigo-600/10 space-y-4">
                                    <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                                        <Key size={24} className="animate-bounce" />
                                        <h4 className="font-black text-xl tracking-tight">Security Protocol</h4>
                                    </div>
                                    <ul className="space-y-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        <li className="flex items-center"><ChevronRight size={14} className="mr-2 text-indigo-500" /> Minimum 8 characters recommended</li>
                                        <li className="flex items-center"><ChevronRight size={14} className="mr-2 text-indigo-500" /> Use symbols and numbers for better security</li>
                                        <li className="flex items-center"><ChevronRight size={14} className="mr-2 text-indigo-500" /> Avoid common or repetitive patterns</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                                    >
                                        <Shield size={20} className="mr-3" />
                                        Update Credentials
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
