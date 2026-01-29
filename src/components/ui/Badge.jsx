import React from 'react';
import clsx from 'clsx';

const Badge = ({ children, className }) => {
    return (
        <span className={clsx(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors",
            className
        )}>
            {children}
        </span>
    );
};

export { Badge };
export default Badge;
