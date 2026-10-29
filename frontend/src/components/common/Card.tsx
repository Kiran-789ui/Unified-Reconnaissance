import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  action,
  subtitle,
}) => {
  return (
    <div
      className={`bg-navy-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm ${className}`}
    >
      {(title || action || subtitle) && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
