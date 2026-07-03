import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  style?: React.CSSProperties
  interactive?: boolean
  glow?: 'primary' | 'accent' | 'none'
}

export function Card({ children, title, className = '', style, interactive = false, glow = 'none' }: CardProps) {
  const glowStyle = glow === 'primary'
    ? { boxShadow: 'var(--shadow-glow-primary)' }
    : glow === 'accent'
    ? { boxShadow: 'var(--shadow-glow-accent)' }
    : {}

  return (
    <div
      className={`${className}${interactive ? ' card-interactive' : ''}`}
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-6)',
        boxShadow: 'var(--shadow-sm)',
        border: `1px solid var(--color-border-subtle)`,
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
        ...glowStyle,
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-6)',
            color: 'var(--color-text-secondary)',
            letterSpacing: 'var(--letter-spacing-wide)',
            textTransform: 'uppercase',
            opacity: 0.8,
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
        gap: 'var(--spacing-6)',
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
  fullWidth?: boolean
  loading?: boolean
  glow?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  loading = false,
  glow = false,
  style,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-md)',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-base)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    letterSpacing: 'var(--letter-spacing-tight)',
    position: 'relative',
    overflow: 'hidden',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-text-inverse)',
      boxShadow: glow ? 'var(--shadow-glow-primary)' : 'none',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-secondary)',
      color: 'var(--color-text-primary)',
      border: `1px solid var(--color-border)`,
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#fff',
      boxShadow: glow ? 'var(--shadow-glow-danger)' : 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: `1px solid transparent`,
    },
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: 'var(--spacing-md) var(--spacing-xl)',
      fontSize: 'var(--font-size-sm)',
    },
    md: {
      padding: 'var(--spacing-lg) var(--spacing-2xl)',
      fontSize: 'var(--font-size-base)',
    },
    lg: {
      padding: 'var(--spacing-xl) var(--spacing-3xl)',
      fontSize: 'var(--font-size-lg)',
    },
  }

  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <button
      className={className}
      style={{
        ...baseStyles,
        ...variantStyle,
        ...sizeStyle,
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderColor: 'transparent transparent currentColor currentColor',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  multiline?: boolean
  rows?: number
}

export function Input({
  label,
  error,
  hint,
  icon,
  multiline,
  rows = 3,
  style,
  className = '',
  ...props
}: InputProps) {
  const { onChange: inputOnChange, onInput: inputOnInput, ...inputProps } = props
  const { onChange: textareaOnChange, onInput: textareaOnInput, ...textareaProps } = props

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            letterSpacing: 'var(--letter-spacing-tight)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon && !multiline && (
          <span
            style={{
              position: 'absolute',
              left: 'var(--spacing-md)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
            }}
          >
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea
            className={className}
            rows={rows}
            style={{
              width: '100%',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              transition: 'all var(--transition-fast)',
              fontSize: 'var(--font-size-base)',
              letterSpacing: 'var(--letter-spacing-base)',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              ...style,
            }}
            {...(textareaProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            className={className}
            style={{
              width: '100%',
              padding: icon ? 'var(--spacing-md) var(--spacing-lg) var(--spacing-md) var(--spacing-xl)' : 'var(--spacing-md) var(--spacing-lg)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              transition: 'all var(--transition-fast)',
              fontSize: 'var(--font-size-base)',
              letterSpacing: 'var(--letter-spacing-base)',
              outline: 'none',
              ...style,
            }}
            {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
      {error && (
        <p
          style={{
            marginTop: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{
            marginTop: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary'
  size?: 'sm' | 'md'
  glow?: boolean
  style?: React.CSSProperties
  className?: string
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  glow = false,
  style,
  className = ''
}: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    success: {
      backgroundColor: 'var(--color-success-light)',
      color: 'var(--color-success)',
      border: `1px solid rgba(0, 255, 157, 0.2)`,
      boxShadow: glow ? 'var(--shadow-glow-success)' : 'none',
    },
    warning: {
      backgroundColor: 'var(--color-warning-light)',
      color: 'var(--color-warning)',
      border: `1px solid rgba(255, 184, 107, 0.2)`,
    },
    danger: {
      backgroundColor: 'var(--color-danger-light)',
      color: 'var(--color-danger)',
      border: `1px solid rgba(255, 107, 142, 0.2)`,
    },
    neutral: {
      backgroundColor: 'var(--color-bg-secondary)',
      color: 'var(--color-text-secondary)',
      border: `1px solid var(--color-border)`,
    },
    primary: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      border: `1px solid rgba(0, 255, 157, 0.3)`,
    },
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: 'var(--spacing-md) var(--spacing-xl)',
      fontSize: 'var(--font-size-xs)',
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--font-size-sm)',
    },
  }

  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        letterSpacing: 'var(--letter-spacing-wide)',
        transition: 'all var(--transition-base)',
        ...variantStyle,
        ...sizeStyle,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

interface StatProps {
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  formatFn?: (value: string | number) => string | number
}

export function Stat({ value, label, trend, trendValue, formatFn }: StatProps) {
  const formattedValue = formatFn ? formatFn(value) : value

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--letter-spacing-tight)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {formattedValue}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        {trend && trendValue !== undefined && (
          <Badge
            variant={trend === 'up' ? 'success' : trend === 'down' ? 'warning' : 'neutral'}
            size="sm"
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(trendValue)}%
          </Badge>
        )}
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Section({ title, children, action, className = '', style }: SectionProps) {
  return (
    <section
      className={className}
      style={{
        marginBottom: 'var(--spacing-2xl)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {title}
        </h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  )
}

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '◦', title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-4xl)',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: 'var(--spacing-6)',
          opacity: 0.3,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-lg)',
            maxWidth: '300px',
          }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  label?: string
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  showLabel = false,
  label
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorMap: Record<string, string> = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }

  return (
    <div style={{ width: '100%' }}>
      {(showLabel || label) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          {label && (
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          )}
          {showLabel && (
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: colorMap[variant],
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-slow)',
            boxShadow: `0 0 12px ${colorMap[variant]}40`,
          }}
        />
      </div>
    </div>
  )
}

interface DividerProps {
  variant?: 'solid' | 'dashed' | 'dotted'
  orientation?: 'horizontal' | 'vertical'
  style?: React.CSSProperties
}

export function Divider({ variant = 'solid', orientation = 'horizontal', style }: DividerProps) {
  const borderStyle = variant === 'dashed' ? 'dashed' : variant === 'dotted' ? 'dotted' : 'solid'

  return (
    <div
      style={{
        border: 'none',
        borderTop: orientation === 'horizontal' ? `1px ${borderStyle} var(--color-border)` : 'none',
        borderLeft: orientation === 'vertical' ? `1px ${borderStyle} var(--color-border)` : 'none',
        height: orientation === 'horizontal' ? '1px' : 'auto',
        width: orientation === 'vertical' ? '1px' : 'auto',
        minHeight: orientation === 'vertical' ? '100%' : 'auto',
        ...style,
      }}
    />
  )
}

interface ContainerProps {
  children: React.ReactNode
  maxWidth?: string
  className?: string
  style?: React.CSSProperties
}

export function Container({ children, maxWidth = '1200px', className = '', style }: ContainerProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth,
        margin: '0 auto',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface AlertProps {
  type: 'success' | 'warning' | 'danger' | 'info'
  title?: string
  message?: string
  onClose?: () => void
  children?: React.ReactNode
  style?: React.CSSProperties
}

export function Alert({ type, title, message, onClose, children, style }: AlertProps) {
  const typeStyles: Record<string, React.CSSProperties> = {
    success: {
      backgroundColor: 'var(--color-success-light)',
      border: '1px solid rgba(0, 255, 157, 0.2)',
      color: 'var(--color-success)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-light)',
      border: '1px solid rgba(255, 184, 107, 0.2)',
      color: 'var(--color-warning)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-light)',
      border: '1px solid rgba(255, 107, 142, 0.2)',
      color: 'var(--color-danger)',
    },
    info: {
      backgroundColor: 'var(--color-primary-light)',
      border: '1px solid rgba(0, 255, 157, 0.2)',
      color: 'var(--color-primary)',
    },
  }

  const icons: Record<string, string> = {
    success: '✓',
    warning: '⚠',
    danger: '✕',
    info: 'ℹ',
  }

  const content = children || message

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-md)',
        ...typeStyles[type],
        ...style,
      }}
    >
      <span
        style={{
          fontSize: '18px',
          lineHeight: 1,
          marginTop: '2px',
        }}
      >
        {icons[type]}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            {title}
          </p>
        )}
        {content && (
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: 'var(--line-height-base)',
            }}
          >
            {content}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'currentColor',
            opacity: 0.6,
            padding: 'var(--spacing-sm)',
            fontSize: '18px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          transition: 'background-color var(--transition-base)',
          flexShrink: 0,
        }}
        onClick={() => onChange(!checked)}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            transition: 'left var(--transition-base)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </div>
      {(label || description) && (
        <div style={{ flex: 1 }}>
          {label && (
            <span
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              {label}
            </span>
          )}
          {description && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  )
}