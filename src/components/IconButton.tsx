'use client'

import React, { ButtonHTMLAttributes } from 'react'
import { SpriteIcon, type IconName } from './icons/IconSystem'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  showLabel?: boolean
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'primary',
      size = 'md',
      loading = false,
      showLabel = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const buttonClass = `icon-button icon-button--${variant} icon-button--${size} ${className ?? ''}`

    return (
      <button
        ref={ref}
        type="button"
        className={buttonClass}
        disabled={disabled ?? loading}
        aria-label={label}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="icon-button__spinner" aria-hidden="true" />
        ) : (
          <SpriteIcon
            name={icon}
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        {showLabel && <span className="icon-button__label">{children ?? label}</span>}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Form usage example
export function GlucoseEntryForm() {
  return (
    <form className="glucose-form" aria-labelledby="glucose-form-title">
      <h2 id="glucose-form-title" className="glucose-form__title">
        Registrar Glicemia
      </h2>

      <div className="glucose-form__field">
        <label htmlFor="glucose-value" className="glucose-form__label">
          Valor (mg/dL)
        </label>
        <input
          id="glucose-value"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="glucose-form__input"
          placeholder="Ex: 110"
          min="20"
          max="600"
          required
        />
      </div>

      <fieldset className="glucose-form__fieldset">
        <legend className="glucose-form__legend">Tipo de Medição</legend>
        <label className="glucose-form__radio">
          <input type="radio" name="measurement-type" value="fasting" defaultChecked />
          <span>Jejum</span>
        </label>
        <label className="glucose-form__radio">
          <input type="radio" name="measurement-type" value="postprandial" />
          <span>Pós-prandial</span>
        </label>
        <label className="glucose-form__radio">
          <input type="radio" name="measurement-type" value="random" />
          <span>Aleatória</span>
        </label>
      </fieldset>

      <div className="glucose-form__actions">
        <IconButton icon="glucometer" label="Registrar glicemia" variant="primary" type="submit" showLabel>
          Registrar
        </IconButton>
        <IconButton icon="graphs" label="Ver histórico" variant="secondary" type="button" />
      </div>
    </form>
  )
}