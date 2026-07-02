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
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)',
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-text)',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
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
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-secondary)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#fff',
    },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: {
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      fontSize: '0.875rem',
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: '1rem',
    },
    lg: {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontSize: '1.125rem',
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
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    transition: 'border-color 0.2s',
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
            fontSize: '0.875rem',
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
            minHeight: '80px',
            resize: 'vertical',
            ...style,
          }}
          {...props}
        />
      ) : (
        <input
          style={{
            ...baseStyle,
            ...(error ? errorStyle : {}),
            ...style,
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
  const colors: Record<string, string> = {
    info: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: `${colors[type]}15`,
        border: `1px solid ${colors[type]}30`,
        color: 'var(--color-text)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '0 var(--spacing-sm)',
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
  color?: 'default' | 'success' | 'warning' | 'danger'
}

export function Badge({ children, color = 'default' }: BadgeProps) {
  const colors: Record<string, string> = {
    default: 'var(--color-text-secondary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: `${colors[color]}15`,
        color: colors[color],
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </span>
  )
}