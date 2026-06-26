import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminContext = createContext({
  isAdmin: false,
  loading: true,
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (authLoading) return;
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Use backend to check/seed admin status, bypassing client Firestore rules
        const { default: apiClient } = await import('../services/api');
        const res = await apiClient.post('/api/admin/seed-admin');
        if (res.status === 200 && res.data?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        // If it throws a 403, they are not the admin
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, authLoading]);

  return (
    <AdminContext.Provider value={{ isAdmin, loading: loading || authLoading }}>
      {children}
    </AdminContext.Provider>
  );
}
