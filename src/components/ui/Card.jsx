import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className }) => (
    <div className={clsx("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const CardHeader = ({ children, className }) => (
    <div className={clsx("p-6 pb-3 border-b border-slate-100 dark:border-slate-700", className)}>
        {children}
    </div>
);

const CardTitle = ({ children, className }) => (
    <h3 className={clsx("text-lg font-bold text-slate-800 dark:text-slate-100", className)}>
        {children}
    </h3>
);

const CardContent = ({ children, className }) => (
    <div className={clsx("p-6", className)}>
        {children}
    </div>
);

export { Card, CardHeader, CardTitle, CardContent };
export default Card;
