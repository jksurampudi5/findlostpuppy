import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  FileText,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  Smartphone,
  Cpu,
  Zap,
  Search,
  X,
  Terminal,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { LoadingButton } from '../ui/LoadingButton';
import { TERMS_AND_CONDITIONS, DISCLAIMER, USER_GUIDELINES } from '../../data/legal/legalContent';

export interface AdminShortcutsProps {
  embedded?: boolean;
}

type TabType = 'flow' | 'documents' | 'skills' | 'security';

interface FlowStep {
  step: string;
  name: string;
  route: string;
  desc: string;
  screenshotSrc: string;
  badge: string;
  color: string;
}

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  desc: string;
  pdfUrl: string;
  mdFile: string;
  fileSize: string;
  date: string;
}

interface SkillItem {
  name: string;
  category: 'Animation & Physics' | 'Visual & UI Design' | 'Testing & A11y' | 'Cloud & Systems';
  desc: string;
  tags: string[];
  keyInvariants: string;
}

interface ExtensionItem {
  name: string;
  version: string;
  purpose: string;
  runtime: 'Browser' | 'Android Native' | 'Edge / Cloud' | 'Dev Tool';
  icon: string;
}

export const AdminShortcuts: React.FC<AdminShortcutsProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('flow');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewScreenshot, setPreviewScreenshot] = useState<{ name: string; src: string; step: string } | null>(null);
  const [activeModalDoc, setActiveModalDoc] = useState<{ title: string; content: string; type: 'legal' | 'markdown' } | null>(null);

  // 1. NAVIGATION FLOW STEPS
  const flowSteps: FlowStep[] = [
    {
      step: '01',
      name: 'User Consent & Legal Onboarding',
      route: '/consent',
      desc: 'Mandatory 4-form legal onboarding agreement with smooth auto-scroll to signature.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step1_consent.png',
      badge: 'Step 1',
      color: '#FF9800',
    },
    {
      step: '02',
      name: 'Owner Profile Setup',
      route: '/owner',
      desc: 'Pet parent name, verified Indian phone (+91), email, and optional avatar upload.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step2_owner.png',
      badge: 'Step 2',
      color: '#3B82F6',
    },
    {
      step: '03',
      name: 'Location Hierarchy Onboarding',
      route: '/location',
      desc: 'Reverse geocoding: State ➔ District ➔ Mandal ➔ Distinct Village/Locality.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step3_location.png',
      badge: 'Step 3',
      color: '#10B981',
    },
    {
      step: '04',
      name: 'Pet Choice Bifurcation',
      route: '/choice',
      desc: 'Bifurcation screen: "You already had a pet" vs single "Skip" to dashboard.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step4_pet_choice.png',
      badge: 'Step 4',
      color: '#EC4899',
    },
    {
      step: '05',
      name: 'Pet Registration & Details',
      route: '/pet',
      desc: 'Pet registration form: Name, breed, sex, color, microchip, with single "Remove Pet" control.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step5_pet_details.png',
      badge: 'Step 5',
      color: '#8B5CF6',
    },
    {
      step: '06',
      name: 'Main Pet Dashboard',
      route: '/dashboard',
      desc: '3 core category cards (Sighted Missing, At Home, Pets Missing), feedback trigger, safety toggle.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step6_dashboard.png',
      badge: 'Step 6',
      color: '#F59E0B',
    },
    {
      step: '07',
      name: 'In-App Rating Modal',
      route: '/dashboard?rate=open',
      desc: 'Dedicated 5-star rating dialog with Play Store redirect & review submission.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step7_rate_modal.png',
      badge: 'Step 7',
      color: '#EAB308',
    },
    {
      step: '08',
      name: 'Rider Fast Capture',
      route: '/capture',
      desc: 'Rapid 1-tap missing pet sighting reporter with GPS auto-detection & quick camera snap.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step8_capture_pet.png',
      badge: 'Step 8',
      color: '#06B6D4',
    },
    {
      step: '09',
      name: 'Privacy Policy In-App Reader',
      route: '/privacy',
      desc: 'Complete privacy policy document readable in-app and mirrored on GitHub Pages.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/nav_step9_privacy_policy.png',
      badge: 'Step 9',
      color: '#6366F1',
    },
    {
      step: '10',
      name: 'Admin Dashboard & Operations',
      route: '/admin',
      desc: 'Administrative records, Firebase sync counts, moderation queue, and user management.',
      screenshotSrc: '/brain/14a5c867-efb6-4e2c-b19b-304469980ec9/admin_master_shortcuts.png',
      badge: 'Admin',
      color: '#EF4444',
    },
  ];

  // 2. OFFICIAL SPECIFICATION DOCUMENTS (PDFs)
  const documents: DocumentItem[] = [
    {
      id: 'prd',
      title: 'Product Requirements Document (PRD)',
      category: 'Product Specification',
      desc: 'Full product vision, user journey specifications, safety requirements, and onboarding order.',
      pdfUrl: '/docs/PRD.pdf',
      mdFile: 'docs/PRD.md',
      fileSize: '11.2 KB (18 Pages)',
      date: '2026-09-30',
    },
    {
      id: 'trd',
      title: 'Technical Requirements Document (TRD)',
      category: 'Technical Architecture',
      desc: 'End-to-end technical stack, offline-first sync engine, Cloudinary image pipeline, and Firestore rules.',
      pdfUrl: '/docs/TRD.pdf',
      mdFile: 'docs/TRD.md',
      fileSize: '9.9 KB (16 Pages)',
      date: '2026-09-30',
    },
    {
      id: 'design-doc',
      title: 'Design System & UX Document',
      category: 'Design & Visual Systems',
      desc: 'Emil Kowalski physics, responsive breakpoints, color palette tokens, and canine walk cycles.',
      pdfUrl: '/docs/DESIGN_DOCUMENT.pdf',
      mdFile: 'docs/DESIGN_DOCUMENT.md',
      fileSize: '9.0 KB (14 Pages)',
      date: '2026-09-30',
    },
    {
      id: 'arch',
      title: 'System Architecture Blueprint',
      category: 'Engineering Blueprint',
      desc: 'Data flow between React SPA, Capacitor native bridge, Cloudflare Worker proxy, and Firebase.',
      pdfUrl: '/docs/architecture.pdf',
      mdFile: 'docs/architecture.md',
      fileSize: '1.7 KB (6 Pages)',
      date: '2026-09-29',
    },
    {
      id: 'security-audit',
      title: 'Security Audit & Invariants Report',
      category: 'Security & Privacy',
      desc: 'Zero-trust verification, Firestore deny-by-default rules, PII masking standards, and no GPS leakage.',
      pdfUrl: '/docs/security-audit-2026-09-29.pdf',
      mdFile: 'docs/security-audit-2026-09-29.md',
      fileSize: '12.2 KB (15 Pages)',
      date: '2026-09-29',
    },
    {
      id: 'app-context',
      title: 'FindLostPuppy App Context Dossier',
      category: 'System Dossier',
      desc: 'Comprehensive multi-page context dossier with complete technical workflows and launch criteria.',
      pdfUrl: '/docs/app-context.pdf',
      mdFile: 'docs/app-context.md',
      fileSize: '12.5 KB (22 Pages)',
      date: '2026-09-29',
    },
    {
      id: 'android-testing',
      title: 'Android Testing & Release Procedures',
      category: 'Quality Assurance',
      desc: 'Testing guidelines for package om.findlostpuppy.app, AAB bundle generation, and Play Store closed testing.',
      pdfUrl: '/docs/android-testing.pdf',
      mdFile: 'docs/android-testing.md',
      fileSize: '3.0 KB (8 Pages)',
      date: '2026-09-28',
    },
    {
      id: 'database',
      title: 'Firestore Collections & Schema',
      category: 'Data Architecture',
      desc: 'Detailed schema specification for profiles, pets, missing_reports, and sightings collections.',
      pdfUrl: '/docs/database.pdf',
      mdFile: 'docs/database.md',
      fileSize: '2.3 KB (7 Pages)',
      date: '2026-09-28',
    },
    {
      id: 'firebase-setup',
      title: 'Firebase & Cloud Storage Setup',
      category: 'Cloud Infrastructure',
      desc: 'Firebase project setup, authorized domains, Google Sign-In credentials, and Storage bucket rules.',
      pdfUrl: '/docs/firebase-setup.pdf',
      mdFile: 'docs/firebase-setup.md',
      fileSize: '2.0 KB (6 Pages)',
      date: '2026-09-28',
    },
    {
      id: 'legal-compliance',
      title: 'Legal & Play Store Compliance',
      category: 'Legal & Compliance',
      desc: 'Google Play Store user safety policies, child safety compliance, privacy policy accessibility.',
      pdfUrl: '/docs/legal-compliance-checklist.pdf',
      mdFile: 'docs/legal-compliance-checklist.md',
      fileSize: '3.0 KB (7 Pages)',
      date: '2026-09-28',
    },
  ];

  // 3. SKILLS USED
  const skillsList: SkillItem[] = [
    {
      name: 'character-animation',
      category: 'Animation & Physics',
      desc: 'Advanced SVG and CSS character animation principles for humans and quadrupeds (dogs). 4-beat canine walk cycles and inverse kinematics in SVG.',
      tags: ['Canine 4-Beat', 'SVG Rigging', 'Walk Cycles', 'Reunion Choreography'],
      keyInvariants: 'Smooth paws kinematics, readable motion timing, and accessible reduced-motion fallbacks.',
    },
    {
      name: 'emil-design-eng',
      category: 'Animation & Physics',
      desc: 'Emil Kowalski philosophy on UI polish, component design, animation decisions, and physics springs that make software feel tactile.',
      tags: ['Spring Physics', 'Micro-Interactions', 'Touch Feedback', 'Visual Polish'],
      keyInvariants: 'Fluid easing curves, subtle tactile resistance, zero jarring layout shifts.',
    },
    {
      name: 'frontend-design',
      category: 'Visual & UI Design',
      desc: 'Guidance for distinctive, intentional visual design. Curated palettes (Amber/Orange warmth on charcoal slate), Google Fonts typography (Outfit/Inter).',
      tags: ['Color Harmony', 'Typography', 'Visual Balance', 'Zero Generic'],
      keyInvariants: 'Never use plain default blues/reds; enforce high-contrast dark theme.',
    },
    {
      name: 'responsive-design',
      category: 'Visual & UI Design',
      desc: 'Modern responsive layouts using container queries, fluid typography, CSS Grid, mobile-first breakpoints, and Android cutout protection.',
      tags: ['Container Queries', 'Cutout Safe', 'Fluid Breakpoints', 'Zero Overflow'],
      keyInvariants: 'Support 320px to 1440px+ without any horizontal scrolling or clipping.',
    },
    {
      name: 'gsap-cinematic-animation',
      category: 'Animation & Physics',
      desc: 'Advanced GSAP timeline choreography, multi-actor SVG rigging, soundwave ripples, and interactive animation playback controls.',
      tags: ['GSAP Timelines', 'SVG Morphing', 'Audio Ripples', 'Frame Sync'],
      keyInvariants: 'Performant hardware-accelerated transforms without CPU throttling.',
    },
    {
      name: 'remotion-video-synthesis',
      category: 'Animation & Physics',
      desc: 'Programmatic video creation in React. Frame-accurate SVG animation rendering, dynamic subtitle text overlays, and video clip exports.',
      tags: ['Remotion', 'Frame Accurate', 'Video Synthesis', 'Subtitles'],
      keyInvariants: 'Render frame-by-frame missing puppy alerts for social media broadcast.',
    },
    {
      name: 'chrome-devtools & a11y-debugging',
      category: 'Testing & A11y',
      desc: 'Chrome DevTools MCP inspection for Core Web Vitals (CWV), Largest Contentful Paint (LCP), tap target sizing, and WCAG accessibility.',
      tags: ['WCAG 2.1 AA', 'CWV Profiling', 'Screen Readers', 'Tap Targets'],
      keyInvariants: 'All interactive controls must satisfy minimum 44x44px touch targets.',
    },
    {
      name: 'firebase & security-rules-auditor',
      category: 'Cloud & Systems',
      desc: 'Cloud Firestore database querying, security rules evaluation, and Firebase Authentication session management.',
      tags: ['Firestore', 'Security Rules', 'Session Auth', 'Bucket Security'],
      keyInvariants: 'Deny-by-default on all Firestore collections; private reads owner-only.',
    },
    {
      name: 'google-maps-platform',
      category: 'Cloud & Systems',
      desc: 'Production-ready code using Google Maps Platform APIs for geocoding, reverse geocoding, boundary polygons, and location hierarchy.',
      tags: ['Geocoding', 'Polygons', 'Location Hierarchy', 'Privacy Bounds'],
      keyInvariants: 'Never expose raw GPS coordinates in public missing pet listings.',
    },
    {
      name: 'graphify',
      category: 'Cloud & Systems',
      desc: 'Persistent knowledge graph generator for codebase architecture, god node detection, and component dependency pathways.',
      tags: ['AST Graph', 'God Nodes', 'Dependency Trace', 'Architecture'],
      keyInvariants: 'Keep graph.json synchronized after modifying structural components.',
    },
  ];

  // 4. EXTENSIONS & LIBRARIES USED
  const extensionsList: ExtensionItem[] = [
    {
      name: '@capacitor-firebase/authentication',
      version: 'v8.5.2',
      purpose: 'Native Google Sign-In integration for Android devices without redirect URL errors.',
      runtime: 'Android Native',
      icon: '🔐',
    },
    {
      name: '@capacitor/geolocation & nativegeocoder',
      version: 'v8.2.2',
      purpose: 'Fast GPS coordinate acquisition and reverse geocoding for Indian states and mandals.',
      runtime: 'Android Native',
      icon: '📍',
    },
    {
      name: '@turf/boolean-point-in-polygon',
      version: 'v7.4.0',
      purpose: 'High-speed geo-spatial polygon calculations for community alert radii.',
      runtime: 'Browser',
      icon: '📐',
    },
    {
      name: 'Cloudflare Wrangler & Workers',
      version: 'v4.143',
      purpose: 'Edge compute gateway for image moderation and secure SOS WhatsApp notifications.',
      runtime: 'Edge / Cloud',
      icon: '☁️',
    },
    {
      name: 'Puppeteer-Core',
      version: 'v25.11',
      purpose: 'Headless Chrome document synthesis to generate official A4 specification PDFs.',
      runtime: 'Dev Tool',
      icon: '🖨️',
    },
    {
      name: 'Lucide React Icons',
      version: 'v1.42',
      purpose: 'Optimized SVG iconography with consistent visual language across all viewports.',
      runtime: 'Browser',
      icon: '✨',
    },
    {
      name: 'Canvas Confetti',
      version: 'v1.9.4',
      purpose: 'Physics-based celebration particle bursts on pet safe and rating submissions.',
      runtime: 'Browser',
      icon: '🎉',
    },
    {
      name: 'Oxlint',
      version: 'v1.79',
      purpose: 'Rust-powered ultra-fast static analysis ensuring 0 code defects before Android release.',
      runtime: 'Dev Tool',
      icon: '⚡',
    },
  ];

  // Filtering
  const filteredFlows = flowSteps.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSkills = skillsList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenLegalModal = (title: string, content: any) => {
    setActiveModalDoc({
      title,
      content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      type: 'legal',
    });
  };

  const { user, isAdmin } = useAuth();
  const isUserAdmin = Boolean(
    isAdmin ||
    user?.isAdmin ||
    (user?.email && (
      user.email.toLowerCase().trim() === 'jksurampudi5@gmail.com' ||
      user.email.toLowerCase().trim() === 'jayakrishna.jk14@gmail.com'
    ))
  );

  if (!isUserAdmin) {
    return (
      <div
        className="admin-portal-page"
        style={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '540px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '40px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            <Lock size={32} color="#EF4444" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px 0' }}>
            Administrator Access Required
          </h2>

          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            {user
              ? `The signed-in account (${user.email}) does not have administrative privileges. These internal blueprints, workflows, specifications, and security policies are restricted exclusively to authorized administrators.`
              : 'These internal workflows, specification PDFs, and security matrices are restricted exclusively to authorized administrators. Please sign in with an authorized admin account.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/owner')}
              style={{
                background: 'linear-gradient(135deg, #FF7900, #E65100)',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(255, 121, 0, 0.3)',
              }}
            >
              <span>🐾 {user ? 'Switch Account' : 'Sign In as Admin'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/homepage')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>← Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="admin-shortcuts-container"
      style={{
        maxWidth: embedded ? '100%' : '1200px',
        margin: '0 auto',
        padding: embedded ? '12px 0' : '24px 20px',
        color: '#F8FAFC',
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(255, 121, 0, 0.3)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 121, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(255, 121, 0, 0.15)', borderRadius: '9999px', border: '1px solid rgba(255, 121, 0, 0.4)', marginBottom: '10px' }}>
              <Zap size={14} color="#FF7900" />
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FF9800' }}>
                Admin Shortcuts & Mission Control
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              FindLostPuppy Admin Shortcuts
            </h1>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px', lineHeight: '1.5' }}>
              Instant navigation flow, official specification PDFs, agent skills & extensions, and security audit matrix.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/demo')}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 121, 0, 0.2), rgba(230, 81, 0, 0.35))',
                border: '1px solid #FF7900',
                color: '#FF9800',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 12px rgba(255, 121, 0, 0.25)',
              }}
            >
              <Sparkles size={14} color="#FF7900" />
              <span>🎬 Animation & Button Showcase</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#E2E8F0',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
              <span>Admin Dashboard</span>
            </button>
            <a
              href="https://play.google.com/apps/testing/om.findlostpuppy.app"
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'linear-gradient(135deg, #FF7900, #E65100)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(255, 121, 0, 0.3)',
              }}
            >
              <Smartphone size={14} />
              <span>Play Store Closed Testing</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* SEARCH FILTER */}
        <div style={{ marginTop: '20px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748B' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flow steps, PDF documents, skills, extensions, or security rules..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '10px 14px 10px 40px',
              color: '#F8FAFC',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '10px',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('flow')}
          style={{
            background: activeTab === 'flow' ? 'linear-gradient(135deg, #FF7900, #E65100)' : 'rgba(30, 41, 59, 0.8)',
            color: '#FFFFFF',
            border: activeTab === 'flow' ? '1px solid #FF9800' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'flow' ? '0 4px 12px rgba(255, 121, 0, 0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Compass size={16} />
          <span>🗺️ Navigation Flow ({filteredFlows.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          style={{
            background: activeTab === 'documents' ? 'linear-gradient(135deg, #FF7900, #E65100)' : 'rgba(30, 41, 59, 0.8)',
            color: '#FFFFFF',
            border: activeTab === 'documents' ? '1px solid #FF9800' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'documents' ? '0 4px 12px rgba(255, 121, 0, 0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <FileText size={16} />
          <span>📄 Official Documents & PDFs ({filteredDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          style={{
            background: activeTab === 'skills' ? 'linear-gradient(135deg, #FF7900, #E65100)' : 'rgba(30, 41, 59, 0.8)',
            color: '#FFFFFF',
            border: activeTab === 'skills' ? '1px solid #FF9800' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'skills' ? '0 4px 12px rgba(255, 121, 0, 0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Cpu size={16} />
          <span>🧩 Skills & Extensions Used ({skillsList.length + extensionsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{
            background: activeTab === 'security' ? 'linear-gradient(135deg, #FF7900, #E65100)' : 'rgba(30, 41, 59, 0.8)',
            color: '#FFFFFF',
            border: activeTab === 'security' ? '1px solid #FF9800' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'security' ? '0 4px 12px rgba(255, 121, 0, 0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Shield size={16} />
          <span>🛡️ Security & Privacy Matrix</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: NAVIGATION FLOW TABLE */}
      {/* ========================================================= */}
      {activeTab === 'flow' && (
        <div style={{ animation: 'emilPageEnterVertical 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          {/* 21st.dev Component Transition Showcase Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 121, 0, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 121, 0, 0.25)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={16} color="#FF9800" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                  21st.dev Component Transition Engine (10 Core Flow Steps)
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: 1.4 }}>
                Switch between components below to experience Emil Kowalski fluid spring transitions, glowing top progress bar, and state-morphing animations.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {flowSteps.map((step) => (
                <LoadingButton
                  key={step.step}
                  variant="secondary"
                  size="sm"
                  gapDurationMs={350}
                  loadingText="Switching…"
                  onClick={() => navigate(step.route)}
                  title={`${step.step} - ${step.name}`}
                  style={{
                    fontSize: '11px',
                    padding: '5px 10px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <span style={{ color: step.color, fontWeight: 800 }}>{step.step}</span>
                  <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.name.split(' ')[0]}
                  </span>
                </LoadingButton>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '2px solid rgba(255, 121, 0, 0.3)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 800, color: '#FF9800', width: '70px' }}>STEP</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#E2E8F0' }}>SCREEN NAME</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#E2E8F0' }}>ROUTE / TRIGGER</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#E2E8F0' }}>DESCRIPTION</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#E2E8F0', width: '130px' }}>SCREENSHOT</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#E2E8F0', width: '160px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlows.map((flow, idx) => (
                    <tr
                      key={flow.step}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        background: idx % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'rgba(15, 23, 42, 0.3)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: flow.color,
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}
                        >
                          {flow.step}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{flow.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <code
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            color: '#38BDF8',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                          }}
                        >
                          {flow.route}
                        </code>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94A3B8', lineHeight: '1.4' }}>
                        {flow.desc}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewScreenshot({ name: flow.name, src: flow.screenshotSrc, step: flow.step })}
                          style={{
                            background: 'rgba(255, 121, 0, 0.12)',
                            color: '#FF9800',
                            border: '1px solid rgba(255, 121, 0, 0.3)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <LoadingButton
                            variant="primary"
                            size="sm"
                            gapDurationMs={350}
                            loadingText="Launching…"
                            onClick={() => navigate(flow.route)}
                          >
                            <span>Launch</span>
                            <ArrowRight size={12} />
                          </LoadingButton>
                          <a
                            href={flow.route}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#CBD5E1',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Open in new tab"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OFFICIAL DOCUMENTS & PDFS */}
      {/* ========================================================= */}
      {activeTab === 'documents' && (
        <div style={{ animation: 'emilPageEnterVertical 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>
              All 10 project specifications and blueprints are pre-rendered into print-ready A4 PDF format with custom typographic styling.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={14} color="#10B981" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34D399' }}>10/10 PDFs Pre-Generated in public/docs/</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span
                      style={{
                        background: 'rgba(255, 121, 0, 0.15)',
                        color: '#FF9800',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 121, 0, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {doc.category}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                      {doc.fileSize}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                    {doc.title}
                  </h3>

                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    {doc.desc}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '14px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <a
                    href={doc.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #FF7900, #E65100)',
                      color: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      textAlign: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(255, 121, 0, 0.3)',
                    }}
                  >
                    <FileText size={14} />
                    <span>View PDF</span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href={doc.pdfUrl}
                    download
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#CBD5E1',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    title="Download PDF directly"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SKILLS & EXTENSIONS USED */}
      {/* ========================================================= */}
      {activeTab === 'skills' && (
        <div style={{ animation: 'emilPageEnterVertical 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          {/* SKILLS SECTION */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Cpu size={18} color="#FF7900" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Active Agent Skills ({filteredSkills.length})
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredSkills.map((skill) => (
                <div
                  key={skill.name}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <code
                      style={{
                        background: 'rgba(255, 121, 0, 0.15)',
                        color: '#FF9800',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        border: '1px solid rgba(255, 121, 0, 0.3)',
                      }}
                    >
                      {skill.name}
                    </code>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{skill.category}</span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 12px 0', lineHeight: '1.45' }}>
                    {skill.desc}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#94A3B8',
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderLeft: '3px solid #FF7900',
                      padding: '8px 10px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '11px',
                      color: '#FDBA74',
                    }}
                  >
                    <strong>Invariant:</strong> {skill.keyInvariants}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EXTENSIONS & PACKAGES SECTION */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers size={18} color="#3B82F6" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Installed Extensions & Core Dependencies ({extensionsList.length})
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {extensionsList.map((ext) => (
                <div
                  key={ext.name}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>{ext.icon}</span>
                      <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>{ext.name}</strong>
                    </div>
                    <span
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60A5FA',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {ext.version}
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                    {ext.purpose}
                  </p>

                  <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Runtime: <strong style={{ color: '#E2E8F0' }}>{ext.runtime}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SECURITY MATRIX & INVARIANTS */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div style={{ animation: 'emilPageEnterVertical 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          {/* TOP INVARIANTS CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Lock size={16} color="#EF4444" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Deny-by-Default Firestore
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.45' }}>
                All reads & writes are denied by default. Pet documents and SAFE reports are readable only by their verified owner or admin.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Eye size={16} color="#F59E0B" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Automatic PII Masking
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.45' }}>
                Public owner contacts are masked (e.g. <code>+91 86••••••48</code>, <code>j•••5@gmail.com</code>). Exact GPS coordinates are never leaked.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} color="#10B981" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Cloudinary Folder Sandbox
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.45' }}>
                Unsigned client uploads are sandboxed strictly under <code>findlostpuppy/public-alerts/</code>. All API secrets reside on backend.
              </p>
            </div>
          </div>

          {/* LEGAL & CONSENT FORMS */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
                  User Consent Agreements & Legal Contracts
                </h3>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  Mandatory affirmative agreements required by all pet parents before accessing location & pet services.
                </p>
              </div>

              <a
                href="https://jksurampudi5.github.io/findlostpuppy/privacy-policy.html"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Live Web Privacy Policy</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleOpenLegalModal('Terms & Conditions (v1.0)', TERMS_AND_CONDITIONS)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Terms & Conditions</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Platform usage terms, community conduct</div>
                </div>
                <Eye size={15} color="#FF9800" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/privacy')}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Privacy Policy (In-App)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>DPDP Act & GDPR compliant privacy disclosure</div>
                </div>
                <ArrowRight size={15} color="#3B82F6" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenLegalModal('Platform Safety Disclaimer', DISCLAIMER)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Safety Disclaimer</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Pet recovery safety, bystander guidelines</div>
                </div>
                <Eye size={15} color="#10B981" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenLegalModal('Community Guidelines', USER_GUIDELINES)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Community Guidelines</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Zero spam, respectful search party rules</div>
                </div>
                <Eye size={15} color="#EC4899" />
              </button>
            </div>
          </div>

          {/* FIRESTORE RULES INSPECTOR */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 121, 0, 0.3)',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="#FF7900" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Firestore Security Rules (firebase.firestore.rules)
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Active Invariants
              </span>
            </div>

            <pre
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#E2E8F0',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                lineHeight: '1.5',
                maxHeight: '260px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DENY BY DEFAULT
    match /{document=**} {
      allow read, write: if false;
    }

    // Profiles: Owner or Admin read/write only
    match /profiles/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.email == 'jksurampudi5@gmail.com');
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Pets: Owner or Admin read/write only
    match /pets/{petId} {
      allow read: if request.auth != null && (resource.data.ownerId == request.auth.uid || request.auth.token.email == 'jksurampudi5@gmail.com');
      allow write: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
    }

    // Missing Reports: Signed-in community can read LOST; SAFE reports owner-only
    match /missing_reports/{reportId} {
      allow read: if request.auth != null && (resource.data.status == 'LOST' || resource.data.ownerId == request.auth.uid || request.auth.token.email == 'jksurampudi5@gmail.com');
      allow write: if request.auth != null;
    }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREENSHOT PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewScreenshot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewScreenshot(null)}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 121, 0, 0.4)',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#FF7900',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Step {previewScreenshot.step}
                </span>
                <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>{previewScreenshot.name}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={previewScreenshot.src}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#E2E8F0',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Maximize2 size={13} />
                  <span>Full Res</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewScreenshot(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0B0F19',
              }}
            >
              <img
                src={previewScreenshot.src}
                alt={previewScreenshot.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* IN-APP DOCUMENT READER MODAL */}
      {/* ========================================================= */}
      {activeModalDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveModalDoc(null)}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 121, 0, 0.4)',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {activeModalDoc.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                color: '#CBD5E1',
                fontSize: '13px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {activeModalDoc.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShortcuts;
