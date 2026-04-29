import React from 'react';

interface SpaceXInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'email' | 'password' | 'number';
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export const SpaceXInput: React.FC<SpaceXInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
  rows = 4
}) => {
  const baseClasses = `w-full px-4 py-3 bg-transparent
                       border-b-2 border-[var(--ghost-border)]
                       text-sm text-[var(--spectral-white)]
                       uppercase tracking-[1px]
                       focus:outline-none focus:border-[var(--spectral-white)]
                       placeholder:text-[var(--text-muted)]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 ${className}`;

  if (type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={baseClasses}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={baseClasses}
    />
  );
};
