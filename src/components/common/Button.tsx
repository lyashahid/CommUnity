import React from 'react';
import { colors } from '../../theme/colors';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'social';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center px-6 py-3.5 rounded-2xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-brand-green text-white shadow-lg shadow-brand-green/30 hover:bg-[#466a46] hover:shadow-[#466a46]/30",
    secondary: "bg-brand-brown text-white shadow-lg shadow-brand-brown/30 hover:bg-[#8c5e3e]",
    ghost: "bg-transparent text-brand-dark hover:bg-brand-dark/5",
    outline: "bg-transparent border-2 border-brand-dark/10 text-brand-dark hover:border-brand-dark/30",
    social: "bg-white border border-gray-100 text-brand-dark shadow-sm hover:bg-gray-50"
  };

  const width = fullWidth ? "w-full" : "w-auto";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`} 
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};