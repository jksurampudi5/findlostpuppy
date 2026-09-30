import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { storageService } from '../../services/storageService';

export function ServerFailureNotice() {
  const [visible, setVisible] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const failed = () => setVisible(true);
    const recovered = () => setVisible(false);
    window.addEventListener('findlostpuppy_cloud_sync_failed', failed);
    window.addEventListener('findlostpuppy_data_synced', recovered);
    return () => {
      window.removeEventListener('findlostpuppy_cloud_sync_failed', failed);
      window.removeEventListener('findlostpuppy_data_synced', recovered);
    };
  }, []);

  const retry = async () => {
    setRetrying(true);
    const success = await storageService.pullFromFirebase();
    setRetrying(false);
    setVisible(!success);
  };

  if (!visible || !navigator.onLine) return null;
  return (
    <aside className="server-failure-notice" role="alert" aria-live="polite">
      <span>We could not load the latest data. Please check your connection and try again. Saved data is still shown.</span>
      <button type="button" onClick={retry} disabled={retrying}>
        <RefreshCw size={16} className={retrying ? 'spin' : ''} /> {retrying ? 'Retrying…' : 'Retry'}
      </button>
      <button type="button" className="server-failure-close" onClick={() => setVisible(false)} aria-label="Dismiss">
        <X size={17} />
      </button>
    </aside>
  );
}
