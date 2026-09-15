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
      const updatedPets = pets.map((p: any) => {
        if (p.id === 'pet-1789317100824' && p.ownerId === 'owner-user-1788801094228') {
          return { ...p, ownerId: '173a6732-89d1-466c-a388-4dbcb6511449' };
        }
        return p;
      });
      window.localStorage.setItem('findlostpuppy_pets_v1', JSON.stringify(updatedPets));
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

