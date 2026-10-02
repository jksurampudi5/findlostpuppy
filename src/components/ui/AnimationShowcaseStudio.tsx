import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  CheckCircle2,
  Shield,
  User,
  MapPin,
  Heart,
  Dog,
  Compass,
  Sliders,
} from 'lucide-react';
import { LoadingButton } from './LoadingButton';
import { LogoLeashRunFlowTransition } from './LogoLeashRunFlowTransition';
import './animation-showcase.css';

type AnimationOptionKey = 'option1' | 'option2' | 'option3' | 'option4';

interface AnimationOptionDef {
  key: AnimationOptionKey;
  number: string;
  source: string;
  title: string;
  subtitle: string;
  desc: string;
  physics: string;
  bestFor: string;
  tag: string;
}

const ANIMATION_OPTIONS: AnimationOptionDef[] = [
  {
    key: 'option1',
    number: 'Option 1',
    source: '21st.dev + Emil Kowalski',
    title: 'Directional Spring Panel',
    subtitle: 'Smooth slide-fade with scale & physics easing',
    desc: 'Elements translate along the X-axis (40px) with custom cubic-bezier(0.16, 1, 0.3, 1) spring physics and scale 0.97 → 1.0. Knows whether you moved forward or backward.',
    physics: 'cubic-bezier(0.16, 1, 0.3, 1) • 380ms',
    bestFor: 'Native iOS & Android feel, natural card-deck navigation',
    tag: 'Recommended for Mobile',
  },
  {
    key: 'option2',
    number: 'Option 2',
    source: 'Magic UI / 21st.dev',
    title: 'Shimmer Border Beam & Morph',
    subtitle: 'Conic rotating laser perimeter with blur morph',
    desc: 'Cards enter with an initial 8px Gaussian blur defocus and scale 0.94 → 1.0, accompanied by a continuous conic-gradient laser beam traveling around the perimeter.',
    physics: 'cubic-bezier(0.23, 1, 0.32, 1) • 420ms + Conic Beam',
    bestFor: 'High-tech, futuristic web presentation & spotlight screens',
    tag: 'Most Eye-Catching',
  },
  {
    key: 'option3',
    number: 'Option 3',
    source: 'Aceternity UI',
    title: 'Staggered Bento Cascade',
    subtitle: 'Sequential 50ms element-by-element waterfall',
    desc: 'The container loads first, then header, body fields, badges, and action buttons cascade in consecutively with a 50ms stagger delay. Gives a sense of deep structural precision.',
    physics: 'Waterfall stagger (0ms, 50ms, 100ms, 150ms)',
    bestFor: 'Complex forms, location hierarchies, and admin dashboards',
    tag: 'Best for Information Density',
  },
  {
    key: 'option4',
    number: 'Option 4',
    source: '21st.dev Warped Circle',
    title: 'Radial Iris Aperture Wipe',
    subtitle: 'Camera lens circular clip-path expansion',
    desc: 'The incoming component expands outward from a center point using CSS clip-path: circle(0% → 120%), creating a camera-aperture transition reminiscent of cinematic film wipes.',
    physics: 'cubic-bezier(0.22, 1, 0.36, 1) • 440ms clip-path',
    bestFor: 'Pet photo capture reveals, celebration milestones, and media',
    tag: 'Cinematic Flare',
  },
];

const FLOW_STEPS = [
  { id: 'consent', label: '01 Consent', icon: Shield, title: 'Legal Onboarding & Terms' },
  { id: 'owner', label: '02 Owner', icon: User, title: 'Pet Parent Identity & Phone' },
  { id: 'location', label: '03 Location', icon: MapPin, title: 'State, Mandal & Village' },
  { id: 'choice', label: '04 Choice', icon: Compass, title: 'Lost Pet vs Sighted Puppy' },
  { id: 'pet', label: '05 Pet Details', icon: Dog, title: 'Breed, Color & Missing Date' },
  { id: 'dashboard', label: '06 Dashboard', icon: Heart, title: 'Community Alert Matrix' },
];

export const AnimationShowcaseStudio: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<AnimationOptionKey>('option1');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [replayKey, setReplayKey] = useState<number>(0);
  const [buttonLoadingGap, setButtonLoadingGap] = useState<number>(600);

  // Button lab state
  const [btnATesting, setBtnATesting] = useState(false);
  const [btnBTesting, setBtnBTesting] = useState(false);
  const [btnCTesting, setBtnCTesting] = useState(false);
  const [showLiveLogoTransition, setShowLiveLogoTransition] = useState<'forward' | 'backward' | null>(null);

  const currentStep = FLOW_STEPS[activeStepIndex];

  const handleStepChange = (newIndex: number) => {
    if (newIndex === activeStepIndex) {
      setReplayKey((k) => k + 1);
      return;
    }
    setDirection(newIndex > activeStepIndex ? 'forward' : 'backward');
    setActiveStepIndex(newIndex);
    setReplayKey((k) => k + 1);
  };

  const handleNext = () => {
    if (activeStepIndex < FLOW_STEPS.length - 1) {
      handleStepChange(activeStepIndex + 1);
    } else {
      handleStepChange(0);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      handleStepChange(activeStepIndex - 1);
    } else {
      handleStepChange(FLOW_STEPS.length - 1);
    }
  };

  const currentDuration = `${(0.38 / speedMultiplier).toFixed(2)}s`;

  return (
    <div className="showcase-studio" style={{ '--anim-duration': currentDuration } as React.CSSProperties}>
      {/* HEADER */}
      <div className="showcase-header">
        <div className="showcase-badge">
          <Sparkles size={14} />
          <span>Interactive Animation Showcase & Review</span>
        </div>
        <h1 className="showcase-title">Component Transitions & Loading Button Studio</h1>
        <p className="showcase-subtitle">
          Explore all 4 proposed component transitions (sourced from <strong>21st.dev</strong>, <strong>Aceternity UI</strong>, and <strong>Magic UI</strong>) along with 3 interactive loading button styles. Test live before applying across the app.
        </p>
      </div>

      {/* FEATURED: OFFICIAL LOGO LEASH-RELEASE & RETURN HOME FLOW TRANSITION */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255, 121, 0, 0.16), rgba(230, 81, 0, 0.28))',
          border: '1.5px solid #FF7900',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 0 24px rgba(255, 121, 0, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255, 121, 0, 0.2)', borderRadius: '9999px', border: '1px solid rgba(255, 121, 0, 0.4)', marginBottom: '8px' }}>
            <Sparkles size={13} color="#FF7900" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FF9800', textTransform: 'uppercase' }}>
              Official App Logo Motion
            </span>
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Dog Releases Leash & Runs Happily On Road (Bidirectional)
          </h2>
          <p style={{ fontSize: '13px', color: '#CBD5E1', margin: '4px 0 0 0', maxWidth: '620px', lineHeight: 1.5 }}>
            Hands open, puppy drops its leash, runs happily across the road leaving paw prints, and returns home into the sanctuary when navigating backward.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowLiveLogoTransition('forward')}
            style={{
              background: 'linear-gradient(135deg, #FF7900, #E65100)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(255, 121, 0, 0.35)',
            }}
          >
            <span>▶ Play Forward (Unleash & Run)</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={() => setShowLiveLogoTransition('backward')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#E2E8F0',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} />
            <span>◀ Play Backward (Return Home)</span>
          </button>
        </div>
      </div>

      {/* TOP CONTROLLER TOOLBAR */}
      <div className="showcase-toolbar">
        <div className="toolbar-row">
          <span className="toolbar-label">1. Choose Animation Option to Test:</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Speed:</span>
            {[0.5, 1, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeedMultiplier(spd)}
                style={{
                  background: speedMultiplier === spd ? '#FF7900' : 'rgba(255, 255, 255, 0.08)',
                  color: speedMultiplier === spd ? '#FFFFFF' : '#94A3B8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {spd === 0.5 ? '0.5x (Slow)' : spd === 1 ? '1x (Normal)' : '1.5x (Fast)'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              style={{
                background: 'rgba(255, 121, 0, 0.15)',
                color: '#FF9800',
                border: '1px solid rgba(255, 121, 0, 0.3)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={12} />
              <span>Replay</span>
            </button>
          </div>
        </div>

        {/* 4 OPTION CARDS */}
        <div className="options-pill-grid">
          {ANIMATION_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`option-card-btn ${selectedOption === opt.key ? 'active' : ''}`}
              onClick={() => {
                setSelectedOption(opt.key);
                setReplayKey((k) => k + 1);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="option-title">
                  {selectedOption === opt.key && <CheckCircle2 size={13} color="#FF7900" />}
                  {opt.title}
                </span>
                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                  {opt.source}
                </span>
              </div>
              <span className="option-desc">{opt.subtitle}</span>
              <span style={{ fontSize: '10px', color: '#FF9800', fontWeight: 600, marginTop: '2px' }}>
                {opt.tag}
              </span>
            </button>
          ))}
        </div>

        {/* FLOW STEP SWITCHER */}
        <div>
          <span className="toolbar-label" style={{ display: 'block', marginBottom: '8px' }}>
            2. Simulate Switching Between App Components:
          </span>
          <div className="steps-switcher-strip">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`step-pill ${activeStepIndex === idx ? 'active' : ''}`}
                  onClick={() => handleStepChange(idx)}
                >
                  <Icon size={12} />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LIVE ANIMATION PREVIEW STAGE */}
      <div className="showcase-stage">
        <div
          key={`${selectedOption}-${activeStepIndex}-${replayKey}`}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          {/* OPTION 1: 21st.dev Spring Panel */}
          {selectedOption === 'option1' && (
            <div
              className={`mock-component-card ${
                direction === 'forward' ? 'anim-opt-1-forward' : 'anim-opt-1-backward'
              }`}
            >
              <MockCardContent
                step={currentStep}
                stepNum={activeStepIndex + 1}
                onPrev={handlePrev}
                onNext={handleNext}
                optionBadge="Option 1: 21st.dev Directional Spring Panel"
              />
            </div>
          )}

          {/* OPTION 2: Magic UI Border Beam & Morphing Card */}
          {selectedOption === 'option2' && (
            <div className="mock-component-card anim-opt-2-card">
              <MockCardContent
                step={currentStep}
                stepNum={activeStepIndex + 1}
                onPrev={handlePrev}
                onNext={handleNext}
                optionBadge="Option 2: Magic UI Shimmer Border Beam"
              />
            </div>
          )}

          {/* OPTION 3: Aceternity Staggered Bento Cascade */}
          {selectedOption === 'option3' && (
            <div className="anim-opt-3-parent">
              <div className="mock-component-card">
                <div className="anim-opt-3-item">
                  <div className="mock-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', background: 'rgba(255, 121, 0, 0.2)', color: '#FF7900', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                        Option 3: Aceternity Bento
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>Item 1 / Stagger 0ms</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Step {activeStepIndex + 1} of 6</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
                    {currentStep.title}
                  </h3>
                </div>

                <div className="anim-opt-3-item" style={{ marginTop: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '10px', color: '#FF9800', fontWeight: 700, textTransform: 'uppercase' }}>
                    Item 2 / Stagger 50ms (Form Body)
                  </span>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                    Simulating component payload for <strong>{currentStep.label}</strong>. Notice how this block flows in right after the title with a deliberate 50ms cascade.
                  </p>
                </div>

                <div className="anim-opt-3-item" style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, padding: '10px', background: 'rgba(30,41,59,0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Item 3 / Stagger 100ms</span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>Verified Local State</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: 'rgba(30,41,59,0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Zero Latency Cache</span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ADE80', marginTop: '2px' }}>Active Session</div>
                  </div>
                </div>

                <div className="anim-opt-3-item" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handlePrev}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#E2E8F0',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      background: 'linear-gradient(135deg, #FF7900, #E65100)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(255,121,0,0.3)',
                    }}
                  >
                    <span>Next Component</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 4: 21st.dev Radial Iris Wipe */}
          {selectedOption === 'option4' && (
            <div className="mock-component-card anim-opt-4-radial">
              <MockCardContent
                step={currentStep}
                stepNum={activeStepIndex + 1}
                onPrev={handlePrev}
                onNext={handleNext}
                optionBadge="Option 4: 21st.dev Radial Iris Aperture Wipe"
              />
            </div>
          )}
        </div>
      </div>

      {/* TECHNICAL COMPARISON MATRIX */}
      <div style={{ marginTop: '28px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#FF7900" />
          <span>Technical Comparison Matrix for Production Application</span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', color: '#94A3B8' }}>
                <th style={{ padding: '8px 12px' }}>Option</th>
                <th style={{ padding: '8px 12px' }}>Source Pattern</th>
                <th style={{ padding: '8px 12px' }}>Performance & GPU</th>
                <th style={{ padding: '8px 12px' }}>Perceived Polish</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {ANIMATION_OPTIONS.map((opt) => (
                <tr
                  key={opt.key}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: selectedOption === opt.key ? 'rgba(255, 121, 0, 0.08)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#FFFFFF' }}>
                    {opt.number}: {opt.title}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>{opt.source}</td>
                  <td style={{ padding: '10px 12px', color: '#4ADE80' }}>
                    {opt.key === 'option1'
                      ? '60-120 FPS (Pure transform & opacity)'
                      : opt.key === 'option2'
                      ? '60 FPS (Hardware conic gradient)'
                      : opt.key === 'option3'
                      ? '60 FPS (Keyframe cascade)'
                      : '60 FPS (GPU clip-path)'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#F1F5F9' }}>{opt.bestFor}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOption(opt.key);
                        setReplayKey((k) => k + 1);
                      }}
                      style={{
                        background: selectedOption === opt.key ? '#FF7900' : 'rgba(255, 255, 255, 0.08)',
                        color: selectedOption === opt.key ? '#FFFFFF' : '#CBD5E1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {selectedOption === opt.key ? 'Currently Testing' : 'Test This'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOADING BUTTON LABORATORY (21st.dev) */}
      <div style={{ marginTop: '28px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: 'rgba(255, 121, 0, 0.15)', borderRadius: '9999px', border: '1px solid rgba(255, 121, 0, 0.3)', marginBottom: '6px' }}>
              <Zap size={12} color="#FF7900" />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF9800', textTransform: 'uppercase' }}>
                21st.dev Interactive Component
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Loading Button Laboratory (Click-to-Load Gap)
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Test the loading animation triggered on buttons (e.g. Refresh or Next) for the duration of the loading gap before the next page appears.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Simulated Load Gap:</span>
            {[300, 600, 1200].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setButtonLoadingGap(ms)}
                style={{
                  background: buttonLoadingGap === ms ? '#FF7900' : 'rgba(255, 255, 255, 0.08)',
                  color: buttonLoadingGap === ms ? '#FFFFFF' : '#94A3B8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {ms}ms
              </button>
            ))}
          </div>
        </div>

        {/* 3 BUTTON STYLES GRID */}
        <div className="button-lab-grid">
          {/* Style A: Shimmer Beam Laser Perimeter */}
          <div className="button-lab-card">
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#FF9800' }}>
              Style A: Perimeter Laser Beam
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              21st.dev Shimmer beam traveling diagonally across border on active click
            </span>
            <div style={{ margin: '12px 0' }}>
              <LoadingButton
                variant="primary"
                size="md"
                gapDurationMs={buttonLoadingGap}
                isLoading={btnATesting}
                loadingText="Refreshing State…"
                onClick={() => {
                  setBtnATesting(true);
                  setTimeout(() => setBtnATesting(false), buttonLoadingGap);
                }}
              >
                <span>Click to Test ({buttonLoadingGap}ms Gap)</span>
              </LoadingButton>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B' }}>
              Status: {btnATesting ? '⏳ Simulating network roundtrip' : 'Idle (Tap to test)'}
            </span>
          </div>

          {/* Style B: Harmonic Triple-Dot Bounce */}
          <div className="button-lab-card">
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8' }}>
              Style B: Harmonic 3-Dot Pulse
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Emil Kowalski spring-staggered bouncing dots that expand inside button
            </span>
            <div style={{ margin: '12px 0' }}>
              <LoadingButton
                variant="secondary"
                size="md"
                loadingIconType="dots"
                gapDurationMs={buttonLoadingGap}
                isLoading={btnBTesting}
                loadingText="Saving Details…"
                onClick={() => {
                  setBtnBTesting(true);
                  setTimeout(() => setBtnBTesting(false), buttonLoadingGap);
                }}
              >
                <span>Click to Test ({buttonLoadingGap}ms Gap)</span>
              </LoadingButton>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B' }}>
              Status: {btnBTesting ? '⏳ Simulating disk write' : 'Idle (Tap to test)'}
            </span>
          </div>

          {/* Style C: Refresh Button Rotating Spinner */}
          <div className="button-lab-card">
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#4ADE80' }}>
              Style C: Circular Refresh Spinner
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Clean rotational spinner ideal for header refresh & data reload actions
            </span>
            <div style={{ margin: '12px 0' }}>
              <LoadingButton
                variant="refresh"
                size="md"
                gapDurationMs={buttonLoadingGap}
                isLoading={btnCTesting}
                loadingText="Reloading…"
                onClick={() => {
                  setBtnCTesting(true);
                  setTimeout(() => setBtnCTesting(false), buttonLoadingGap);
                }}
              >
                <span>Click to Refresh ({buttonLoadingGap}ms Gap)</span>
              </LoadingButton>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B' }}>
              Status: {btnCTesting ? '⏳ Reloading Firebase cache' : 'Idle (Tap to test)'}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER NAVIGATION */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/shortcuts')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#CBD5E1',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Admin Shortcuts</span>
        </button>

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
            boxShadow: '0 4px 14px rgba(255, 121, 0, 0.35)',
          }}
        >
          <span>Go to Live App Flow</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* FULLSCREEN LOGO FLOW TRANSITION DEMO OVERLAY */}
      {showLiveLogoTransition && (
        <LogoLeashRunFlowTransition
          fromStep={showLiveLogoTransition === 'forward' ? 'owner' : 'location'}
          toStep={showLiveLogoTransition === 'forward' ? 'location' : 'owner'}
          direction={showLiveLogoTransition}
          durationMs={1850}
          onComplete={() => setShowLiveLogoTransition(null)}
        />
      )}
    </div>
  );
};

interface MockCardContentProps {
  step: (typeof FLOW_STEPS)[0];
  stepNum: number;
  onPrev: () => void;
  onNext: () => void;
  optionBadge: string;
}

const MockCardContent: React.FC<MockCardContentProps> = ({
  step,
  stepNum,
  onPrev,
  onNext,
  optionBadge,
}) => {
  const Icon = step.icon;
  return (
    <>
      <div className="mock-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(255, 121, 0, 0.2)', color: '#FF7900', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
            {optionBadge}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748B' }}>
          Step {stepNum} of 6
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 121, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 121, 0, 0.3)' }}>
          <Icon size={22} color="#FF7900" />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            {step.title}
          </h3>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>{step.label}</span>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
          Simulated Interactive Form
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            readOnly
            value={`Active Input: ${step.title}`}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#F8FAFC',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', borderRadius: '4px', fontWeight: 600 }}>
              ✓ State Synced
            </span>
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', borderRadius: '4px', fontWeight: 600 }}>
              ✓ Transition Smooth
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onPrev}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#E2E8F0',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <ArrowLeft size={13} />
          <span>Previous Step</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          style={{
            background: 'linear-gradient(135deg, #FF7900, #E65100)',
            border: 'none',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 4px 12px rgba(255, 121, 0, 0.3)',
          }}
        >
          <span>Next Step</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </>
  );
};
