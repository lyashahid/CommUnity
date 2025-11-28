import React from 'react';
import { colors } from '../../theme/colors';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full 
            ${icon ? 'pl-11' : 'pl-4'} 
            pr-4 py-3.5 
            bg-white border border-gray-200 
            text-brand-dark placeholder-gray-400 
            rounded-2xl 
            focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-transparent
            transition-all duration-200
            shadow-sm
          `}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};