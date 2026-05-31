import { createContext, useCallback, useContext, useState } from 'react';
import Toaster from '../components/Toaster';

const ToastContext = createContext({
  showToast: () => {},
  clearToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, clearToast }}>
      {children}
      <Toaster message={toast?.message} type={toast?.type} onClose={clearToast} />
    </ToastContext.Provider>
  );
}
