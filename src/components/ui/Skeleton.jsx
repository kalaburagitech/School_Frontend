import clsx from 'clsx';

const Skeleton = ({ className, variant = 'rect' }) => {
    return (
        <div
            className={clsx(
                "animate-pulse bg-slate-200 dark:bg-slate-800",
                variant === 'circle' ? "rounded-full" : "rounded-xl",
                className
            )}
        />
    );
};

export default Skeleton;
