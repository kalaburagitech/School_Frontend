import { X } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, className, maxWidth = "max-w-2xl" }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-12">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />
            <div className={clsx(
                "relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-white/5",
                maxWidth,
                className
            )}>
                <div className="flex items-center justify-between p-8 pb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
                        <div className="h-1 w-12 bg-primary rounded-full mt-2" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-red-500 hover:rotate-90"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 pt-4 overflow-y-auto max-h-[85vh] scrollbar-hide">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
