import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Direct Cloud/Firestore source of truth: purge offline media queue so base64 images are never stored
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('findlostpuppy_media_queue_v1');
    if (!window.localStorage.getItem('findlostpuppy_legacy_purged_v2')) {
      const keysToPurge = [
        'findlostpuppy_listing_reports_v1',
        'findlostpuppy_user_reports_v1',
        'findlostpuppy_users_v1',
      ];
      keysToPurge.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.setItem('findlostpuppy_legacy_purged_v2', 'true');
    }
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

