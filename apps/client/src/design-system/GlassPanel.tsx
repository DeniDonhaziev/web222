import type { HTMLAttributes } from 'react';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section';
}

export function GlassPanel({ className = '', children, ...props }: GlassPanelProps) {
  return (
    <div className={`glass-panel p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function GlassCard({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass-card p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
