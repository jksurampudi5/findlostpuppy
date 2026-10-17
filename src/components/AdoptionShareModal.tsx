import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Heart,
  MapPin,
  Landmark,
  Building2,
  Home,
  ShieldCheck,
  Phone,
  Globe,
  ExternalLink,
} from 'lucide-react';
import type { AdoptionPet } from '../types';
import {
  generateAdoptionWhatsAppMessage,
  downloadAdoptionCardImage,
  shareAdoptionCardViaMedia,
  downloadAdoptionFlyerImage,
  shareAdoptionFlyerViaMedia,
  getAdoptionShareUrl,
  getRevealedAdoptionPhone,
} from '../utils/adoptionCardHelper';
import { useToast } from '../context/ToastContext';

interface AdoptionShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: AdoptionPet | null;
  onContinue?: () => void;
  continueLabel?: string;
}

export const AdoptionShareModal: React.FC<AdoptionShareModalProps> = ({
  isOpen,
  onClose,
  pet,
  onContinue,
  continueLabel = 'Continue to Pet Choice',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'flyer' | 'card'>(
    pet?.flyerPhoto ? 'flyer' : 'card'
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen || !pet) return null;

  const shareUrl = getAdoptionShareUrl(pet.id);
  const { whatsappUrl, message } = generateAdoptionWhatsAppMessage(pet);

  const handleWhatsAppShare = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    showToast('💬 Opening WhatsApp to share adoption flyer...', 'success');
  };

  const handleDownloadImage = async () => {
    try {
      setIsDownloading(true);
      if (activeTab === 'flyer' && pet.flyerPhoto) {
        await downloadAdoptionFlyerImage(pet);
        showToast('📥 Original adoption poster downloaded successfully!', 'success');
      } else {
        await downloadAdoptionCardImage(pet);
        showToast('📥 Adoption card image downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to download image:', err);
      showToast('Could not download image. Please try sharing via WhatsApp instead.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsSharing(true);
      let shared = false;
      if (activeTab === 'flyer' && pet.flyerPhoto) {
        shared = await shareAdoptionFlyerViaMedia(pet);
      } else {
        shared = await shareAdoptionCardViaMedia(pet);
      }
      if (shared) {
        showToast('🚀 Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(message);
        showToast('📋 Adoption details copied to clipboard!', 'info');
      }
    } catch (err) {
      console.warn('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${message}\n\n👉 Open app: ${shareUrl}`);
      setIsCopied(true);
      showToast('📋 Adoption announcement & app link copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('Failed to copy. Please use the WhatsApp share button.', 'error');
    }
  };

  const medicalList = [
    pet.vaccinated ? 'Vaccinated' : null,
    pet.dewormed ? 'Dewormed' : null,
    pet.spayedOrNeutered ? 'Neutered / Spayed' : null,
  ].filter(Boolean);

  return (
    <div
      className="dashboard-status-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="adoption-share-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, #1C1220 0%, #110B14 100%)',
          border: '1.5px solid rgba(244, 114, 182, 0.4)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 12px 48px rgba(236, 72, 153, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* MODAL HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Heart size={12} fill="#FFF" /> READY FOR ADOPTION
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Public Share Card</span>
            </div>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              Share {pet.petName}'s Adoption Flyer
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Share this card with friends, neighbors & WhatsApp groups to find a loving home!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share card"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* TAB SWITCHER: ORIGINAL FLYER vs GENERATED CARD */}
        {pet.flyerPhoto && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('flyer')}
              style={{
                flex: 1,
                padding: '0.6rem 0.75rem',
                borderRadius: '10px',
                border: 'none',
                background:
                  activeTab === 'flyer'
                    ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)'
                    : 'transparent',
                color: activeTab === 'flyer' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>📄 Original Poster / Flyer</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              style={{
                flex: 1,
                padding: '0.6rem 0.75rem',
                borderRadius: '10px',
                border: 'none',
                background:
                  activeTab === 'card'
                    ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)'
                    : 'transparent',
                color: activeTab === 'card' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🎨 Generated Card</span>
            </button>
          </div>
        )}

        {/* VIEW 1: ORIGINAL FLYER DISPLAY */}
        {activeTab === 'flyer' && pet.flyerPhoto ? (
          <div
            style={{
              background: 'linear-gradient(145deg, #2A172D 0%, #150B18 100%)',
              border: '2px solid rgba(244, 114, 182, 0.5)',
              borderRadius: '18px',
              padding: '1rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>Original Adoption Poster</span>
              <span style={{ fontSize: '0.72rem', color: '#34D399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '8px' }}>Ready to Share</span>
            </div>

            <div style={{ width: '100%', maxHeight: '420px', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <img
                src={pet.flyerPhoto}
                alt="Adoption Poster"
                style={{
                  maxWidth: '100%',
                  maxHeight: '420px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
              />
            </div>
          </div>
        ) : (
          /* 🌟 VIEW 2: THE ADOPTION FLYER CARD (Visual representation ready for public sharing) */
          <div
            id="adoption-share-card-element"
            style={{
              background: 'linear-gradient(145deg, #2A172D 0%, #150B18 100%)',
              border: '2px solid rgba(244, 114, 182, 0.5)',
              borderRadius: '18px',
              padding: '1.25rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(236, 72, 153, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
            }}
          >
            {/* Card Top Brand & Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>🐾</span>
              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                FindLostPuppy Adoption
              </strong>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#F472B6',
                background: 'rgba(236, 72, 153, 0.18)',
                border: '1px solid rgba(244, 114, 182, 0.35)',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              ♥ Open for Adoption
            </span>
          </div>

          {/* Photo and Primary Info */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div
              style={{
                width: '105px',
                height: '105px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#2A1828',
                border: '2px solid rgba(244, 114, 182, 0.6)',
                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)',
                flexShrink: 0,
              }}
            >
              {pet.photo ? (
                <img
                  src={pet.photo}
                  alt={pet.petName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F472B6' }}>
                  <Heart size={36} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                {pet.petName}
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#FCE7F3', fontWeight: 600 }}>
                {pet.breed || 'Indie / Desi Dog'}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: '#D1D5DB', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>
                  {pet.gender}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#D1D5DB', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>
                  {pet.age}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#D1D5DB', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>
                  {pet.size}
                </span>
              </div>
              {medicalList.length > 0 && (
                <span style={{ fontSize: '0.74rem', color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, marginTop: '2px' }}>
                  <ShieldCheck size={12} /> {medicalList.join(' • ')}
                </span>
              )}
            </div>
          </div>

          {/* 📍 4 LOCATION CARDS (Grid matching user location requirement) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.75rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={14} style={{ color: '#A855F7', flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <small style={{ display: 'block', fontSize: '0.66rem', color: '#9CA3AF', textTransform: 'uppercase' }}>State</small>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pet.state || 'Selected'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} style={{ color: '#38BDF8', flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <small style={{ display: 'block', fontSize: '0.66rem', color: '#9CA3AF', textTransform: 'uppercase' }}>District</small>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pet.district || 'Selected'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} style={{ color: '#34D399', flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <small style={{ display: 'block', fontSize: '0.66rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Mandal</small>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pet.mandal || 'Selected'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={14} style={{ color: '#FB923C', flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <small style={{ display: 'block', fontSize: '0.66rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Village / Locality</small>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pet.village || pet.city || 'Selected'}{pet.pinCode ? ` (PIN ${pet.pinCode})` : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* Description Snippet */}
          {pet.description && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#D1D5DB', fontStyle: 'italic', lineHeight: 1.4 }}>
              "{pet.description.slice(0, 110)}{pet.description.length > 110 ? '...' : ''}"
            </p>
          )}

          {/* Caretaker Contact Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.85rem',
              background: 'rgba(236, 72, 153, 0.12)',
              borderRadius: '10px',
              border: '1px solid rgba(244, 114, 182, 0.25)',
            }}
          >
            <div>
              <small style={{ display: 'block', fontSize: '0.68rem', color: '#F472B6', fontWeight: 700 }}>
                CARETAKER CONTACT
              </small>
              <span style={{ fontSize: '0.84rem', color: '#FFFFFF', fontWeight: 600 }}>
                {pet.contactName || 'Pet Caretaker'}
              </span>
            </div>
            {pet.contactPhone && (
              <span style={{ fontSize: '0.86rem', color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} /> {getRevealedAdoptionPhone(pet) || pet.contactPhone}
              </span>
            )}
          </div>

          {/* App Access Call-To-Action (Enables public to reach app) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.85rem',
              background: 'rgba(56, 189, 248, 0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={15} style={{ color: '#38BDF8' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.78rem', color: '#38BDF8' }}>
                  Adopt or View Details on Our App
                </strong>
                <small style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>
                  No account needed for public viewers
                </small>
              </div>
            </div>
            <ExternalLink size={14} style={{ color: '#38BDF8' }} />
          </div>
        </div>
        )}

        {/* 🚀 ACTION BUTTONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* WhatsApp Direct Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1.25rem',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              border: 'none',
              borderRadius: '14px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(37, 211, 102, 0.35)',
              transition: 'transform 0.16s ease',
            }}
          >
            <Share2 size={18} />
            <span>Share to WhatsApp & Groups</span>
          </button>

          {/* Action Row: Download PNG & Copy Link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.75rem 0.9rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(244, 114, 182, 0.35)',
                borderRadius: '12px',
                color: '#FCE7F3',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={16} />
              <span>
                {isDownloading
                  ? 'Downloading...'
                  : activeTab === 'flyer' && pet.flyerPhoto
                  ? 'Download Original Flyer'
                  : 'Download Image Card'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.75rem 0.9rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              {isCopied ? <Check size={16} color="#34D399" /> : <Copy size={16} />}
              <span>{isCopied ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>
          </div>

          {/* Native Media Share */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isSharing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#9CA3AF',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <Share2 size={14} />
              <span>Share via Other Apps (Instagram, AirDrop, Messages)</span>
            </button>
          )}

          {/* Continue / Close Navigation */}
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              style={{
                marginTop: '0.25rem',
                padding: '0.75rem',
                background: 'transparent',
                border: 'none',
                color: '#F472B6',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              {continueLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
