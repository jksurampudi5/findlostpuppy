import { BackButton } from "@/components/ui/back-button";
import { AlignJustifyIcon } from "@/components/ui/align-justify-icon";

export function BackButtonDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <BackButton onClick={() => alert("Back button clicked!")} />
      <span style={{ fontSize: '13px', color: '#AEB4BA' }}>
        Hover over the button to see the sliding arrow animation
      </span>
    </div>
  );
}

export function AlignJustifyDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          borderRadius: '8px',
          background: '#27272A',
          color: '#F4F4F5',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          cursor: 'pointer',
        }}
      >
        <AlignJustifyIcon size={24} />
      </button>
      <span style={{ fontSize: '13px', color: '#AEB4BA' }}>
        Animated sequential stroke menu button
      </span>
    </div>
  );
}

