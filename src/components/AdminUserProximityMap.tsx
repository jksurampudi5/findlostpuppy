import React, { useState, useMemo } from 'react';
import {
  Radar,
  MapPin,
  Radio,
  Sliders,
  Navigation,
  Compass,
  Zap,
} from 'lucide-react';
import type { User, OwnerProfile } from '../types';
import { useToast } from '../context/ToastContext';

interface AdminUserProximityMapProps {
  users: User[];
  profiles: OwnerProfile[];
}

export interface UserGeoNode {
  id: string;
  name: string;
  email: string;
  phone?: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  lat: number;
  lng: number;
  hasExactGps: boolean;
  role: string;
}

export interface UserProximityPair {
  user1: UserGeoNode;
  user2: UserGeoNode;
  distanceKm: number;
  inZone: boolean;
}

// Haversine distance formula in kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Fallback coordinate mapping for common locations if exact GPS was not acquired
const REGIONAL_COORDS: Record<string, [number, number]> = {
  palangi: [16.7706, 81.6978],
  undrajavaram: [16.7725, 81.6854],
  tanuku: [16.7565, 81.7056],
  satyavada: [16.7862, 81.6696],
  chivatam: [16.7801, 81.6802],
  tadepalligudem: [16.8142, 81.5267],
  bhimavaram: [16.5449, 81.5212],
  hyderabad: [17.385, 78.4867],
  vijayawada: [16.5062, 80.648],
  rajahmundry: [17.0005, 81.804],
  kakinada: [16.9891, 82.2475],
};

function resolveUserCoordinates(profile?: OwnerProfile, user?: User): { lat: number; lng: number; hasExactGps: boolean } {
  if (profile?.latitude && profile?.longitude) {
    return { lat: profile.latitude, lng: profile.longitude, hasExactGps: true };
  }

  // Fallback to village / mandal center
  const key = (profile?.city || profile?.mandalOrMunicipality || '').trim().toLowerCase();
  if (REGIONAL_COORDS[key]) {
    return { lat: REGIONAL_COORDS[key][0], lng: REGIONAL_COORDS[key][1], hasExactGps: false };
  }

  // Base fallback near Tanuku/Palangi cluster with minor pseudo-jitter based on ID
  const hash = (user?.id || profile?.id || 'default').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const jitterLat = ((hash % 100) - 50) * 0.005;
  const jitterLng = (((hash * 13) % 100) - 50) * 0.005;
  return { lat: 16.7706 + jitterLat, lng: 81.6978 + jitterLng, hasExactGps: false };
}

export const AdminUserProximityMap: React.FC<AdminUserProximityMapProps> = ({ users, profiles }) => {
  const { showToast } = useToast();
  const [alertThresholdKm, setAlertThresholdKm] = useState<number>(5);
  const [selectedUser, setSelectedUser] = useState<UserGeoNode | null>(null);
  const [filterNearbyOnly, setFilterNearbyOnly] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'radar' | 'map'>('radar');
  const [lastDispatchedAlert, setLastDispatchedAlert] = useState<string | null>(null);

  // Compile unified user geo nodes
  const geoNodes: UserGeoNode[] = useMemo(() => {
    const nodes: UserGeoNode[] = [];
    const seenIds = new Set<string>();

    users.forEach((u) => {
      seenIds.add(u.id);
      const prof = profiles.find((p) => p.userId === u.id || p.id === u.id || (p.email && p.email.toLowerCase() === u.email.toLowerCase()));
      const coords = resolveUserCoordinates(prof, u);
      nodes.push({
        id: u.id,
        name: prof?.fullName || u.name || 'Community Member',
        email: u.email,
        phone: prof?.phone || u.phone,
        state: prof?.state || 'Andhra Pradesh',
        district: prof?.district || 'West Godavari',
        mandal: prof?.mandalOrMunicipality || 'Undrajavaram',
        village: prof?.city || prof?.streetOrLocality || 'Palangi',
        lat: coords.lat,
        lng: coords.lng,
        hasExactGps: coords.hasExactGps,
        role: u.isAdmin ? 'Admin' : 'Pet Parent',
      });
    });

    // Also include any profiles not linked to users array
    profiles.forEach((p) => {
      if (!seenIds.has(p.userId) && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        const coords = resolveUserCoordinates(p);
        nodes.push({
          id: p.id,
          name: p.fullName || 'Pet Parent',
          email: p.email || 'Private',
          phone: p.phone,
          state: p.state || 'Andhra Pradesh',
          district: p.district || 'West Godavari',
          mandal: p.mandalOrMunicipality || 'Undrajavaram',
          village: p.city || p.streetOrLocality || 'Palangi',
          lat: coords.lat,
          lng: coords.lng,
          hasExactGps: coords.hasExactGps,
          role: 'Pet Parent',
        });
      }
    });

    return nodes;
  }, [users, profiles]);

  // Compute all pairwise distances
  const proximityPairs: UserProximityPair[] = useMemo(() => {
    const pairs: UserProximityPair[] = [];
    for (let i = 0; i < geoNodes.length; i++) {
      for (let j = i + 1; j < geoNodes.length; j++) {
        const u1 = geoNodes[i];
        const u2 = geoNodes[j];
        const dist = calculateHaversineDistanceKm(u1.lat, u1.lng, u2.lat, u2.lng);
        pairs.push({
          user1: u1,
          user2: u2,
          distanceKm: dist,
          inZone: dist <= alertThresholdKm,
        });
      }
    }
    return pairs.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [geoNodes, alertThresholdKm]);

  // Pairs currently triggering proximity alert
  const alertPairs = useMemo(() => proximityPairs.filter((p) => p.inZone), [proximityPairs]);

  // Map coordinate bounds
  const bounds = useMemo(() => {
    if (geoNodes.length === 0) return { minLat: 16.7, maxLat: 16.85, minLng: 81.6, maxLng: 81.8 };
    const lats = geoNodes.map((n) => n.lat);
    const lngs = geoNodes.map((n) => n.lng);
    const pad = 0.03;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [geoNodes]);

  // Convert lat/lng to normalized SVG percentage (0-100)
  const getSvgCoords = (lat: number, lng: number) => {
    const xRange = bounds.maxLng - bounds.minLng || 0.1;
    const yRange = bounds.maxLat - bounds.minLat || 0.1;
    const x = ((lng - bounds.minLng) / xRange) * 80 + 10;
    const y = 90 - ((lat - bounds.minLat) / yRange) * 80;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  };

  const handleSimulateAlert = (pair: UserProximityPair) => {
    const msg = `🚨 PROXIMITY ALERT SENT: "${pair.user1.name}" & "${pair.user2.name}" are only ${pair.distanceKm} km apart in ${pair.user1.mandal}!`;
    setLastDispatchedAlert(msg);
    showToast(msg, 'warning');
  };

  const handleBroadcastAllNearby = () => {
    if (alertPairs.length === 0) {
      showToast(`No users found within the ${alertThresholdKm} km zone. Adjust slider to expand zone.`, 'info');
      return;
    }
    const msg = `⚡ Automated alert broadcast to ${alertPairs.length} user pair(s) within ${alertThresholdKm} km zone!`;
    setLastDispatchedAlert(msg);
    showToast(msg, 'success');
  };

  return (
    <div className="admin-proximity-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Controls */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 16, 16, 0.95) 0%, rgba(30, 20, 15, 0.95) 100%)',
          border: '1.5px solid rgba(255, 121, 0, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(255, 121, 0, 0.2)',
                  color: '#FF7900',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                }}
              >
                <Radar size={22} className="spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>
                  Admin Proximity Radar & User Distance Map
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                  Real-time geographic distance calculation and automated community alert triggers
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#18181b', borderRadius: '10px', padding: '3px', border: '1px solid #3f3f46' }}>
              <button
                type="button"
                onClick={() => setActiveViewMode('radar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeViewMode === 'radar' ? '#FF7900' : 'transparent',
                  color: activeViewMode === 'radar' ? '#000' : '#d4d4d8',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Compass size={15} />
                <span>Radar View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('map')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeViewMode === 'map' ? '#FF7900' : 'transparent',
                  color: activeViewMode === 'map' ? '#000' : '#d4d4d8',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <MapPin size={15} />
                <span>Map Grid</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleBroadcastAllNearby}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: alertPairs.length > 0 ? 'linear-gradient(135deg, #FF7900 0%, #EA580C 100%)' : '#3f3f46',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: alertPairs.length > 0 ? 'pointer' : 'default',
                boxShadow: alertPairs.length > 0 ? '0 4px 15px rgba(255, 121, 0, 0.4)' : 'none',
              }}
            >
              <Radio size={16} />
              <span>Broadcast Proximity Alert ({alertPairs.length})</span>
            </button>
          </div>
        </div>

        {/* Proximity Slider & Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '15px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} color="#FF7900" />
                Alert Radius Zone:
              </span>
              <strong style={{ color: '#FF7900', fontSize: '0.95rem' }}>{alertThresholdKm} km</strong>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={alertThresholdKm}
              onChange={(e) => setAlertThresholdKm(Number(e.target.value))}
              style={{ accentColor: '#FF7900', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
              Users within this distance automatically trigger proximity alerts.
            </span>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Active Mapped Users</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
              {geoNodes.length} members
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Nearby Active Pairs (&le; {alertThresholdKm}km)</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: alertPairs.length > 0 ? '#4ade80' : '#9ca3af', marginTop: '2px' }}>
              {alertPairs.length} alerts active
            </div>
          </div>
        </div>

        {lastDispatchedAlert && (
          <div
            style={{
              marginTop: '15px',
              padding: '10px 14px',
              background: 'rgba(234, 88, 12, 0.15)',
              border: '1px solid rgba(234, 88, 12, 0.4)',
              borderRadius: '8px',
              color: '#fdba74',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Zap size={16} />
            <span>{lastDispatchedAlert}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map Visualizer + User Detail Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px' }}>
        {/* Visual Map Area */}
        <div
          style={{
            position: 'relative',
            background: '#09090b',
            border: '1.5px solid rgba(255, 121, 0, 0.25)',
            borderRadius: '16px',
            minHeight: '480px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* Radar background grids */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(rgba(255, 121, 0, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(255, 121, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 121, 0, 0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px, 40px 40px, 40px 40px',
              opacity: 0.8,
            }}
          />

          {/* Radar concentric sweep circles */}
          {activeViewMode === 'radar' && (
            <div
              style={{
                position: 'absolute',
                width: '380px',
                height: '380px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 121, 0, 0.2)',
                boxShadow: '0 0 40px rgba(255, 121, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(255, 121, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 121, 0, 0.35)',
                  }}
                />
              </div>
            </div>
          )}

          {/* SVG Distance lines connecting nearby pairs */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {alertPairs.map((pair, idx) => {
              const p1 = getSvgCoords(pair.user1.lat, pair.user1.lng);
              const p2 = getSvgCoords(pair.user2.lat, pair.user2.lng);
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              return (
                <g key={`pair-line-${idx}`}>
                  <line
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="#FF7900"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.75"
                  />
                  {/* Distance label pill */}
                  <rect
                    x={`${midX - 3.5}%`}
                    y={`${midY - 2}%`}
                    width="7%"
                    height="4%"
                    rx="4"
                    fill="#18181b"
                    stroke="#FF7900"
                    strokeWidth="1"
                  />
                  <text
                    x={`${midX}%`}
                    y={`${midY + 0.8}%`}
                    fill="#FF7900"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {pair.distanceKm} km
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Plotted User Nodes */}
          {geoNodes.map((node) => {
            const { x, y } = getSvgCoords(node.lat, node.lng);
            const isSelected = selectedUser?.id === node.id;
            const hasNearby = alertPairs.some((p) => p.user1.id === node.id || p.user2.id === node.id);

            return (
              <div
                key={node.id}
                onClick={() => setSelectedUser(node)}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 30 : 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Pulse Ring for alert zone nodes */}
                {hasNearby && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 121, 0, 0.25)',
                      animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />
                )}

                {/* Avatar Pin */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelected
                      ? '#FF7900'
                      : hasNearby
                      ? 'linear-gradient(135deg, #FF7900 0%, #b45309 100%)'
                      : '#27272a',
                    border: `2px solid ${isSelected ? '#fff' : hasNearby ? '#FF7900' : '#52525b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected
                      ? '0 0 20px #FF7900'
                      : hasNearby
                      ? '0 0 12px rgba(255, 121, 0, 0.5)'
                      : '0 2px 8px rgba(0,0,0,0.6)',
                    color: isSelected ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  {node.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Name Label */}
                <div
                  style={{
                    marginTop: '4px',
                    background: 'rgba(9, 9, 11, 0.85)',
                    border: `1px solid ${isSelected ? '#FF7900' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: isSelected ? '#FF7900' : '#e4e4e7',
                    whiteSpace: 'nowrap',
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                >
                  {node.name}
                  {hasNearby && ' ⚡'}
                </div>
              </div>
            );
          })}

          {/* Radar HUD Overlay Controls */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(9, 9, 11, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#a1a1aa',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF7900' }} />
              Nearby User (&le; {alertThresholdKm}km)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52525b' }} />
              Distant User
            </span>
          </div>
        </div>

        {/* Selected User & Nearby Neighbors Panel */}
        <div
          style={{
            background: '#121215',
            border: '1.5px solid rgba(255, 121, 0, 0.25)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '480px',
            overflowY: 'auto',
          }}
        >
          {selectedUser ? (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 'bold' }}>
                    {selectedUser.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      background: selectedUser.role === 'Admin' ? '#3b82f6' : '#FF7900',
                      color: selectedUser.role === 'Admin' ? '#fff' : '#000',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {selectedUser.role}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#FF7900" />
                  {selectedUser.village}, {selectedUser.mandal}, {selectedUser.district}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                  Coords: {selectedUser.lat.toFixed(4)}, {selectedUser.lng.toFixed(4)}
                  {selectedUser.hasExactGps ? ' (GPS Fixed)' : ' (Locality Approx)'}
                </div>
              </div>

              {/* Neighbors to this user */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={14} color="#FF7900" />
                  Distances to other members:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {geoNodes
                    .filter((n) => n.id !== selectedUser.id)
                    .map((other) => {
                      const dist = calculateHaversineDistanceKm(selectedUser.lat, selectedUser.lng, other.lat, other.lng);
                      const isClose = dist <= alertThresholdKm;

                      return (
                        <div
                          key={other.id}
                          style={{
                            background: isClose ? 'rgba(255, 121, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isClose ? 'rgba(255, 121, 0, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
                            borderRadius: '8px',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: isClose ? '#FF7900' : '#fff' }}>
                              {other.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
                              {other.village}, {other.mandal}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '0.88rem', color: isClose ? '#4ade80' : '#9ca3af' }}>
                              {dist} km
                            </strong>
                            {isClose && (
                              <div style={{ fontSize: '0.68rem', color: '#FF7900', fontWeight: 'bold' }}>
                                ALERT ZONE
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#71717a' }}>
              <Compass size={32} color="#52525b" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#d4d4d8' }}>Select any member on the map</p>
              <span style={{ fontSize: '0.75rem' }}>View pairwise proximity, mandal clusters, and alert radius metrics</span>
            </div>
          )}
        </div>
      </div>

      {/* Proximity Pairs Matrix Table */}
      <div
        style={{
          background: '#121215',
          border: '1.5px solid rgba(255, 121, 0, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
              Member Pairwise Distance & Alert Registry
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
              Complete matrix of calculated geographic distances between registered pet parents
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#d4d4d8' }}>
            <input
              type="checkbox"
              checked={filterNearbyOnly}
              onChange={(e) => setFilterNearbyOnly(e.target.checked)}
              style={{ accentColor: '#FF7900' }}
            />
            Show only nearby alert pairs (&le; {alertThresholdKm}km)
          </label>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#a1a1aa', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>Member 1</th>
              <th style={{ padding: '10px 12px' }}>Area 1</th>
              <th style={{ padding: '10px 12px' }}>Member 2</th>
              <th style={{ padding: '10px 12px' }}>Area 2</th>
              <th style={{ padding: '10px 12px' }}>Distance</th>
              <th style={{ padding: '10px 12px' }}>Proximity Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {(filterNearbyOnly ? alertPairs : proximityPairs).map((pair, idx) => (
              <tr
                key={`matrix-row-${idx}`}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: pair.inZone ? 'rgba(255, 121, 0, 0.06)' : 'transparent',
                }}
              >
                <td style={{ padding: '12px', color: '#fff', fontWeight: 'bold' }}>{pair.user1.name}</td>
                <td style={{ padding: '12px', color: '#a1a1aa' }}>
                  {pair.user1.village}, {pair.user1.mandal}
                </td>
                <td style={{ padding: '12px', color: '#fff', fontWeight: 'bold' }}>{pair.user2.name}</td>
                <td style={{ padding: '12px', color: '#a1a1aa' }}>
                  {pair.user2.village}, {pair.user2.mandal}
                </td>
                <td style={{ padding: '12px' }}>
                  <strong style={{ color: pair.inZone ? '#4ade80' : '#d4d4d8' }}>{pair.distanceKm} km</strong>
                </td>
                <td style={{ padding: '12px' }}>
                  {pair.inZone ? (
                    <span
                      style={{
                        background: 'rgba(234, 88, 12, 0.2)',
                        color: '#FF7900',
                        border: '1px solid rgba(234, 88, 12, 0.4)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Zap size={12} />
                      WITHIN ZONE (&le; {alertThresholdKm}km)
                    </span>
                  ) : (
                    <span style={{ color: '#71717a', fontSize: '0.75rem' }}>Out of zone</span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => handleSimulateAlert(pair)}
                    style={{
                      background: 'rgba(255, 121, 0, 0.15)',
                      border: '1px solid rgba(255, 121, 0, 0.3)',
                      color: '#FF7900',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Simulate Alert
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
