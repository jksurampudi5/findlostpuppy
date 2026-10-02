import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import './loading-button.css';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  loadingIconType?: 'spinner' | 'dots';
  variant?: 'primary' | 'secondary' | 'outline' | 'refresh';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Optional delay in ms to display the 21st.dev loading animation before executing navigation or callback */
  gapDurationMs?: number;
  onAsyncClick?: () => Promise<void> | void;
}

/**
 * 21st.dev Inspired Micro-Interaction Loading Button
 * Features Emil Kowalski tactile physics, glowing shimmer beam, and state-morphing spinner.
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  isLoading: controlledLoading,
  loadingText,
  icon,
  loadingIconType = 'spinner',
  variant = 'primary',
  size = 'md',
  gapDurationMs = 380,
  onAsyncClick,
  onClick,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = controlledLoading !== undefined ? controlledLoading : internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    if (onAsyncClick) {
      setInternalLoading(true);
      try {
        if (gapDurationMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, gapDurationMs));
        }
        await onAsyncClick();
      } finally {
        setInternalLoading(false);
      }
      return;
    }

    if (onClick) {
      if (gapDurationMs > 0 && !controlledLoading) {
        setInternalLoading(true);
        setTimeout(() => {
          onClick(e);
          setInternalLoading(false);
        }, gapDurationMs);
      } else {
        onClick(e);
      }
    }
  };

  return (
    <button
      type={props.type || 'button'}
      className={`btn-21st-loading variant-${variant} size-${size} ${loading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      style={style}
      {...props}
    >
      {/* 21st.dev Shimmer Beam on Hover / Loading */}
      {loading && <div className="shimmer-beam" aria-hidden="true" />}

      {/* Loading Icon or Normal Icon */}
      {loading ? (
        loadingIconType === 'dots' ? (
          <span className="btn-21st-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <Loader2 size={size === 'sm' ? 13 : size === 'lg' ? 18 : 15} className="btn-21st-spinner" aria-hidden="true" />
        )
      ) : (
        icon && <span className="btn-21st-icon" aria-hidden="true">{icon}</span>
      )}

      {/* Label */}
      <span className="btn-21st-label">
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};
