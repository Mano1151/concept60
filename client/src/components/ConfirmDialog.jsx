import React, { useEffect, useRef } from 'react';

function ConfirmDialog({ title = 'Confirm', message = 'Are you sure?', open, onCancel, onConfirm }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement;
    // focus the confirm button when opened
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prevActive?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white/5 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-3xl bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className="rounded-3xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
