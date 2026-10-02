import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import dogUrl from "./dog_only.png";
import "./dog-run-flow-transition.css";

export type FlowDirection = "forward" | "backward";

export interface DogRunFlowTransitionProps {
  direction?: FlowDirection;
  fromStep?: string;
  toStep?: string;
  onComplete: () => void;
  durationMs?: number;
  message?: string;
  children?: ReactNode;
  className?: string;
}

const DEFAULT_DURATION_MS = 2300;
const REDUCED_MOTION_DURATION_MS = 180;
const IMAGE_LOAD_TIMEOUT_MS = 2000;

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Fetch the original artwork when this module loads.
// Import this component in your persistent app shell to warm the image cache.
const preloadedDog = typeof Image === "undefined" ? null : new Image();

if (preloadedDog) {
  preloadedDog.src = dogUrl;
}

function containKeyboardFocus(event: KeyboardEvent<HTMLDivElement>) {
  // Portal events otherwise bubble through the parent React tree.
  event.stopPropagation();

  if (event.key !== "Tab") return;

  const container = event.currentTarget;

  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button",
        "input",
        "select",
        "textarea",
        "[tabindex]",
        '[contenteditable="true"]',
      ].join(","),
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest("[inert]") &&
      element.getClientRects().length > 0 &&
      window.getComputedStyle(element).visibility !== "hidden",
  );

  event.preventDefault();

  if (focusable.length === 0) {
    container.focus({ preventScroll: true });
    return;
  }

  const currentIndex = focusable.findIndex(
    (element) => element === document.activeElement,
  );

  const nextIndex = event.shiftKey
    ? currentIndex <= 0
      ? focusable.length - 1
      : currentIndex - 1
    : currentIndex >= focusable.length - 1
      ? 0
      : currentIndex + 1;

  focusable[nextIndex]?.focus({ preventScroll: true });
}

/**
 * One mounted instance represents one transition.
 *
 * - Direction and duration are captured on mount.
 * - Use a new React key to start another transition.
 * - durationMs measures the crossing after the image-loading gate.
 * - children render beneath the progress bar as optional overlay content.
 * - onComplete fires once; the overlay stays opaque until its parent unmounts it.
 *
 * Keep this component outside the route or Suspense subtree being replaced.
 */
export function DogRunFlowTransition({
  direction = "forward",
  fromStep,
  toStep,
  onComplete,
  durationMs = DEFAULT_DURATION_MS,
  message,
  children,
  className,
}: DogRunFlowTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef(onComplete);
  const completedRef = useRef(false);

  const [run] = useState(() => ({
    direction,
    durationMs:
      Number.isFinite(durationMs) && durationMs >= 0
        ? durationMs
        : DEFAULT_DURATION_MS,
  }));

  const instanceId = useId().replace(/[^\w-]/g, "");
  const maskId = `flp-dog-mask-${instanceId}`;
  const filterId = `flp-dog-filter-${instanceId}`;
  const messageId = `flp-dog-message-${instanceId}`;

  const isBackward = run.direction === "backward";

  const sourceLabel = fromStep?.trim() || "Current step";
  const destinationLabel =
    toStep?.trim() || (isBackward ? "Previous step" : "Next step");

  const statusMessage =
    message ??
    (isBackward ? "Heading back a step." : "On to the next adventure.");

  useBrowserLayoutEffect(() => {
    completionRef.current = onComplete;
  }, [onComplete]);

  // Prevent interaction with the covered page and restore its previous state.
  useBrowserLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    const siblings = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== overlay,
      )
      .map((element) => ({
        element,
        wasInert: element.inert,
      }));

    for (const { element } of siblings) {
      element.inert = true;
    }

    document.body.style.overflow = "hidden";
    overlay.focus({ preventScroll: true });

    const keepFocusInside = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !overlay.contains(event.target)
      ) {
        overlay.focus({ preventScroll: true });
      }
    };

    document.addEventListener("focusin", keepFocusInside, true);

    return () => {
      document.removeEventListener("focusin", keepFocusInside, true);
      document.body.style.overflow = previousOverflow;

      for (const { element, wasInert } of siblings) {
        element.inert = wasInert;
      }

      const currentFocus = document.activeElement;
      const shouldRestoreFocus =
        currentFocus === document.body ||
        currentFocus === overlay ||
        overlay.contains(currentFocus);

      if (
        shouldRestoreFocus &&
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        !previousFocus.closest("[inert]")
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  // One clock controls travel, progress, and completion.
  // Frame updates touch DOM styles directly instead of rerendering React.
  useEffect(() => {
    const overlay = overlayRef.current;
    const progress = progressRef.current;

    if (!overlay || !progress || completedRef.current) return;

    let disposed = false;
    let started = false;
    let frameId = 0;
    let elapsedMs = 0;
    let previousTime: number | null = null;
    let previousPercent = -1;
    let imageTimeout: number | undefined;

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    // Once reduced motion is requested, retain it for this transition.
    let reducedMotion = motionQuery.matches;

    overlay.dataset.phase = "loading";
    overlay.dataset.asset = "loading";
    overlay.dataset.reducedMotion = String(reducedMotion);
    overlay.style.setProperty("--flp-progress", "0");

    const paintProgress = (fraction: number) => {
      overlay.style.setProperty(
        "--flp-progress",
        fraction.toFixed(5),
      );

      const percent = Math.round(fraction * 100);

      if (percent !== previousPercent) {
        progress.setAttribute("aria-valuenow", String(percent));
        previousPercent = percent;
      }
    };

    const finish = () => {
      if (disposed || completedRef.current) return;

      completedRef.current = true;
      paintProgress(1);
      overlay.dataset.phase = "complete";

      // Do not fade or remove the overlay here.
      // The parent controls removal after the destination is ready.
      completionRef.current();
    };

    const tick = (time: number) => {
      if (disposed || completedRef.current) return;

      if (document.hidden) {
        previousTime = null;
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      if (previousTime !== null) {
        elapsedMs += time - previousTime;
      }

      previousTime = time;

      const effectiveDuration = reducedMotion
        ? Math.min(run.durationMs, REDUCED_MOTION_DURATION_MS)
        : run.durationMs;

      const fraction =
        effectiveDuration === 0
          ? 1
          : Math.min(elapsedMs / effectiveDuration, 1);

      paintProgress(fraction);

      if (fraction >= 1) {
        finish();
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const start = (imageReady: boolean) => {
      if (disposed || started) return;

      started = true;
      window.clearTimeout(imageTimeout);

      overlay.dataset.asset = imageReady ? "ready" : "error";
      overlay.dataset.phase = "running";

      frameId = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      previousTime = null;
      overlay.dataset.paused = String(document.hidden);
    };

    const handleMotionChange = () => {
      if (motionQuery.matches) {
        reducedMotion = true;
        overlay.dataset.reducedMotion = "true";
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionChange);
    handleVisibility();

    const image = preloadedDog ?? new Image();

    if (!image.src) {
      image.src = dogUrl;
    }

    // An unavailable image must not leave navigation stuck indefinitely.
    // On failure, the dark overlay and progress still complete normally.
    imageTimeout = window.setTimeout(
      () => start(false),
      IMAGE_LOAD_TIMEOUT_MS,
    );

    void image.decode().then(
      () => start(true),
      () => start(false),
    );

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(imageTimeout);

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, [run]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={["flp-dog-flow", className].filter(Boolean).join(" ")}
      data-direction={run.direction}
      data-phase="loading"
      data-asset="loading"
      role="dialog"
      aria-modal="true"
      aria-label="FindLostPuppy screen transition"
      aria-describedby={messageId}
      tabIndex={-1}
      onKeyDown={containKeyboardFocus}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flp-dog-flow__content">
        <p className="flp-dog-flow__brand">FindLostPuppy</p>

        <p
          id={messageId}
          className="flp-dog-flow__message"
          role="status"
          aria-atomic="true"
        >
          {statusMessage}
        </p>

        <div className="flp-dog-flow__steps" aria-hidden="true">
          <span className="flp-dog-flow__step flp-dog-flow__step--from">
            {sourceLabel}
          </span>

          <span className="flp-dog-flow__arrow">
            {isBackward ? "←" : "→"}
          </span>

          <span className="flp-dog-flow__step flp-dog-flow__step--to">
            {destinationLabel}
          </span>
        </div>

        <div
          ref={progressRef}
          className="flp-dog-flow__progressbar"
          aria-label={`${isBackward ? "Returning" : "Moving"
            } from ${sourceLabel} to ${destinationLabel}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span className="flp-dog-flow__progress-fill" />
        </div>

        {children != null && (
          <div className="flp-dog-flow__extra">{children}</div>
        )}
      </div>

      <div className="flp-dog-flow__scene" aria-hidden="true">
        <div className="flp-dog-flow__ground" />

        <div className="flp-dog-flow__traveler">
          <div className="flp-dog-flow__shadow" />

          <div className="flp-dog-flow__facing">
            <div className="flp-dog-flow__bound">
              {/*
                Crop coordinates match the supplied square image.
                Keep dog_only.png on its original, uncropped canvas.

                The image itself supplies the silhouette. No replacement
                dog drawing or approximated SVG path is used.
              */}
              <svg
                className="flp-dog-flow__dog"
                viewBox="315 246 620 766"
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
              >
                <defs>
                  <filter
                    id={filterId}
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    colorInterpolationFilters="sRGB"
                  >
                    <feComponentTransfer>
                      <feFuncR
                        type="linear"
                        slope="-1.1"
                        intercept="1.05"
                      />
                      <feFuncG
                        type="linear"
                        slope="-1.1"
                        intercept="1.05"
                      />
                      <feFuncB
                        type="linear"
                        slope="-1.1"
                        intercept="1.05"
                      />
                    </feComponentTransfer>
                  </filter>

                  <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    maskContentUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="1254"
                    height="1254"
                    style={{ maskType: "luminance" }}
                  >
                    <image
                      href={dogUrl}
                      x="0"
                      y="0"
                      width="1254"
                      height="1254"
                      preserveAspectRatio="xMidYMid meet"
                      filter={`url(#${filterId})`}
                    />
                  </mask>
                </defs>

                <rect
                  x="0"
                  y="0"
                  width="1254"
                  height="1254"
                  fill="#17181A"
                  mask={`url(#${maskId})`}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default DogRunFlowTransition;
