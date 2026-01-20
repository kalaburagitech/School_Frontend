import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bus, Mail, Lock, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, loading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            showToast('Welcome back!', 'success', 'You have successfully signed in.');
        } else {
            setError(res.message || 'The credentials you entered are incorrect.');
            showToast('Login failed', 'error', res.message || 'Please check your email and password.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen flex selection:bg-indigo-500/30">
            {/* Left Side: Visual/Branding */}
            <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />

                <div className="relative z-10 text-center space-y-8 max-w-md px-12">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/40 animate-in zoom-in-50 duration-1000">
                        <Bus className="text-white" size={40} />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Antigravity</h1>
                        <p className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-sm">Fleet Intelligence System</p>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        Experience the pinacle of school bus management. Fast, secure, and visually stunning intelligence at your fingertips.
                    </p>
                    <div className="flex items-center justify-center space-x-6 pt-4">
                        <div className="flex flex-col items-center">
                            <span className="text-white font-black text-2xl">100%</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Reliability</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-white font-black text-2xl">256-bit</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 bg-white dark:bg-slate-950 flex items-center justify-center p-8 md:p-12 relative overflow-hidden">
                {/* Mobile top branding */}
                <div className="lg:hidden absolute top-12 left-12 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Bus className="text-white" size={24} />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">Antigravity</h2>
                </div>

                <div className="w-full max-w-sm space-y-10 animate-in slide-in-from-right-8 duration-700">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Sign in</h2>
                        <p className="text-slate-500 font-medium italic">Welcome back! Please enter your details.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                label="Email address"
                                type="email"
                                placeholder="name@school.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12"
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-start space-x-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 animate-in shake duration-500">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer" />
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">Remember me</span>
                            </label>
                            <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-all">Forgot password?</button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-black tracking-wide shadow-xl shadow-indigo-600/20"
                        >
                            Sign in to Dashboard
                            <ChevronRight size={20} className="ml-2" />
                        </Button>
                    </form>

                    <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center space-x-2">
                                <Activity size={12} className="text-emerald-500" />
                                <span>All systems operational</span>
                            </div>
                            <span>v4.0.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
