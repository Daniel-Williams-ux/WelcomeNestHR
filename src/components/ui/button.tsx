// src/components/ui/button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'table';
  size?: 'sm' | 'md' | 'lg';
}

const base =
  'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-[#00ACC1] text-white hover:bg-[#0097ac]',
  secondary: 'bg-gray-700 text-white hover:bg-gray-800',
  outline: 'border border-gray-300 text-gray-800 bg-white hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  table:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-1 text-xs rounded',
};

const sizes = {
  sm: 'px-3 py-1 text-xs',
  md: '',
  lg: 'px-5 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';