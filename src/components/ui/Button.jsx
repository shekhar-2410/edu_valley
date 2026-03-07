const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    type = 'button',
    icon: Icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98]";

    const variants = {
        primary: "bg-brand-crimson-600 text-white hover:bg-brand-crimson-700 shadow-lg shadow-brand-crimson-600/20",
        secondary: "bg-brand-navy-50 text-brand-navy-700 hover:bg-brand-navy-100",
        outline: "border-2 border-brand-navy-200 text-brand-navy-600 hover:border-brand-crimson-600 hover:text-brand-crimson-600",
        ghost: "text-brand-navy-600 hover:bg-brand-navy-50"
    };

    const sizes = {
        sm: "px-4 py-2 text-xs rounded-lg",
        md: "px-6 py-3 text-sm rounded-xl",
        lg: "px-8 py-4 text-base rounded-2xl"
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
            {children}
        </button>
    );
};

export default Button;
