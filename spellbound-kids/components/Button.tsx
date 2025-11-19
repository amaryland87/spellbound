import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-full shadow-[0_4px_0_rgb(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-yellow-400 text-yellow-900 hover:bg-yellow-300 border-b-4 border-yellow-600",
    secondary: "bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50",
    success: "bg-green-500 text-white border-b-4 border-green-700 hover:bg-green-400",
  };

  const sizes = {
    md: "px-6 py-3 text-lg",
    lg: "px-10 py-4 text-2xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_rgb(0,0,0,0.1)]`}
      {...props}
    >
      {children}
    </button>
  );
};