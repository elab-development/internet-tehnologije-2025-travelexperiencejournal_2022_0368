import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  footer,
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md overflow-hidden
        ${hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-xl font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}