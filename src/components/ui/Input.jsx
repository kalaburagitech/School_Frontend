import clsx from 'clsx';

const Input = ({ label, error, className, ...props }) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="text-sm font-semibold text-slate-700 ml-1">
                    {label}
                </label>
            )}
            <input
                className={clsx(
                    'input-field',
                    error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
                    className
                )}
                value={props.value ?? ''}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};

export default Input;
