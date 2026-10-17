import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Calendar, Camera, Check, Dog, Eye, Home, MapPin, Navigation, RotateCcw, ShieldCheck, Sparkles, Trash2, X, HeartHandshake, Heart, Phone, Mail, MessageCircle, Plus, Search, Share2, FileText, Copy, Edit3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import type { LostReport, Sighting, OwnerProfile, DogProfile, LocationLocality, AdoptionPet } from '../types';
import { getDogDisplayName, getDogPhotoUrl, handleDogImageError, resolveGenericMediaUrl } from '../utils/dogPhotoHelper';
import { isMatchState, isMatchDistrict, isMatchMandal, isMatchCity, getReportGeo } from '../utils/locationMatchHelper';
import { EmptyState } from '../components/fallbacks/EmptyState';
import { PlayStoreEarlyAccessButton } from '../components/SuggestionWidget';
import { detectResilientLocation } from '../utils/geolocationHelper';
import { AdoptionShareModal } from '../components/AdoptionShareModal';
import { getRevealedAdoptionPhone } from '../utils/adoptionCardHelper';

/** Displays pet-status categories and grouped sightings with owner-gated safe-pet detail dialogs. */
export const PetStatus: React.FC = () => {
  const { user, petSafetyStatus } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const listPanelRef = useRef<HTMLDivElement | null>(null);
  const missingAutoDetectAttemptedRef = useRef(false);
  const [reports, setReports] = useState<LostReport[]>([]);
  const [allPets, setAllPets] = useState<DogProfile[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [profiles, setProfiles] = useState<OwnerProfile[]>([]);
  const [adoptionPets, setAdoptionPets] = useState<AdoptionPet[]>([]);
  const [detailReport, setDetailReport] = useState<LostReport | null>(null);
  const [detailSighting, setDetailSighting] = useState<Sighting | null>(null);
  const [detailAdoptionPet, setDetailAdoptionPet] = useState<AdoptionPet | null>(null);
  const [shareModalAdoptionPet, setShareModalAdoptionPet] = useState<AdoptionPet | null>(null);
  const [adoptionSearchQuery, setAdoptionSearchQuery] = useState('');
  const [activeSightingPhotoIndex, setActiveSightingPhotoIndex] = useState(0);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);

  // Cascading location filter states for Pets Missing
  const [missingFilterState, setMissingFilterState] = useState('');
  const [missingFilterDistrict, setMissingFilterDistrict] = useState('');
  const [missingFilterMandal, setMissingFilterMandal] = useState('');
  const [missingFilterVillage, setMissingFilterVillage] = useState('');
  const [missingLocalities, setMissingLocalities] = useState<LocationLocality[]>([]);
  const [detectingMissingLocation, setDetectingMissingLocation] = useState(false);

  const isDashboardAdmin = Boolean(
    user?.isAdmin ||
    user?.email?.toLowerCase().trim() === 'jksurmpudi5@gmail.com' ||
    user?.email?.toLowerCase().trim() === 'jksurampudi5@gmail.com'
  );

  const userReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;
  const userPetProfile = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const effectiveSafetyStatus: 'SAFE' | 'LOST' | 'UNDECIDED' = (() => {
    if (petSafetyStatus === 'LOST' || userReport?.status === 'LOST') return 'LOST';
    if (
      petSafetyStatus === 'SAFE' ||
      userReport?.status === 'SAFE' ||
      (userReport?.status as any) === 'REUNITED'
    ) {
      return 'SAFE';
    }
    if (user && storageService.isPetSafe(user.id, user.email)) return 'SAFE';
    return 'UNDECIDED';
  })();

  const initialTab = (() => {
    const stateTab = (location.state as any)?.activeTab || (location.state as any)?.tab;
    if (stateTab === 'SAFE' || stateTab === 'LOST' || stateTab === 'SIGHTINGS' || stateTab === 'ADOPTION') {
      return stateTab;
    }
    return null;
  })();
  const [selectedStatus, setSelectedStatus] = useState<'SIGHTINGS' | 'ADOPTION' | 'SAFE' | 'LOST' | null>(initialTab);

  useEffect(() => {
    const stateTab = (location.state as any)?.activeTab || (location.state as any)?.tab;
    if (stateTab === 'SAFE' || stateTab === 'LOST' || stateTab === 'SIGHTINGS' || stateTab === 'ADOPTION') {
      setSelectedStatus(stateTab);
      setStatusPanelOpen(true);
    }
  }, [location.state]);

  /** Selects a pet-status category and opens its list modal. */
  const selectStatusAndScroll = (status: 'SIGHTINGS' | 'ADOPTION' | 'SAFE' | 'LOST') => {
    setSelectedStatus(status);
    setStatusPanelOpen(true);
    window.setTimeout(() => {
      listPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      listPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  };

  useEffect(() => {
    const loadDashboardData = () => {
      setReports(storageService.getAllReports());
      setAllPets(storageService.getAllPets());
      setSightings(storageService.getAllSightings().filter((sighting) => sighting.isCurrent !== false));
      setProfiles(storageService.getAllOwnerProfiles());
      setAdoptionPets(storageService.getAllAdoptionPets());
    };

    loadDashboardData();
    window.addEventListener('findlostpuppy_reports_updated', loadDashboardData);
    window.addEventListener('findlostpuppy_adoption_pets_updated', loadDashboardData);
    window.addEventListener('storage', loadDashboardData);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', loadDashboardData);
      window.removeEventListener('findlostpuppy_adoption_pets_updated', loadDashboardData);
      window.removeEventListener('storage', loadDashboardData);
    };
  }, []);

  // Fetch localities when district and mandal are selected
  useEffect(() => {
    let isMounted = true;
    if (missingFilterState && missingFilterDistrict && missingFilterMandal) {
      const distObj = locationService.getDistrict(missingFilterState, missingFilterDistrict);
      if (distObj) {
        const subObj = locationService.getSubDistrict(distObj.districtCode, missingFilterMandal);
        if (subObj) {
          locationService
            .getLocalities(distObj.districtCode, subObj.subDistrictCode)
            .then((list) => {
              if (isMounted) setMissingLocalities(list);
            })
            .catch(() => {
              if (isMounted) setMissingLocalities([]);
            });
          return () => {
            isMounted = false;
          };
        }
      }
    }
    setMissingLocalities([]);
    return () => {
      isMounted = false;
    };
  }, [missingFilterState, missingFilterDistrict, missingFilterMandal]);

  useEffect(() => {
    if (selectedStatus !== 'LOST' || !statusPanelOpen) return;
    if (missingAutoDetectAttemptedRef.current) return;
    if (missingFilterState || missingFilterDistrict || missingFilterMandal || missingFilterVillage) return;

    missingAutoDetectAttemptedRef.current = true;
    setDetectingMissingLocation(true);
    detectResilientLocation()
      .then((geo) => {
        if (geo.state) setMissingFilterState(geo.state);
        if (geo.district) setMissingFilterDistrict(geo.district);
        if (geo.mandal) setMissingFilterMandal(geo.mandal);
        const nextVillage = geo.city || geo.street || '';
        if (nextVillage) setMissingFilterVillage(nextVillage);
      })
      .catch(() => {
        showToast('Could not auto-detect missing pets area. You can choose the location manually.', 'info');
      })
      .finally(() => setDetectingMissingLocation(false));
  }, [selectedStatus, statusPanelOpen, missingFilterState, missingFilterDistrict, missingFilterMandal, missingFilterVillage, showToast]);

  const visiblePets = useMemo(() => {
    if (selectedStatus === 'LOST') {
      return reports.filter((report) => report.status === 'LOST');
    }

    // 1. Identify pets with active LOST reports so they are strictly excluded from Pets at Home
    const activeLostPetIds = new Set(
      reports
        .filter((r) => r.status === 'LOST')
        .map((r) => (r.dogId || r.dog?.id || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim())
        .filter(Boolean)
    );
    const activeLostOwnerIds = new Set(
      reports
        .filter((r) => r.status === 'LOST')
        .map((r) => (r.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim())
        .filter(Boolean)
    );

    // Canonical key generator for strict 1:1 pet deduplication
    const normalizePetText = (value?: string): string =>
      (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/(companion|pet|dog|safe|home|mandal|municipality)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const getPetKey = (petId?: string, ownerId?: string, petName?: string): string => {
      const cleanP = (petId || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim();
      const cleanO = (ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
      const cleanN = normalizePetText(petName);
      if (cleanP && cleanP !== 'unknown') return `pet:${cleanP}`;
      if (cleanO && cleanN) return `owner:${cleanO}:${cleanN}`;
      if (cleanO) return `owner:${cleanO}`;
      return `unknown:${cleanN || Math.random()}`;
    };

    const getVisiblePetDedupeKey = (report: LostReport): string => {
      const strictKey = getPetKey(report.dogId || report.dog?.id, report.ownerId, report.dog?.name);
      if (!strictKey.startsWith('unknown:')) return strictKey;
      const name = normalizePetText(report.dog?.name);
      const breed = normalizePetText(report.dog?.breed);
      const place = normalizePetText(`${report.lastKnownLocation || ''} ${report.ownerApproximateLocation || ''}`);
      const photo = (report.dog?.primaryPhoto || '').split('?')[0].toLowerCase().trim();
      if (name && (breed || place || photo)) return `visual:${name}:${breed}:${place}:${photo}`;
      return strictKey;
    };

    const preferRicherSafePet = (existing: LostReport, incoming: LostReport): LostReport => {
      const existingPhoto = existing.dog?.primaryPhoto || '';
      const incomingPhoto = incoming.dog?.primaryPhoto || '';
      const existingUpdated = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const incomingUpdated = new Date(incoming.updatedAt || incoming.createdAt || 0).getTime();
      const incomingHasBetterPhoto = incomingPhoto && (!existingPhoto || incomingPhoto.length > existingPhoto.length);
      if (incomingHasBetterPhoto || incomingUpdated > existingUpdated) {
        return {
          ...existing,
          ...incoming,
          dog: {
            ...existing.dog,
            ...incoming.dog,
            primaryPhoto: incomingPhoto || existingPhoto,
            photos: incoming.dog?.photos?.length ? incoming.dog.photos : existing.dog?.photos,
          },
        };
      }
      return existing;
    };



    const petMap = new Map<string, LostReport>();

    // 2. Gather safe/reunited reports and enrich with latest dog profile data
    reports
      .filter((r) => r.status === 'SAFE' || (r.status as any) === 'REUNITED')
      .forEach((report) => {
        const cleanPetId = (report.dogId || report.dog?.id || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim();
        const cleanOwnerId = (report.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
        if (activeLostPetIds.has(cleanPetId) || activeLostOwnerIds.has(cleanOwnerId)) return;

        // Find freshest pet from allPets
        const matchedPet = allPets.find((p) => {
          const pId = (p.id || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim();
          const pOwner = (p.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
          return (pId && pId === cleanPetId) || (pOwner && pOwner === cleanOwnerId);
        });

        const key = getPetKey(
          report.dogId || report.dog?.id || matchedPet?.id,
          report.ownerId || matchedPet?.ownerId,
          matchedPet?.name || report.dog?.name
        );

        const enrichedDog: DogProfile = matchedPet
          ? { ...report.dog, ...matchedPet, primaryPhoto: matchedPet.primaryPhoto || '' }
          : { ...report.dog, primaryPhoto: report.dog?.primaryPhoto || '' };

        const nextReport = {
          ...report,
          dogId: matchedPet?.id || report.dogId,
          ownerId: matchedPet?.ownerId || report.ownerId,
          dog: enrichedDog,
        };
        petMap.set(key, petMap.has(key) ? preferRicherSafePet(petMap.get(key)!, nextReport) : nextReport);
      });

    // 3. Include all registered companion pets from allPets that are safe at home
    allPets.forEach((pet) => {
      const cleanPetId = (pet.id || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim();
      const cleanOwnerId = (pet.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
      if (activeLostPetIds.has(cleanPetId) || activeLostOwnerIds.has(cleanOwnerId)) return;

      const key = getPetKey(pet.id, pet.ownerId, pet.name);

      if (petMap.has(key)) {
        // Update existing report with latest pet photo and details
        const existing = petMap.get(key)!;
        petMap.set(key, {
          ...existing,
          dog: { ...existing.dog, ...pet, primaryPhoto: pet.primaryPhoto || '' },
        });
        return;
      }

      // If not yet in map, create a companion safe report
      const owner = profiles.find((p) => {
        const cleanPId = (p.id || '').toLowerCase().replace(/^(owner-)/, '').trim();
        const cleanPUId = (p.userId || '').toLowerCase().replace(/^(owner-)/, '').trim();
        return cleanPId === cleanOwnerId || cleanPUId === cleanOwnerId;
      });

      const loc =
        owner?.approximateArea ||
        [owner?.city, owner?.district, owner?.state].filter(Boolean).join(', ') ||
        'Safe at Home';

      petMap.set(key, {
        id: `safe-pet-${pet.id}`,
        dogId: pet.id,
        ownerId: pet.ownerId,
        dog: pet,
        ownerApproximateLocation: loc,
        lastKnownLocation: loc,
        dateLost: '',
        timeLost: '',
        additionalNotes: pet.distinguishingMarks || 'Safe companion pet.',
        status: 'SAFE' as const,
        sightingCount: 0,
        createdAt: pet.createdAt || new Date().toISOString(),
        updatedAt: (pet as any).updatedAt || pet.createdAt || new Date().toISOString(),
        contactMechanism: {
          showPhone: true,
          showEmail: true,
          safeContactPhone: owner?.phone || '',
          safeContactEmail: owner?.email || '',
          contactNote: 'Safe at home with family.',
        },
      });
    });

    // Convert map to array
    const safeList = Array.from(petMap.values());

    // 4. Prioritize current user's safe pet at the top of the list without creating duplicates
    if (user && userPetProfile && effectiveSafetyStatus === 'SAFE') {
      const userKey = getPetKey(userPetProfile.id, user.id, userPetProfile.name);
      const userIdx = safeList.findIndex(
        (r) => getPetKey(r.dogId || r.dog?.id, r.ownerId, r.dog?.name) === userKey
      );

      if (userIdx > 0) {
        const [userItem] = safeList.splice(userIdx, 1);
        safeList.unshift(userItem);
      } else if (userIdx === -1) {
        safeList.unshift({
          id: `local-safe-${userPetProfile.id}`,
          dogId: userPetProfile.id,
          ownerId: user.id,
          dog: userPetProfile,
          ownerApproximateLocation: 'Safe at home',
          lastKnownLocation: 'Safe at home',
          dateLost: '',
          timeLost: '',
          additionalNotes: 'Your beloved companion is safe at home.',
          status: 'SAFE' as const,
          sightingCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contactMechanism: {
            showPhone: false,
            showEmail: false,
            safeContactPhone: '',
            safeContactEmail: '',
            contactNote: 'Safe at home',
          },
        });
      }
    }

    const finalMap = new Map<string, LostReport>();
    safeList.forEach((item) => {
      const key = getVisiblePetDedupeKey(item);
      finalMap.set(key, finalMap.has(key) ? preferRicherSafePet(finalMap.get(key)!, item) : item);
    });

    return Array.from(finalMap.values());
  }, [reports, allPets, selectedStatus, user, effectiveSafetyStatus, userPetProfile, profiles]);

  const handleResetMissingFilters = () => {
    setMissingFilterState('');
    setMissingFilterDistrict('');
    setMissingFilterMandal('');
    setMissingFilterVillage('');
    missingAutoDetectAttemptedRef.current = false;
  };

  const filteredMissingPets = useMemo(() => {
    if (selectedStatus !== 'LOST') return visiblePets;
    let list = visiblePets;
    if (missingFilterState) {
      list = list.filter((r) => isMatchState(r, missingFilterState, profiles));
    }
    if (missingFilterDistrict) {
      list = list.filter((r) => isMatchDistrict(r, missingFilterState, missingFilterDistrict, profiles));
    }
    if (missingFilterMandal) {
      list = list.filter((r) => isMatchMandal(r, missingFilterState, missingFilterDistrict, missingFilterMandal, profiles));
    }
    if (missingFilterVillage) {
      list = list.filter((r) => isMatchCity(r, missingFilterState, missingFilterDistrict, missingFilterMandal, missingFilterVillage, profiles));
    }
    return list;
  }, [visiblePets, selectedStatus, missingFilterState, missingFilterDistrict, missingFilterMandal, missingFilterVillage, profiles]);

  const filteredAdoptionPets = useMemo(() => {
    if (!adoptionSearchQuery.trim()) return adoptionPets;
    const q = adoptionSearchQuery.toLowerCase().trim();
    return adoptionPets.filter(
      (p) =>
        (p.petName || '').toLowerCase().includes(q) ||
        (p.breed || '').toLowerCase().includes(q) ||
        (p.village || '').toLowerCase().includes(q) ||
        (p.mandal || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q)
    );
  }, [adoptionPets, adoptionSearchQuery]);

  const missingStateOptions = useMemo(() => {
    const lostReports = reports.filter((r) => r.status === 'LOST');
    return locationService.getStates().map((s) => {
      const count = lostReports.filter((r) => isMatchState(r, s.name, profiles)).length;
      return {
        name: s.name,
        hasPetAlert: count > 0,
        count,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [reports, profiles]);

  const missingDistrictOptions = useMemo(() => {
    if (!missingFilterState) return [];
    const lostReports = reports.filter((r) => r.status === 'LOST');
    return locationService.getDistricts(missingFilterState).map((d) => {
      const count = lostReports.filter((r) => isMatchDistrict(r, missingFilterState, d.districtName, profiles)).length;
      return {
        name: d.districtName,
        hasPetAlert: count > 0,
        count,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [missingFilterState, reports, profiles]);

  const missingMandalOptions = useMemo(() => {
    if (!missingFilterState || !missingFilterDistrict) return [];
    const lostReports = reports.filter((r) => r.status === 'LOST');
    return locationService.getSubDistricts(missingFilterDistrict, missingFilterState).map((m) => {
      const count = lostReports.filter((r) => isMatchMandal(r, missingFilterState, missingFilterDistrict, m.subDistrictName, profiles)).length;
      return {
        name: m.subDistrictName,
        hasPetAlert: count > 0,
        count,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [missingFilterState, missingFilterDistrict, reports, profiles]);

  const missingVillageOptions = useMemo(() => {
    if (!missingFilterState || !missingFilterDistrict || !missingFilterMandal) return [];
    const lostReports = reports.filter((r) => r.status === 'LOST');
    const villageSet = new Set<string>();
    missingLocalities.forEach((l) => {
      if (l.localityName.toLowerCase().trim() !== missingFilterMandal.toLowerCase().trim()) {
        villageSet.add(l.localityName);
      }
    });
    lostReports.forEach((r) => {
      const geo = getReportGeo(r, profiles);
      if (geo.village && isMatchMandal(r, missingFilterState, missingFilterDistrict, missingFilterMandal, profiles)) {
        if (geo.village.toLowerCase().trim() !== missingFilterMandal.toLowerCase().trim()) {
          villageSet.add(geo.village);
        }
      }
    });
    return Array.from(villageSet).map((v) => {
      const count = lostReports.filter((r) => isMatchCity(r, missingFilterState, missingFilterDistrict, missingFilterMandal, v, profiles)).length;
      return {
        name: v,
        hasPetAlert: count > 0,
        count,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [missingFilterState, missingFilterDistrict, missingFilterMandal, missingLocalities, reports, profiles]);

  const getSightingReport = (sighting: Sighting) =>
    reports.find((report) => report.id === sighting.reportId || report.id.toLowerCase() === sighting.reportId.toLowerCase());

  const getOwnerDisplayName = (report: LostReport): string => {
    const cleanOwner = (report.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
    const email = (report.contactMechanism?.safeContactEmail || '').toLowerCase().trim();
    const owner = profiles.find((profile) => {
      const pid = (profile.id || '').toLowerCase().replace(/^(owner-)/, '').trim();
      const uid = (profile.userId || '').toLowerCase().replace(/^(owner-)/, '').trim();
      const pem = (profile.email || '').toLowerCase().trim();
      return (cleanOwner && (pid === cleanOwner || uid === cleanOwner)) || (email && pem === email);
    });
    return owner?.fullName || report.contactMechanism?.safeContactEmail?.split('@')[0] || '';
  };

  /** Matches the current user against normalized owner IDs or the report's contact email. */
  const isCurrentUserPetOwner = (report: LostReport) => {
    if (!user) return false;
    /** Removes repeated owner prefixes and normalizes whitespace and case for ID comparisons. */
    const normalizeOwnerId = (value?: string) =>
      (value || '').replace(/^(owner-)+/i, '').trim().toLowerCase();
    const userId = normalizeOwnerId(user.id);
    const ownerIds = [report.ownerId, report.dog?.ownerId].map(normalizeOwnerId).filter(Boolean);
    const userEmail = (user.email || '').trim().toLowerCase();
    const reportEmail = (report.contactMechanism?.safeContactEmail || '').trim().toLowerCase();
    return ownerIds.includes(userId) || Boolean(userEmail && reportEmail && userEmail === reportEmail);
  };

  /** Keeps Safe Pets details private to the owner/admin while preserving public missing-pet awareness. */
  const canViewReportDetails = (report: LostReport) => {
    if (!report) return false;
    if (isDashboardAdmin || isCurrentUserPetOwner(report)) return true;
    return report.status === 'LOST';
  };

  /** Hides the category list and opens the selected sighting at the requested photo index. */
  const openSightingDetails = (sighting: Sighting, photoIndex: number = 0) => {
    setStatusPanelOpen(false);
    setDetailSighting(sighting);
    setActiveSightingPhotoIndex(photoIndex);
  };

  /** Replaces the category list with the selected pet report. */
  const openPetDetails = (report: LostReport) => {
    setStatusPanelOpen(false);
    // Find freshest matching pet in allPets to guarantee latest photo and traits
    const cleanPetId = (report.dogId || report.dog?.id || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim();
    const cleanOwnerId = (report.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
    const matchedPet = allPets.find((p) => {
      const pId = (p.id || '').toLowerCase().replace(/^(pet-|dog-)/, '').trim();
      const pOwner = (p.ownerId || '').toLowerCase().replace(/^(owner-)/, '').trim();
      return (pId && pId === cleanPetId) || (pOwner && pOwner === cleanOwnerId);
    });
    const enriched = matchedPet
      ? { ...report, dog: { ...report.dog, ...matchedPet, primaryPhoto: matchedPet.primaryPhoto || '' } }
      : report;
    setDetailReport(enriched);
  };

  /** Closes pet details and restores the category list modal. */
  const closePetDetails = () => {
    setDetailReport(null);
    setStatusPanelOpen(true);
  };

  /** Closes sighting details and restores the category list modal. */
  const closeSightingDetails = () => {
    setDetailSighting(null);
    setStatusPanelOpen(true);
  };

  const refreshSightings = () => {
    setSightings(storageService.getAllSightings().filter((sighting) => sighting.isCurrent !== false));
    setReports(storageService.getAllReports());
  };

  const handleDeleteSightingGroup = (sightingIds: string[]) => {
    if (sightingIds.length === 0) return;
    sightingIds.forEach(id => storageService.deleteSightingAsAdmin(id));
    if (detailSighting && sightingIds.includes(detailSighting.id)) setDetailSighting(null);
    refreshSightings();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new Event('storage'));
    showToast(`Deleted ${sightingIds.length > 1 ? `all ${sightingIds.length} sightings` : 'sighting'} for this pet.`, 'success');
  };

  const handleDeleteAdoptionPet = (petId: string, petName: string) => {
    const confirmed = window.confirm(`Permanently delete adoption listing for "${petName}"? This action cannot be undone.`);
    if (!confirmed) return;
    storageService.deleteAdoptionPet(petId);
    setAdoptionPets(storageService.getAllAdoptionPets());
    if (detailAdoptionPet?.id === petId) setDetailAdoptionPet(null);
    showToast(`🗑️ Adoption listing "${petName}" deleted.`, 'info');
  };

  const handleHardResetSightings = () => {
    if (sightings.length === 0) return;
    sightings.forEach((sighting) => storageService.deleteSightingAsAdmin(sighting.id));
    setDetailSighting(null);
    refreshSightings();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new Event('storage'));
    showToast('All sightings cleared.', 'success');
  };

  return (
    <div className="dashboard-page dashboard-status-only-page">
      <div className="app-container dashboard-status-only-container">
        <section
          className={`dashboard-pet-status-card dashboard-pet-status-card-large ${
            effectiveSafetyStatus === 'LOST'
              ? 'dashboard-pet-status-card-missing'
              : effectiveSafetyStatus === 'SAFE'
                ? 'dashboard-pet-status-card-safe'
                : 'dashboard-pet-status-card-neutral'
          }`}
          aria-live="polite"
        >
          <div className="dashboard-status-title-block">
            <h1>Pet Status</h1>
          </div>

          <div className="dashboard-top-actions-row">
            <button
              type="button"
              className="dashboard-top-capture-btn"
              onClick={() => navigate('/capture?mode=unknown')}
              aria-label="Quick Capture Roaming Pet"
            >
              <Camera size={22} />
              <span>Capture Pet</span>
            </button>
            <button
              type="button"
              className="dashboard-top-capture-btn dashboard-top-adoption-btn"
              onClick={() => navigate('/adoption-details')}
              aria-label="Add Pet For Adoption"
            >
              <HeartHandshake size={22} />
              <span>Add Adoption Pet</span>
            </button>
          </div>

          <p className="dashboard-status-choice-hint">Pick one status below to view sightings, adoption, safe pets, or missing pets.</p>

          <div className="dashboard-status-filter-buttons dashboard-2x2-status-grid loc-grid-2x2" role="tablist" aria-label="Pet safety and adoption status filter">
            {/* 1. SIGHTINGS (Top Left) */}
            <button
              type="button"
              className={`dashboard-status-filter-btn sighting-filter ${selectedStatus === 'SIGHTINGS' ? 'active' : ''}`}
              onClick={() => selectStatusAndScroll('SIGHTINGS')}
              role="tab"
              aria-selected={selectedStatus === 'SIGHTINGS'}
            >
              <div className="dashboard-status-card-top">
                <div className="dashboard-status-card-icon-badge sighting-badge">
                  <Navigation size={22} />
                  <Camera size={13} className="dashboard-status-card-mini-icon" />
                </div>
                <div className="dashboard-status-card-top-meta">
                  <span className="dashboard-status-card-label">SIGHTINGS</span>
                  <span className="dashboard-status-count-pill">{sightings.length}</span>
                </div>
              </div>
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'SIGHTINGS' && <Check size={20} />}
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Sightings</strong>
                <span>Captured pet photos and location details.</span>
              </span>
            </button>

            {/* 2. ADOPTION (Top Right) */}
            <button
              type="button"
              className={`dashboard-status-filter-btn adoption-filter ${selectedStatus === 'ADOPTION' ? 'active' : ''}`}
              onClick={() => selectStatusAndScroll('ADOPTION')}
              role="tab"
              aria-selected={selectedStatus === 'ADOPTION'}
            >
              <div className="dashboard-status-card-top">
                <div className="dashboard-status-card-icon-badge adoption-badge">
                  <HeartHandshake size={22} />
                </div>
                <div className="dashboard-status-card-top-meta">
                  <span className="dashboard-status-card-label">ADOPTION</span>
                  <span className="dashboard-status-count-pill">{adoptionPets.length}</span>
                </div>
              </div>
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'ADOPTION' && <Check size={20} />}
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Adoption</strong>
                <span>Find forever homes for loving pets.</span>
              </span>
              <div className="dashboard-status-card-direct-action">
                <span
                  role="button"
                  tabIndex={0}
                  className="dashboard-card-mini-add-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/adoption-details');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      navigate('/adoption-details');
                    }
                  }}
                  title="Directly add adoption photo & details"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </span>
              </div>
            </button>

            {/* 3. SAFE PETS (Bottom Left) */}
            <button
              type="button"
              className={`dashboard-status-filter-btn safe-filter ${selectedStatus === 'SAFE' ? 'active' : ''}`}
              onClick={() => selectStatusAndScroll('SAFE')}
              role="tab"
              aria-selected={selectedStatus === 'SAFE'}
            >
              <div className="dashboard-status-card-top">
                <div className="dashboard-status-card-icon-badge safe-badge">
                  <Home size={22} />
                  <ShieldCheck size={13} className="dashboard-status-card-mini-icon" />
                </div>
                <div className="dashboard-status-card-top-meta">
                  <span className="dashboard-status-card-label">SAFE PETS</span>
                  <span className="dashboard-status-count-pill">{visiblePets.length}</span>
                </div>
              </div>
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'SAFE' && <Check size={20} />}
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Safe Pets</strong>
                <span>Pets marked safe at home.</span>
              </span>
            </button>

            {/* 4. MISSING PETS (Bottom Right) */}
            <button
              type="button"
              className={`dashboard-status-filter-btn missing-filter ${selectedStatus === 'LOST' ? 'active' : ''}`}
              onClick={() => selectStatusAndScroll('LOST')}
              role="tab"
              aria-selected={selectedStatus === 'LOST'}
            >
              <div className="dashboard-status-card-top">
                <div className="dashboard-status-card-icon-badge missing-badge">
                  <AlertTriangle size={22} />
                </div>
                <div className="dashboard-status-card-top-meta">
                  <span className="dashboard-status-card-label">MISSING PETS</span>
                  <span className="dashboard-status-count-pill">{filteredMissingPets.length}</span>
                </div>
              </div>
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'LOST' && <Check size={20} />}
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Missing Pets</strong>
                <span>Missing pets and sighting reports.</span>
              </span>
            </button>
          </div>

          {selectedStatus && statusPanelOpen && createPortal(
            <div
              className="dashboard-status-modal-backdrop dashboard-list-modal-backdrop"
              role="presentation"
              onClick={() => setStatusPanelOpen(false)}
            >
            <div
              className="dashboard-status-pets-panel dashboard-status-list-modal"
              ref={listPanelRef}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dashboard-status-pets-panel-header">
                <h2>
                  {selectedStatus === 'SIGHTINGS'
                    ? 'Sightings'
                    : selectedStatus === 'SAFE'
                      ? 'Safe Pets'
                      : selectedStatus === 'ADOPTION'
                        ? 'Pets for Adoption'
                        : 'Missing Pets'}
                </h2>
                <span>
                  {selectedStatus === 'SIGHTINGS'
                    ? sightings.length
                    : selectedStatus === 'LOST'
                      ? filteredMissingPets.length
                      : selectedStatus === 'ADOPTION'
                        ? filteredAdoptionPets.length
                        : visiblePets.length}{' '}
                  listed
                </span>
                <button
                  type="button"
                  className="dashboard-status-modal-close dashboard-list-modal-close"
                  onClick={() => setStatusPanelOpen(false)}
                  aria-label="Close pet status list"
                >
                  <X size={22} />
                </button>
              </div>
              {selectedStatus === 'LOST' && (
                <>
                  <div className="dashboard-missing-filter-bar">
                    <div className="dashboard-missing-filter-header">
                      <div className="dashboard-missing-filter-title">
                        <MapPin size={15} className="text-amber-500" />
                        <span>Location</span>
                        {(missingFilterState || missingFilterDistrict || missingFilterMandal || missingFilterVillage) && (
                          <button
                            type="button"
                            className="dashboard-missing-filter-reset-btn"
                            onClick={handleResetMissingFilters}
                            title="Clear location filters"
                          >
                            <RotateCcw size={12} />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                      <span className="dashboard-missing-filter-status">
                        {filteredMissingPets.length} of {visiblePets.length} pets
                      </span>
                    </div>
                    {detectingMissingLocation && (
                      <div className="dashboard-missing-detecting" role="status" aria-live="polite">
                        <Navigation size={16} className="spin" />
                        <span>Detecting your area…</span>
                      </div>
                    )}
                    <div className="dashboard-missing-filter-grid">
                      {/* State Selector */}
                      <div className="missing-filter-select-wrap">
                        <label htmlFor="missing-filter-state">State</label>
                        <select
                          id="missing-filter-state"
                          className="missing-filter-select"
                          value={missingFilterState}
                          onChange={(e) => {
                            setMissingFilterState(e.target.value);
                            setMissingFilterDistrict('');
                            setMissingFilterMandal('');
                            setMissingFilterVillage('');
                          }}
                        >
                          <option value="">All States</option>
                          {missingStateOptions.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.hasPetAlert ? `🟢 ${s.name} (${s.count})` : s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District Selector */}
                      <div className="missing-filter-select-wrap">
                        <label htmlFor="missing-filter-district">District</label>
                        <select
                          id="missing-filter-district"
                          className="missing-filter-select"
                          value={missingFilterDistrict}
                          disabled={!missingFilterState}
                          onChange={(e) => {
                            setMissingFilterDistrict(e.target.value);
                            setMissingFilterMandal('');
                            setMissingFilterVillage('');
                          }}
                        >
                          <option value="">{missingFilterState ? 'All Districts' : 'Select State first'}</option>
                          {missingDistrictOptions.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.hasPetAlert ? `🟢 ${d.name} (${d.count})` : d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mandal Selector */}
                      <div className="missing-filter-select-wrap">
                        <label htmlFor="missing-filter-mandal">Mandal / Municipality</label>
                        <select
                          id="missing-filter-mandal"
                          className="missing-filter-select"
                          value={missingFilterMandal}
                          disabled={!missingFilterDistrict}
                          onChange={(e) => {
                            setMissingFilterMandal(e.target.value);
                            setMissingFilterVillage('');
                          }}
                        >
                          <option value="">{missingFilterDistrict ? 'All Mandals' : 'Select District first'}</option>
                          {missingMandalOptions.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.hasPetAlert ? `🟢 ${m.name} (${m.count})` : m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Village Selector */}
                      <div className="missing-filter-select-wrap">
                        <label htmlFor="missing-filter-village">Village / Locality</label>
                        <select
                          id="missing-filter-village"
                          className="missing-filter-select"
                          value={missingFilterVillage}
                          disabled={!missingFilterMandal}
                          onChange={(e) => setMissingFilterVillage(e.target.value)}
                        >
                          <option value="">{missingFilterMandal ? 'All Localities' : 'Select Mandal first'}</option>
                          {missingVillageOptions.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.hasPetAlert ? `🟢 ${v.name} (${v.count})` : v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dashboard-capture-shortcut-btn"
                    onClick={() => navigate('/capture?mode=unknown')}
                  >
                    <Camera size={16} />
                    <span>Quick Capture</span>
                  </button>
                </>
              )}
              {selectedStatus === 'ADOPTION' && (
                <div className="dashboard-adoption-header-controls">
                  <button
                    type="button"
                    className="dashboard-capture-shortcut-btn dashboard-post-adoption-btn"
                    onClick={() => navigate('/adoption-details')}
                    style={{
                      background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                      borderColor: '#BE185D',
                    }}
                  >
                    <Plus size={16} />
                    <span>Post Pet for Adoption</span>
                  </button>
                  <div className="dashboard-adoption-search-wrap">
                    <Search size={16} className="dashboard-adoption-search-icon" />
                    <input
                      type="text"
                      className="dashboard-adoption-search-input"
                      placeholder="Search adoption pets by name, breed, location..."
                      value={adoptionSearchQuery}
                      onChange={(e) => setAdoptionSearchQuery(e.target.value)}
                    />
                    {adoptionSearchQuery && (
                      <button
                        type="button"
                        className="dashboard-adoption-search-clear"
                        onClick={() => setAdoptionSearchQuery('')}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {selectedStatus === 'SAFE' && (
                <button
                  type="button"
                  className="dashboard-capture-shortcut-btn"
                  onClick={() => navigate('/capture')}
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderColor: '#059669' }}
                >
                  <Camera size={16} />
                  <span>Capture Sighting</span>
                </button>
              )}
              {selectedStatus === 'SIGHTINGS' && isDashboardAdmin && sightings.length > 0 && (
                <button
                  type="button"
                  className="dashboard-hard-reset-sightings-btn"
                  onClick={handleHardResetSightings}
                >
                  <Trash2 size={16} />
                  <span>Hard Reset Sightings</span>
                </button>
              )}

              <div className="dashboard-status-pets-list">
                {selectedStatus === 'SIGHTINGS' ? (
                  sightings.length > 0 ? (
                    (() => {
                      const groupedSightings = Object.values(sightings.reduce((acc, sighting) => {
                        const reportId = sighting.reportId;
                        if (!acc[reportId]) acc[reportId] = [];
                        acc[reportId].push(sighting);
                        return acc;
                      }, {} as Record<string, Sighting[]>));
                      
                      return groupedSightings.map((group) => {
                        const firstSighting = group[0];
                        const report = getSightingReport(firstSighting);
                        const displayName = firstSighting.dogName || report?.dog?.name || 'Missing Pet';
                        // Original pet photo from the missing dog report
                        const originalPetPhoto = report ? getDogPhotoUrl(report.dog, report) : (firstSighting.photo || firstSighting.photos?.[0] || '');
                        
                        return (
                          <article key={firstSighting.reportId} className={`dashboard-status-pet-row ${isDashboardAdmin ? 'has-admin-action' : ''}`}>
                            <div className="dashboard-status-pet-photo-wrap">
                              <img
                                src={originalPetPhoto}
                                alt={displayName}
                                className="dashboard-status-pet-photo"
                                onError={handleDogImageError}
                              />
                            </div>
                            <div className="dashboard-status-pet-copy">
                              <strong>{displayName}</strong>
                              <span className="dashboard-status-pet-location">
                                <MapPin size={13} />
                                {firstSighting.village || firstSighting.mandal || firstSighting.district || firstSighting.location || 'Location shared'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="dashboard-status-view-details-btn dashboard-view-sightings-btn"
                              onClick={() => openSightingDetails(firstSighting, 0)}
                            >
                              <Eye size={14} />
                              <span>Details ({group.length})</span>
                            </button>
                            {isDashboardAdmin && (
                              <button
                                type="button"
                                className="dashboard-sighting-delete-btn"
                                onClick={() => handleDeleteSightingGroup(group.map(s => s.id))}
                                aria-label="Delete all sightings for this pet"
                                title="Delete all sightings for this pet"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </article>
                        );
                      });
                    })()
                  ) : (
                    <EmptyState
                      icon={<Eye size={30} />}
                      title="No sightings reported yet."
                      message="Open a missing pet alert to report a sighting."
                      action={<button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/find')}>View Missing Pets</button>}
                    />
                  )
                ) : selectedStatus === 'ADOPTION' ? (
                  filteredAdoptionPets.length > 0 ? (
                    filteredAdoptionPets.map((pet) => {
                      const photo = pet.photo || pet.photos?.[0] || '';
                      const traits = [pet.breed, pet.gender, pet.age, pet.size].filter(Boolean).join(' • ');
                      const loc = [pet.village, pet.mandal, pet.district].filter(Boolean).join(', ') || pet.city || 'Location available';
                      return (
                        <article
                          key={pet.id}
                          className="dashboard-status-pet-row dashboard-adoption-pet-row"
                          onClick={() => setDetailAdoptionPet(pet)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="dashboard-status-pet-photo-wrap">
                            {photo ? (
                              <img
                                src={photo}
                                alt={pet.petName}
                                className="dashboard-status-pet-photo"
                                onError={handleDogImageError}
                              />
                            ) : (
                              <div className="dashboard-status-pet-photo-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(236,72,153,0.12)', borderRadius: '10px' }}>
                                <Heart size={24} style={{ color: '#F472B6' }} />
                              </div>
                            )}
                          </div>
                          <div className="dashboard-status-pet-copy">
                            <div className="dashboard-pet-name-row">
                              <strong>{pet.petName}</strong>
                              <span className="dashboard-adoption-badge-tag" style={{ fontSize: '0.72rem', color: '#F472B6', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(244,114,182,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                <Heart size={11} fill="#F472B6" /> Ready to Adopt
                              </span>
                              {pet.flyerPhoto && (
                                <span className="dashboard-poster-tag" style={{ fontSize: '0.7rem', color: '#C084FC', background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)', padding: '2px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                  📄 Has Poster
                                </span>
                              )}
                              {pet.vaccinated && (
                                <span className="dashboard-safe-tag" style={{ fontSize: '0.72rem', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                                  <Check size={11} /> Vaccinated
                                </span>
                              )}
                            </div>
                            <span className="dashboard-pet-location-snippet">
                              {traits || 'Companion pet'}
                            </span>
                            <span className="dashboard-status-pet-location" style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={12} style={{ color: '#F472B6' }} />
                              {loc}
                            </span>
                          </div>
                          <div className="dashboard-status-row-actions">
                            <button
                              type="button"
                              className="dashboard-status-view-details-btn dashboard-adopt-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailAdoptionPet(pet);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(190,24,93,0.3))',
                                borderColor: '#F472B6',
                                color: '#FCE7F3',
                              }}
                            >
                              <Heart size={13} fill="#F472B6" />
                              <span>Adopt</span>
                            </button>
                            {((user && (pet.userId === user.id || (user.email && pet.contactEmail?.toLowerCase().trim() === user.email.toLowerCase().trim()))) || isDashboardAdmin) && (
                              <button
                                type="button"
                                className="dashboard-sighting-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAdoptionPet(pet.id, pet.petName);
                                }}
                                aria-label="Delete adoption listing"
                                title="Delete adoption listing"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={<HeartHandshake size={32} style={{ color: '#F472B6' }} />}
                      title={adoptionSearchQuery ? "No adoption pets match your search" : "No adoption pets listed yet"}
                      message={adoptionSearchQuery ? "Try clearing your search term or searching another location." : "Be the first to list a pet looking for a loving home."}
                      action={
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/adoption-details')}
                          style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', border: 'none' }}
                        >
                          <Plus size={16} />
                          <span>Add Adoption Pet</span>
                        </button>
                      }
                    />
                  )
                ) : (selectedStatus === 'LOST' ? filteredMissingPets : visiblePets).length > 0 ? (
                  (selectedStatus === 'LOST' ? filteredMissingPets : visiblePets).map((report) => {
                    const displayName = getDogDisplayName(report.dog, report);
                    const photoUrl = getDogPhotoUrl(report.dog, report);
                    const canViewDetails = canViewReportDetails(report);
                    const isUnknownRoaming = report.dog?.name?.toLowerCase().includes('unknown') || report.id.includes('UNKNOWN');
                    const isSafe = selectedStatus === 'SAFE' || report.status === 'SAFE' || (report.status as any) === 'REUNITED';
                    const ownerName = isSafe ? getOwnerDisplayName(report) : '';
                    return (
                      <article
                        key={report.id}
                        className={`dashboard-status-pet-row ${isUnknownRoaming ? 'dashboard-roaming-pet-row' : ''}`}
                        onClick={() => canViewDetails && openPetDetails(report)}
                        style={{ cursor: canViewDetails ? 'pointer' : 'default' }}
                      >
                        <div className="dashboard-status-pet-photo-wrap">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={displayName}
                              className="dashboard-status-pet-photo"
                              onError={handleDogImageError}
                            />
                          ) : (
                            <div className="dashboard-status-pet-photo-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                              <Dog size={24} style={{ opacity: 0.5, color: '#f97316' }} />
                            </div>
                          )}
                        </div>
                        <div className="dashboard-status-pet-copy">
                          <div className="dashboard-pet-name-row">
                            <strong>{displayName}</strong>
                            {isSafe && (
                              <span className="dashboard-safe-tag" style={{ fontSize: '0.75rem', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                <Check size={13} /> Safe at Home
                              </span>
                            )}
                            {isUnknownRoaming && (
                              <span className="dashboard-roaming-tag">🐾 Roaming Pet</span>
                            )}
                            {isSafe && ownerName && (
                              <span className="dashboard-owner-name-tag dashboard-owner-name-tag--public">Owner: {ownerName}</span>
                            )}
                          </div>
                          <span className="dashboard-pet-location-snippet">
                            {isSafe ? (
                              <>
                                {report.dog?.breed || 'Companion Pet'}
                              </>
                            ) : (
                              <>
                                <MapPin size={12} />
                                {report.lastKnownLocation || report.ownerApproximateLocation || 'Public Sighting Area'}
                              </>
                            )}
                          </span>
                        </div>
                        {canViewDetails ? (
                          <div className="dashboard-status-row-actions">
                            <button
                              type="button"
                              className="dashboard-status-view-details-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                openPetDetails(report);
                              }}
                            >
                              <Eye size={14} />
                              <span>Details</span>
                            </button>
                          </div>
                        ) : (
                          <span className="dashboard-owner-only-label">Owner-only details</span>
                        )}
                      </article>
                    );
                  })
                ) : selectedStatus === 'LOST' && (missingFilterState || missingFilterDistrict || missingFilterMandal || missingFilterVillage) ? (
                  <EmptyState
                    icon={<AlertTriangle size={30} />}
                    title="No missing pets found in selected area."
                    message="Try choosing another district/state or clear the filters to view all missing pets."
                    action={
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleResetMissingFilters}
                      >
                        Clear Location Filters
                      </button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={selectedStatus === 'SAFE' ? <Home size={30} /> : <AlertTriangle size={30} />}
                    title={selectedStatus === 'SAFE' ? 'No pets added yet.' : 'No missing pet reports right now.'}
                    message={selectedStatus === 'SAFE' ? 'Add your pet profile to keep its details ready.' : 'Create an alert if your registered pet is missing.'}
                    action={
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(selectedStatus === 'SAFE' ? '/pet' : '/report')}
                      >
                        {selectedStatus === 'SAFE' ? 'Add Pet' : 'Create Report'}
                      </button>
                    }
                  />
                )}
              </div>
            </div>
            </div>,
            document.body
          )}
        </section>

        {/* Play Store Rating (First) + Feedback Action (Second) */}
        <section className="dashboard-bottom-feedback-section" aria-label="App rating and feedback">
          <PlayStoreEarlyAccessButton className="dashboard-playstore-rating-btn" />
          <button
            type="button"
            id="dashboard-feedback-btn"
            className="dashboard-rate-app-btn"
            onClick={() => {
              navigate('/feedback');
              window.dispatchEvent(new CustomEvent('open-suggestion-modal'));
            }}
            aria-label="Submit App Feedback"
          >
            <MessageCircle size={18} />
            <span>Submit Feedback</span>
          </button>
        </section>
      </div>

      {detailReport && canViewReportDetails(detailReport) && createPortal(
        (() => {
          const displayName = getDogDisplayName(detailReport.dog, detailReport);
          const photoUrl = getDogPhotoUrl(detailReport.dog, detailReport);
          const isMissing = detailReport.status === 'LOST';
          const location =
            detailReport.ownerApproximateLocation ||
            detailReport.lastKnownLocation ||
            'Safe at home';
          const traits = [
            detailReport.dog?.color,
            detailReport.dog?.size,
            detailReport.dog?.gender,
          ].filter(Boolean).join(' • ');

          return (
            <div
              className="dashboard-status-modal-backdrop"
              role="presentation"
              onClick={closePetDetails}
            >
              <section
                className="dashboard-status-pet-popover dashboard-status-pet-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`${displayName} details`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="dashboard-status-modal-close"
                  onClick={closePetDetails}
                  aria-label="Close pet details"
                >
                  <X size={22} />
                </button>

                <div className="dashboard-status-popover-photo-stage">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className="dashboard-status-popover-photo"
                      onError={handleDogImageError}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                      <Dog size={56} style={{ opacity: 0.5, color: '#f97316' }} />
                    </div>
                  )}
                </div>
                <div className="dashboard-status-popover-copy">
                  <div className="dashboard-status-modal-title-block">
                    <strong>{displayName}</strong>
                    <span>{detailReport.dog?.breed || 'Companion Pet'}</span>
                  </div>
                  {traits && (
                    <span className="dashboard-status-popover-line">
                      <Sparkles size={15} />
                      {traits}
                    </span>
                  )}
                  <span className="dashboard-status-popover-line">
                    <MapPin size={15} />
                    {isMissing ? detailReport.lastKnownLocation || location : location}
                  </span>
                  {isMissing && (
                    <span className="dashboard-status-popover-line">
                      <Calendar size={15} />
                      {detailReport.dateLost || 'Date unknown'} {detailReport.timeLost ? `• ${detailReport.timeLost}` : ''}
                    </span>
                  )}
                  {detailReport.dog?.distinguishingMarks && (
                    <p>{detailReport.dog.distinguishingMarks}</p>
                  )}
                  {detailReport.additionalNotes && (
                    <p>{detailReport.additionalNotes}</p>
                  )}
                  {isMissing && (
                    <a
                      href={`/report-sighting/${detailReport.id}`}
                      className="dashboard-status-popover-action"
                    >
                      <Eye size={16} />
                      <span>Report if found / sighted</span>
                    </a>
                  )}
                </div>
              </section>
            </div>
          );
        })(),
        document.body
      )}

      {detailSighting && createPortal(
        (() => {
          const report = getSightingReport(detailSighting);
          const displayName = detailSighting.dogName || report?.dog?.name || 'Missing Pet';
          const petSightings = sightings.filter((item) => item.reportId === detailSighting.reportId);
          
          let allPhotos: string[] = [];
          if (detailSighting.photos && detailSighting.photos.length > 0) {
            allPhotos = detailSighting.photos;
          } else if (detailSighting.photo) {
            allPhotos = [detailSighting.photo];
          }
          
          const photoUrl = resolveGenericMediaUrl(allPhotos[activeSightingPhotoIndex] || allPhotos[0] || '');
          
          const locationRows = [
            ['State', detailSighting.state],
            ['District', detailSighting.district],
            ['Mandal', detailSighting.mandal],
            ['Village', detailSighting.village],
            ['PIN Code', detailSighting.pinCode],
          ].filter(([, value]) => Boolean(value));

          return (
            <div
              className="dashboard-status-modal-backdrop"
              role="presentation"
              onClick={closeSightingDetails}
            >
              <section
                className="dashboard-status-pet-popover dashboard-status-pet-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`${displayName} sighting details`}
                onClick={(e) => e.stopPropagation()}
              >
              <button
                type="button"
                className="dashboard-status-modal-close"
                onClick={closeSightingDetails}
                aria-label="Close sighting details"
              >
                <X size={22} />
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {petSightings.length > 1 && (
                  <div className="dashboard-sighting-tabs" role="tablist" aria-label="Sightings for this pet">
                    {petSightings.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={item.id === detailSighting.id}
                        className={`dashboard-sighting-tab ${item.id === detailSighting.id ? 'active' : ''}`}
                        onClick={() => {
                          setDetailSighting(item);
                          setActiveSightingPhotoIndex(0);
                        }}
                      >
                        Sighting {index + 1}
                      </button>
                    ))}
                  </div>
                )}
                <div className="dashboard-status-popover-photo-stage" style={{ marginBottom: 0 }}>
                  <img
                    src={photoUrl}
                    alt={`${displayName} sighting`}
                    className="dashboard-status-popover-photo"
                    onError={handleDogImageError}
                  />
                </div>
                {allPhotos.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {allPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSightingPhotoIndex(idx)}
                        style={{
                          width: '48px',
                          height: '48px',
                          padding: 0,
                          border: activeSightingPhotoIndex === idx ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: '#000',
                          cursor: 'pointer',
                          opacity: activeSightingPhotoIndex === idx ? 1 : 0.6
                        }}
                      >
                        <img src={resolveGenericMediaUrl(p)} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="dashboard-status-popover-copy">
                <div className="dashboard-status-modal-title-block">
                  <strong>{displayName}</strong>
                  <span>Private sighting report</span>
                </div>
                <span className="dashboard-status-popover-line">
                  <Calendar size={15} />
                  {detailSighting.date} {detailSighting.time ? `• ${detailSighting.time}` : ''}
                </span>
                <span className="dashboard-status-popover-line">
                  <MapPin size={15} />
                  {detailSighting.location || 'Location shared'}
                </span>
                {locationRows.length > 0 && (
                  <div className="dashboard-sighting-location-grid">
                    {locationRows.map(([label, value]) => (
                      <div key={label} className="dashboard-sighting-location-cell">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                )}
                {detailSighting.description && <p>{detailSighting.description}</p>}
                {isDashboardAdmin && (
                  <button
                    type="button"
                    className="dashboard-sighting-delete-wide-btn"
                    onClick={() => {
                      handleDeleteSightingGroup(petSightings.length > 0 ? petSightings.map((s) => s.id) : [detailSighting.id]);
                    }}
                    title="Delete all sightings for this pet"
                  >
                    <Trash2 size={16} />
                    <span>Delete sightings for this pet</span>
                  </button>
                )}
                {report && (
                  <button
                    type="button"
                    className="dashboard-status-popover-action"
                    onClick={() => {
                      setDetailSighting(null);
                      openPetDetails(report);
                    }}
                  >
                    <Eye size={16} />
                    <span>View missing pet profile</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        );
      })(),
      document.body
    )}

    {detailAdoptionPet && createPortal(
      (() => {
        const photo = detailAdoptionPet.photo || detailAdoptionPet.photos?.[0] || '';
        const fullLocation = [
          detailAdoptionPet.village,
          detailAdoptionPet.mandal,
          detailAdoptionPet.district,
          detailAdoptionPet.state,
        ].filter(Boolean).join(', ') || detailAdoptionPet.city || 'Location available';

        return (
          <div
            className="dashboard-status-modal-backdrop"
            role="presentation"
            onClick={() => setDetailAdoptionPet(null)}
          >
            <section
              className="dashboard-status-pet-popover dashboard-status-pet-modal dashboard-adoption-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Adoption details for ${detailAdoptionPet.petName}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="dashboard-status-modal-close"
                onClick={() => setDetailAdoptionPet(null)}
                aria-label="Close adoption pet details"
              >
                <X size={22} />
              </button>

              <div className="dashboard-adoption-left-col">
                <div className="dashboard-adoption-media-card">
                  {photo ? (
                    <img
                      src={photo}
                      alt={detailAdoptionPet.petName}
                      className="dashboard-adoption-photo"
                      onError={handleDogImageError}
                    />
                  ) : (
                    <div className="dashboard-status-popover-photo-placeholder" style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(236,72,153,0.1)' }}>
                      <HeartHandshake size={56} style={{ color: '#F472B6' }} />
                    </div>
                  )}
                  <div className="dashboard-adoption-media-badges">
                    <span className="dashboard-adoption-badge-pill">
                      <Heart size={13} fill="#FFFFFF" /> Ready for Adoption
                    </span>
                    {detailAdoptionPet.flyerPhoto && (
                      <span className="dashboard-adoption-flyer-badge">
                        <FileText size={12} /> Rescue Poster
                      </span>
                    )}
                  </div>
                  {detailAdoptionPet.flyerPhoto && (
                    <button
                      type="button"
                      className="dashboard-adoption-media-zoom-btn"
                      onClick={() => setShareModalAdoptionPet(detailAdoptionPet)}
                      title="View Full Size Flyer / Poster"
                    >
                      <Eye size={14} /> Full Poster View & Share
                    </button>
                  )}
                </div>

                {/* Left column Adoption Fast Facts & Guidelines - utilizes remaining space seamlessly */}
                <div className="dashboard-adoption-guidelines-card">
                  <div className="dashboard-adoption-guidelines-header">
                    <Sparkles size={16} style={{ color: '#F472B6' }} />
                    <strong>Adoption Fast Facts & Process</strong>
                  </div>

                  <div className="dashboard-adoption-facts-grid">
                    <div className="dashboard-adoption-fact-item">
                      <span className="fact-label">Adoption Fee</span>
                      <strong className="fact-value" style={{ color: '#34D399' }}>₹0 (Free Adoption)</strong>
                    </div>
                    <div className="dashboard-adoption-fact-item">
                      <span className="fact-label">Ref ID</span>
                      <strong className="fact-value" style={{ color: '#E2E8F0' }}>#{detailAdoptionPet.id.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div className="dashboard-adoption-fact-item">
                      <span className="fact-label">Medical Care</span>
                      <strong className="fact-value" style={{ color: '#60A5FA' }}>
                        {detailAdoptionPet.vaccinated ? '✓ Vaccinated' : 'To be scheduled'}
                      </strong>
                    </div>
                    <div className="dashboard-adoption-fact-item">
                      <span className="fact-label">Location Area</span>
                      <strong className="fact-value" style={{ color: '#F472B6' }}>
                        {detailAdoptionPet.district || detailAdoptionPet.city || 'Local Area'}
                      </strong>
                    </div>
                  </div>

                  <div className="dashboard-adoption-steps-box">
                    <span className="steps-title">3 Steps to Welcome {detailAdoptionPet.petName}:</span>
                    <ol className="adoption-steps-list">
                      <li>
                        <span className="step-num">1</span>
                        <span><strong>Connect:</strong> Call or WhatsApp the caretaker directly below</span>
                      </li>
                      <li>
                        <span className="step-num">2</span>
                        <span><strong>Meet & Greet:</strong> Schedule a friendly visit to bond with {detailAdoptionPet.petName}</span>
                      </li>
                      <li>
                        <span className="step-num">3</span>
                        <span><strong>Forever Promise:</strong> Sign adoption pledge & welcome the pup home</span>
                      </li>
                    </ol>
                  </div>

                  <div className="dashboard-adoption-share-callout">
                    <p>Help this loving pup find a home faster by sharing with local animal lovers & WhatsApp groups!</p>
                    <button
                      type="button"
                      className="dashboard-adoption-quick-share-btn"
                      onClick={() => setShareModalAdoptionPet(detailAdoptionPet)}
                    >
                      <Share2 size={14} /> Share Card & WhatsApp Flyer
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-status-popover-copy">
                <div className="dashboard-status-modal-title-block">
                  <strong>{detailAdoptionPet.petName}</strong>
                  <span style={{ color: '#F472B6' }}>Looking for a forever home</span>
                </div>

                <div className="dashboard-adoption-attributes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', margin: '0.75rem 0' }}>
                  <div className="dashboard-adoption-attr-card" style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <small style={{ color: '#9CA3AF', display: 'block', fontSize: '0.7rem' }}>BREED</small>
                    <strong style={{ fontSize: '0.88rem' }}>{detailAdoptionPet.breed || 'Mixed'}</strong>
                  </div>
                  <div className="dashboard-adoption-attr-card" style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <small style={{ color: '#9CA3AF', display: 'block', fontSize: '0.7rem' }}>AGE</small>
                    <strong style={{ fontSize: '0.88rem' }}>{detailAdoptionPet.age || 'Not specified'}</strong>
                  </div>
                  <div className="dashboard-adoption-attr-card" style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <small style={{ color: '#9CA3AF', display: 'block', fontSize: '0.7rem' }}>GENDER</small>
                    <strong style={{ fontSize: '0.88rem' }}>{detailAdoptionPet.gender || 'Unknown'}</strong>
                  </div>
                  <div className="dashboard-adoption-attr-card" style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <small style={{ color: '#9CA3AF', display: 'block', fontSize: '0.7rem' }}>SIZE</small>
                    <strong style={{ fontSize: '0.88rem' }}>{detailAdoptionPet.size || 'Medium'}</strong>
                  </div>
                </div>

                <span className="dashboard-status-popover-line">
                  <MapPin size={15} style={{ color: '#F472B6' }} />
                  {fullLocation} {detailAdoptionPet.pinCode ? `(PIN: ${detailAdoptionPet.pinCode})` : ''}
                </span>

                {/* Medical / Care tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.5rem 0' }}>
                  {detailAdoptionPet.vaccinated && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={11} /> Vaccinated
                    </span>
                  )}
                  {detailAdoptionPet.dewormed && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={11} /> Dewormed
                    </span>
                  )}
                  {detailAdoptionPet.spayedOrNeutered && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={11} /> Neutered / Spayed
                    </span>
                  )}
                </div>

                {detailAdoptionPet.description && (
                  <p style={{ margin: '0.5rem 0', color: '#D1D5DB', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    {detailAdoptionPet.description}
                  </p>
                )}

                {detailAdoptionPet.healthNotes && (
                  <div style={{ margin: '0.5rem 0', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #F472B6' }}>
                    <strong style={{ fontSize: '0.78rem', color: '#F472B6', display: 'block' }}>Health & Care Notes:</strong>
                    <span style={{ fontSize: '0.82rem', color: '#E5E7EB' }}>{detailAdoptionPet.healthNotes}</span>
                  </div>
                )}

                {detailAdoptionPet.flyerPhoto && (
                  <button
                    type="button"
                    onClick={() => setShareModalAdoptionPet(detailAdoptionPet)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(139,92,246,0.15) 100%)',
                      border: '1px solid rgba(236,72,153,0.35)',
                      color: '#F472B6',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      margin: '0.5rem 0',
                    }}
                  >
                    <FileText size={15} />
                    <span>View & Share Original Adoption Poster</span>
                  </button>
                )}

                {/* Caretaker / Contact Card with Revealed Phone */}
                {(() => {
                  const isCreator = Boolean(
                    user &&
                    (detailAdoptionPet.userId === user.id ||
                     (user.email && detailAdoptionPet.contactEmail?.toLowerCase().trim() === user.email.toLowerCase().trim()))
                  );
                  const displayCaretakerName = detailAdoptionPet.contactName?.trim() || (isCreator ? 'You (Caretaker)' : 'Pet Caretaker / Rescuer');
                  const revealedPhone = getRevealedAdoptionPhone(detailAdoptionPet);
                  const cleanDigits = revealedPhone.replace(/[^0-9]/g, '');
                  const displayEmail = isCreator
                    ? (detailAdoptionPet.rawContactEmail || detailAdoptionPet.contactEmail)
                    : (detailAdoptionPet.contactEmail || '');

                  return (
                    <div className="dashboard-adoption-contact-card" style={{ marginTop: '0.85rem', padding: '0.85rem', background: 'linear-gradient(145deg, rgba(236,72,153,0.12), rgba(0,0,0,0.4))', borderRadius: '14px', border: '1px solid rgba(244,114,182,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.92rem', color: '#FFFFFF' }}>
                            {displayCaretakerName} {isCreator ? '(You - Caretaker)' : ''}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                            {isCreator ? 'Your Contact Information' : 'Direct Rescuer / Caretaker Contact'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <ShieldCheck size={12} /> {isCreator ? 'Your Profile' : 'Verified Contact'}
                        </span>
                      </div>

                      {/* Contact Lines with Copy Action */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
                        {revealedPhone && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Phone size={14} style={{ color: '#10B981' }} />
                              <span>Phone: <strong style={{ color: '#34D399', fontSize: '0.92rem' }}>{revealedPhone}</strong></span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(revealedPhone);
                                showToast(`Phone copied: ${revealedPhone}`, 'success');
                              }}
                              title="Copy Phone Number"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(16,185,129,0.2)',
                                border: '1px solid rgba(16,185,129,0.4)',
                                color: '#A7F3D0',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              <Copy size={11} /> Copy
                            </button>
                          </div>
                        )}
                        {displayEmail && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Mail size={14} style={{ color: '#60A5FA' }} />
                            <span>Email: <strong>{displayEmail}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Direct Adoption Phone Notice */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.75rem', color: '#A7F3D0', background: 'rgba(16,185,129,0.1)', padding: '7px 10px', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <ShieldCheck size={14} style={{ color: '#34D399', flexShrink: 0, marginTop: '1px' }} />
                        <span>
                          Direct Adoption Phone: Revealed for immediate adoption inquiries, meeting arrangements, and community sharing.
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: revealedPhone ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
                        {revealedPhone && (
                          <>
                            <a
                              href={`tel:${cleanDigits.startsWith('91') ? '+' + cleanDigits : (cleanDigits.length === 10 ? '+91' + cleanDigits : cleanDigits)}`}
                              className="btn btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                borderRadius: '10px',
                                padding: '0.55rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '0.84rem',
                              }}
                            >
                              <Phone size={14} />
                              <span>Call Caretaker</span>
                            </a>
                            <a
                              href={`https://wa.me/${cleanDigits.startsWith('91') ? cleanDigits : (cleanDigits.length === 10 ? '91' + cleanDigits : cleanDigits)}?text=${encodeURIComponent(`Hi, I am interested in adopting ${detailAdoptionPet.petName} posted on FindLostPuppy! Is the puppy still available?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: '#25D366',
                                color: '#FFFFFF',
                                borderRadius: '10px',
                                padding: '0.55rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '0.84rem',
                              }}
                            >
                              <MessageCircle size={15} />
                              <span>WhatsApp</span>
                            </a>
                          </>
                        )}
                        {displayEmail && (
                          <a
                            href={`mailto:${displayEmail}?subject=${encodeURIComponent(`Adoption inquiry: ${detailAdoptionPet.petName}`)}&body=${encodeURIComponent(`Hi ${displayCaretakerName},\n\nI saw ${detailAdoptionPet.petName} on FindLostPuppy and would love to know more about the adoption process.\n\nMy Details:\nName: ${user?.name || ''}\nPhone: ${user?.phone || ''}\n\nThank you!`)}`}
                            className="btn btn-sm"
                            style={{
                              gridColumn: !revealedPhone ? '1 / -1' : undefined,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                              border: 'none',
                              color: '#FFFFFF',
                              borderRadius: '10px',
                              padding: '0.55rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              fontSize: '0.82rem',
                            }}
                          >
                            <Mail size={14} />
                            <span>Inquire to Adopt via Email</span>
                          </a>
                        )}

                        {/* Share Adoption Card Action */}
                        <button
                          type="button"
                          onClick={() => setShareModalAdoptionPet(detailAdoptionPet)}
                          style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '0.65rem 1rem',
                            borderRadius: '10px',
                            background: 'rgba(236, 72, 153, 0.18)',
                            border: '1.5px solid rgba(244, 114, 182, 0.45)',
                            color: '#FCE7F3',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            marginTop: '0.35rem',
                          }}
                        >
                          <Share2 size={15} style={{ color: '#F472B6' }} />
                          <span>Share Public Adoption Card (Image & WhatsApp)</span>
                        </button>

                        {/* Edit & Update Listing Action (For Caretaker to prevent duplicates) */}
                        {isCreator && (
                          <button
                            type="button"
                            onClick={() => {
                              const petToEdit = detailAdoptionPet;
                              setDetailAdoptionPet(null);
                              navigate('/adoption-details', {
                                state: { adoptionPetId: petToEdit.id },
                              });
                            }}
                            style={{
                              gridColumn: '1 / -1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '0.65rem 1rem',
                              borderRadius: '10px',
                              background: 'rgba(59, 130, 246, 0.16)',
                              border: '1.5px solid rgba(96, 165, 250, 0.45)',
                              color: '#BFDBFE',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              marginTop: '0.2rem',
                            }}
                          >
                            <Edit3 size={15} style={{ color: '#60A5FA' }} />
                            <span>Edit & Update Pet Details (No Duplicates)</span>
                          </button>
                        )}

                        {/* Delete Listing Action (For Caretaker or Admin) */}
                        {(isCreator || isDashboardAdmin) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteAdoptionPet(detailAdoptionPet.id, detailAdoptionPet.petName);
                            }}
                            style={{
                              gridColumn: '1 / -1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '0.65rem 1rem',
                              borderRadius: '10px',
                              background: 'rgba(239, 68, 68, 0.16)',
                              border: '1.5px solid rgba(248, 113, 113, 0.45)',
                              color: '#FCA5A5',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              marginTop: '0.2rem',
                            }}
                          >
                            <Trash2 size={15} style={{ color: '#F87171' }} />
                            <span>Delete Adoption Listing</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          </div>
        );
      })(),
      document.body
    )}

      {/* Public Adoption Share Modal */}
      <AdoptionShareModal
        isOpen={Boolean(shareModalAdoptionPet)}
        onClose={() => setShareModalAdoptionPet(null)}
        pet={shareModalAdoptionPet}
        continueLabel="Close"
        onContinue={() => setShareModalAdoptionPet(null)}
      />
    </div>
  );
};
