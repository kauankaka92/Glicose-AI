import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, title, className = '', style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        transition: 'all var(--transition-base)',
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

export function CardGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--spacing-lg)',
      }}
    >
      {children}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#fff',
      boxShadow: 'var(--shadow-sm)',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-secondary)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#fff',
      boxShadow: 'var(--shadow-sm)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: {
      padding: '6px 12px',
      fontSize: '0.8125rem',
      height: '32px',
    },
    md: {
      padding: '10px 16px',
      fontSize: '0.9375rem',
      height: '40px',
    },
    lg: {
      padding: '14px 24px',
      fontSize: '1rem',
      height: '48px',
    },
  }

  return (
    <button
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
      onMouseEnter={(e) => {
        if (variant !== 'ghost' && !props.disabled) {
          e.currentTarget.style.opacity = '0.9'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        if (variant !== 'ghost' && !props.disabled) {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {children}
    </button>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string
  error?: string
  multiline?: boolean
}

export function Input({ label, error, multiline, style, ...props }: InputProps) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    transition: 'all var(--transition-fast)',
    fontSize: '1rem',
    letterSpacing: '-0.01em',
  }

  const errorStyle: React.CSSProperties = {
    borderColor: 'var(--color-danger)',
  }

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 'var(--spacing-xs)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          style={{
            ...baseStyle,
            ...(error ? errorStyle : {}),
            minHeight: '100px',
            resize: 'vertical',
            fontFamily: 'inherit',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-light)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />
      ) : (
        <input
          style={{
            ...baseStyle,
            ...(error ? errorStyle : {}),
            fontFamily: 'inherit',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-light)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />
      )}
      {error && (
        <p
          style={{
            marginTop: 'var(--spacing-xs)',
            fontSize: '0.75rem',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
  onClose?: () => void
}

export function Alert({ type, children, onClose }: AlertProps) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    info: { bg: 'var(--color-primary-light)', border: 'rgba(0, 122, 255, 0.2)', text: 'var(--color-primary)' },
    success: { bg: 'var(--color-success-light)', border: 'rgba(52, 199, 89, 0.2)', text: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-light)', border: 'rgba(255, 149, 0, 0.2)', text: 'var(--color-warning)' },
    danger: { bg: 'var(--color-danger-light)', border: 'rgba(255, 59, 48, 0.2)', text: 'var(--color-danger)' },
  }

  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '❌',
  }

  const color = colors[type]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        color: 'var(--color-text)',
      }}
    >
      <span style={{ fontSize: '1.125rem' }}>{icons[type]}</span>
      <div style={{ flex: 1, fontSize: '0.9375rem' }}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: '1.25rem',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
}

export function Badge({ children, color = 'default', size = 'md' }: BadgeProps) {
  const colors: Record<string, string> = {
    default: 'var(--color-bg-secondary)',
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }

  const textColors: Record<string, string> = {
    default: 'var(--color-text)',
    primary: '#fff',
    success: '#fff',
    warning: '#fff',
    danger: '#fff',
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'sm' ? '4px 8px' : '6px 12px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: colors[color],
        color: textColors[color],
        fontSize: size === 'sm' ? '0.6875rem' : '0.8125rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </span>
  )
}