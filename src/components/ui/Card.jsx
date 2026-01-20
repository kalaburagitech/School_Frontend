import clsx from 'clsx';

const Card = ({ children, className, glass = false }) => {
    return (
        <div className={clsx(
            glass ? 'glass-card' : 'bg-white rounded-2xl shadow-premium border border-slate-100',
            'p-6',
            className
        )}>
            {children}
        </div>
    );
};

export default Card;
