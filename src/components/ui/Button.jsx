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
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        outline: "border-2 border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600",
        ghost: "text-slate-600 hover:bg-slate-100"
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
