import React from 'react';

interface SpaceXButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'error' | 'warning';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const SpaceXButton: React.FC<SpaceXButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const borderColorMap = {
    default: 'border-[var(--ghost-border)]',
    success: 'border-[var(--success-border)]',
    error: 'border-[var(--error-border)]',
    warning: 'border-[var(--warning-border)]'
  };

  const borderColor = borderColorMap[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-[18px] py-[18px] bg-[var(--ghost-surface)]
                  border ${borderColor} rounded-[32px]
                  text-[var(--spectral-white)] text-xs font-bold
                  uppercase tracking-[1.17px]
                  hover:bg-[var(--ghost-hover)]
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-colors duration-200 ${className}`}
    >
      {children}
    </button>
  );
};
