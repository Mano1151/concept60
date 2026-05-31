import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { deleteSavedSearch, fetchSavedSearches } from '../services/firestore';
import ConceptCard from '../components/ConceptCard';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getRecentSearches, removeRecentSearch } from '../utils/localStorage';

function Saved() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const getItemKey = (item) =>
    `${item.concept?.toLowerCase().trim() || ''}-${item.category?.toLowerCase().trim() || 'general'}`;

  const getSearchTimestamp = (item) => {
    if (item.searchedAt?.toDate) {
      return item.searchedAt.toDate().getTime();
    }
    const parsed = Date.parse(item.searchedAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortByDateDesc = (list) =>
    [...list].sort((a, b) => getSearchTimestamp(b) - getSearchTimestamp(a));

  useEffect(() => {
    const loadSaved = async () => {
      const localSearches = getRecentSearches();
      setItems(localSearches);
      setStatus(localSearches.length > 0 ? 'success' : 'loading');

      if (!user) {
        return;
      }

      setLoadingCloud(true);

      try {
        const cloudSearches = await fetchSavedSearches();
        const sortedCloud = sortByDateDesc(cloudSearches);
        setItems(sortedCloud);

        if (cloudSearches.length === 0 && localSearches.length > 0) {
          setItems(localSearches);
        }

        setStatus('success');
      } catch (err) {
        setStatus('success');
      } finally {
        setLoadingCloud(false);
      }
    };

    loadSaved();
  }, [user]);

  const handleDeleteRequest = (item) => {
    setPendingDelete(item);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setShowConfirm(false);
    try {
      await handleDelete(pendingDelete);
    } catch (err) {
      // handleDelete already sets status or would log; keep UX simple
    } finally {
      setPendingDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setPendingDelete(null);
  };

  const handleDelete = async (item) => {
    const localId = getItemKey(item);
    const isLocalOnly = item.id === localId || !user;

    if (isLocalOnly) {
      removeRecentSearch(localId);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast('Removed local search', 'success');
      return;
    }

    try {
      await deleteSavedSearch(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast('Saved concept removed', 'success');
    } catch (err) {
      setStatus('success');
      showToast('Unable to remove saved concept', 'error');
    }
  };

  const handleView = (item) => {
    navigate('/result', { state: item });
  };

  if (status === 'loading') {
    return <LoadingSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Saved concepts</h2>
            <p className="mt-2 text-slate-300">
              {user
                ? 'Your search history is stored securely in your account and sorted by most recent.'
                : 'Local recent searches are shown here. Sign in to sync saved concepts across devices.'}
            </p>
          </div>
          <Button variant="primary" type="button" onClick={() => navigate('/')} className="px-5 py-3">
            Search a new concept
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          <p className="text-lg font-medium">No saved concepts yet.</p>
          <p className="mt-2 text-sm">
            {user
              ? 'Your account does not have saved concepts yet. Search a concept and it will be stored in your profile.'
              : 'Search a concept and it will appear here locally. Sign in to sync saved concepts across devices.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <ConceptCard key={item.id} item={item} onDelete={() => handleDeleteRequest(item)} onView={handleView} />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={showConfirm}
        title="Delete saved concept"
        message={`Are you sure you want to delete "${pendingDelete?.concept || ''}"? This cannot be undone.`}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}

export default Saved;
