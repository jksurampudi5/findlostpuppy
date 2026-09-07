import { AlertCircle, Eye, HeartHandshake, CheckCircle2 } from 'lucide-react';
import type { ReportStatus } from '../types';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'LOST':
        return {
          className: 'badge-lost',
          icon: <AlertCircle size={size === 'sm' ? 12 : 14} />,
          text: 'LOST',
          hasPulse: true,
        };
      case 'SIGHTED':
        return {
          className: 'badge-sighted',
          icon: <Eye size={size === 'sm' ? 12 : 14} />,
          text: 'SIGHTED',
          hasPulse: false,
        };
      case 'REUNITED':
        return {
          className: 'badge-reunited',
          icon: <HeartHandshake size={size === 'sm' ? 12 : 14} />,
          text: 'REUNITED ❤️',
          hasPulse: false,
        };
      case 'CLOSED':
      default:
        return {
          className: 'badge-closed',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} />,
          text: 'CLOSED',
          hasPulse: false,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`status-badge ${config.className}`} style={{ fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.825rem' }}>
      {config.hasPulse && <span className="pulse-dot" aria-hidden="true" />}
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
};
