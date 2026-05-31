import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition';
  const variants = {
    primary: 'text-white bg-gradient-to-r from-[rgba(108,99,255,1)] to-[rgba(34,211,238,1)] shadow-soft',
    ghost: 'text-slate-300 bg-white/5 hover:bg-white/10',
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
