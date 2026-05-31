import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-xl border border-white/6 bg-panel/80 p-4 shadow-soft ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
