import React, { useEffect } from 'react';

function Toaster({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(id);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg = type === 'error' ? 'bg-rose-600/90' : 'bg-emerald-600/90';

  return (
    <div className="fixed right-4 top-4 z-50">
      <div className={`rounded-xl px-4 py-2 text-white shadow-md ${bg}`}>
        {message}
      </div>
    </div>
  );
}

export default Toaster;
