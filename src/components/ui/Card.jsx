const Card = ({ 
    children, 
    className = '', 
    padding = 'md', 
    hover = true,
    animate = false,
    ...props 
}) => {
    const paddings = {
        none: "p-0",
        sm: "p-4 md:p-6",
        md: "p-8 md:p-10",
        lg: "p-12 md:p-16"
    };

    const baseStyles = "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-300";
    const hoverStyles = hover ? "hover:shadow-2xl hover:-translate-y-1" : "";
    const animateStyles = animate ? "animate-fade-in" : "";

    return (
        <div 
            className={`${baseStyles} ${hoverStyles} ${animateStyles} ${paddings[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
