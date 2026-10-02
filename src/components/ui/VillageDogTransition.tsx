import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import "./village-dog-transition.css";

export type FlowDirection = "forward" | "backward";

export interface VillageDogTransitionProps {
  direction?: FlowDirection;
  fromStep?: string;
  toStep?: string;
  durationMs?: number;
  message?: string;
  subtext?: string;
  onComplete: () => void;
}

const DEFAULT_DURATION_MS = 2200;

export const VillageDogTransition: React.FC<VillageDogTransitionProps> = ({
  direction = "forward",
  fromStep = "Owner Profile",
  toStep = "Location",
  durationMs = DEFAULT_DURATION_MS,
  message,
  subtext,
  onComplete,
}) => {
  const isBackward = direction === "backward";
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Lock body scroll during full-screen transition
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Try to ensure video auto-plays smoothly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Synchronized progress timer & completion handoff
  useEffect(() => {
    let startTime: number | null = null;
    let animFrame: number;

    const tick = (now: number) => {
      if (completedRef.current) return;
      if (!startTime) startTime = now;

      const elapsed = now - startTime;
      const fraction = Math.min(elapsed / durationMs, 1);
      setProgress(fraction);

      if (fraction >= 1) {
        completedRef.current = true;
        onCompleteRef.current();
      } else {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [durationMs]);

  const defaultMessage =
    message || (isBackward ? `Going Back to ${toStep}` : `Advancing to ${toStep}`);

  const defaultSubtext =
    subtext || (isBackward ? `Returning from ${fromStep} to ${toStep}...` : `Moving from ${fromStep} to ${toStep}...`);

  const videoSrc = isBackward
    ? "/animations/dog_village_run_back.mp4"
    : "/animations/dog_village_run_opt.mp4";

  const posterSrc = isBackward
    ? "/animations/dog_village_poster_back.jpg"
    : "/animations/dog_village_poster.jpg";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="flp-village-transition"
      data-direction={direction}
      role="dialog"
      aria-modal="true"
      aria-label="FindLostPuppy transition"
    >
      {/* Top Floating App Pill */}
      <div className="flp-village-header">
        <span className="flp-village-header__badge-dot" />
        FindLostPuppy
      </div>

      {/* Responsive Centered 9:16 Mobile Canvas */}
      <div className="flp-village-video-wrapper">
        <video
          key={videoSrc}
          ref={videoRef}
          className="flp-village-video"
          poster={posterSrc}
          autoPlay
          playsInline
          muted
          loop
          preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Soft Vignette Overlay to blend edges into background */}
        <div className="flp-village-vignette" />
      </div>

      {/* Bottom Floating Status Card */}
      <div className="flp-village-card">
        <h3 className="flp-village-message">{defaultMessage}</h3>
        <p className="flp-village-subtext">{defaultSubtext}</p>

        {/* Breadcrumb Steps */}
        <div className="flp-village-steps" aria-hidden="true">
          {isBackward ? (
            <>
              <span className="flp-village-step--to">{toStep}</span>
              <span className="flp-village-arrow">←</span>
              <span className="flp-village-step--from">{fromStep}</span>
            </>
          ) : (
            <>
              <span className="flp-village-step--from">{fromStep}</span>
              <span className="flp-village-arrow">→</span>
              <span className="flp-village-step--to">{toStep}</span>
            </>
          )}
        </div>

        {/* Progress Line */}
        <div
          className="flp-village-progress-track"
          style={{ "--village-progress": progress } as React.CSSProperties}
          aria-hidden="true"
        >
          <div className="flp-village-progress-bar" />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VillageDogTransition;
