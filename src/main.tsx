import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Targeted cleanup of confirmed orphaned legacy user user-1788801094228 from offline mock cache
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const rawUsers = window.localStorage.getItem('findlostpuppy_registered_users_v1');
    if (rawUsers && rawUsers.includes('user-1788801094228')) {
      const users = JSON.parse(rawUsers);
      const filtered = users.filter((u: any) => u.id !== 'user-1788801094228');
      window.localStorage.setItem('findlostpuppy_registered_users_v1', JSON.stringify(filtered));
    }
    const rawProfiles = window.localStorage.getItem('findlostpuppy_profiles_v1');
    if (rawProfiles && rawProfiles.includes('user-1788801094228')) {
      const profiles = JSON.parse(rawProfiles);
      const filtered = profiles.filter((p: any) => p.id !== 'user-1788801094228' && p.userId !== 'user-1788801094228');
      window.localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify(filtered));
    }
    const rawPets = window.localStorage.getItem('findlostpuppy_pets_v1');
    if (rawPets && rawPets.includes('owner-user-1788801094228')) {
      const pets = JSON.parse(rawPets);
      const filtered = pets.filter((pet: any) => pet.ownerId !== 'user-1788801094228');
      window.localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify(filtered));
    }

    // Automatic cleanup of legacy UUID strings from profile or user name fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rawProfilesCleanup = window.localStorage.getItem('findlostpuppy_profiles_v1');
    if (rawProfilesCleanup) {
      const parsedProfiles = JSON.parse(rawProfilesCleanup);
      let changed = false;
      const cleaned = parsedProfiles.map((p: any) => {
        if (p.fullName && uuidRegex.test(p.fullName.trim())) {
          changed = true;
          return {
            ...p,
            fullName: p.email?.toLowerCase().includes('jksurampudi5') ? 'Jaya Krishna' : ''
          };
        }
        return p;
      });
      if (changed) {
        window.localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify(cleaned));
      }
    }

    const rawCurUser = window.localStorage.getItem('findlostpuppy_current_user_v1');
    if (rawCurUser) {
      const u = JSON.parse(rawCurUser);
      if (u.name && uuidRegex.test(u.name.trim())) {
        u.name = u.email?.toLowerCase().includes('jksurampudi5') ? 'Jaya Krishna' : 'Pet Parent';
        window.localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(u));
      }
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

