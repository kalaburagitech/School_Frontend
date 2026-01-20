import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', description = '') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type, description }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-6 right-6 z-[10001] flex flex-col gap-3 w-full max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={clsx(
                            "group relative flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-500 animate-in slide-in-from-right-10",
                            toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:bg-emerald-500/5",
                            toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-500 dark:bg-red-500/5",
                            toast.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-500 dark:bg-amber-500/5",
                            toast.type === 'info' && "bg-primary/10 border-primary/20 text-primary dark:bg-primary/5"
                        )}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'warning' && <AlertTriangle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold leading-tight">{toast.message}</h4>
                            {toast.description && (
                                <p className="mt-1 text-xs opacity-70 font-medium leading-relaxed">{toast.description}</p>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-current opacity-40 hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
