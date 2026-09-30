import type { ReactNode } from 'react';
import { PawPrint } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Renders an accessible empty-state message with optional icon and action content. */
export function EmptyState({ title, message, action, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`standard-empty-state ${className}`} role="status">
      <div className="standard-empty-state__icon" aria-hidden="true">{icon || <PawPrint size={30} />}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="standard-empty-state__action">{action}</div>}
    </div>
  );
}
