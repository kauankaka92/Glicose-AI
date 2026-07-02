import React from 'react'

interface SVGIconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function GlucoseIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path d="M14.4 22q-.875 0-1.675-.363T11.35 20.6l-5.8-6.75l1.3-.975q.5-.375 1.125-.4t1.15.325l1.375.875V4q0-.425.288-.713T11.5 3q.425 0 .713.288T12.5 4v9H14V8q0-.425.288-.713T15 7q.425 0 .713.288T16 8v5h1.5V9q0-.425.288-.713T18.5 8q.425 0 .713.288T19.5 9v4H21v-2q0-.425.288-.713T22 10q.425 0 .713.288T23 11v7q0 1.65-1.175 2.825T19 22h-4.6ZM4.5 10q-1.475 0-2.488-1.012T1 6.55q0-.85.338-1.475t1.587-2.05l1.575-1.8L6.075 3.05q1.275 1.475 1.6 2.075T8 6.55q0 1.425-1.025 2.438T4.5 10Z"/>
    </svg>
  )
}

export function FoodIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path d="M18.06 23h1.66c.84 0 1.53-.65 1.63-1.47L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26c1.44 1.42 2.43 2.89 2.43 5.29V23M1 22v-1h15.03v1c0 .54-.45 1-1.03 1H2c-.55 0-1-.46-1-1m15.03-7C16.03 7 1 7 1 15h15.03M1 17h15v2H1v-2Z"/>
    </svg>
  )
}

export function InsulinIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path d="M12 5.61L9.24 8.35l3.31 3.31l-1.06 1.06l-3.31-3.31l-1.77 1.77l3.31 3.31l-1.06 1.06l-3.31-3.31l-2 2A2 2 0 0 0 3 16.66l1 1.89l-2.25 2.29l1.41 1.41L5.45 20l1.89 1a2 2 0 0 0 1 .26a2 2 0 0 0 1.42-.59L18.39 12zm7.8 3.59l-1.79-1.8l1.42-1.41l1.41 1.41l1.41-1.41l-4.24-4.24l-1.41 1.41l1.41 1.42l-1.41 1.41l-1.8-1.79l-1.74-1.75l-1.41 1.42l1.03 1.03v.01l6.41 6.41h.01l1.03 1.03l1.42-1.41l-1.74-1.74h-.01z"/>
    </svg>
  )
}

export function DashboardIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path d="M15.21 2H8.75A6.76 6.76 0 0 0 2 8.75v6.5A6.76 6.76 0 0 0 8.75 22h6.5A6.76 6.76 0 0 0 22 15.25v-6.5A6.76 6.76 0 0 0 15.21 2M8.43 16.23a.8.8 0 1 1-1.6 0v-5.1a.8.8 0 0 1 1.6 0zm4.45 0a.8.8 0 1 1-1.6 0V7.78a.8.8 0 0 1 1.6 0zm4.21 0a.8.8 0 1 1-1.6 0V9.82a.8.8 0 0 1 1.6 0z"/>
    </svg>
  )
}

export function AIIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path fillRule="evenodd" d="M384 128v256H128V128zm-148.25 64h-24.932l-47.334 128h22.493l8.936-25.023h56.662L260.32 320h23.847zm88.344 0h-22.402v128h22.402zm-101 21.475l22.315 63.858h-44.274zM405.335 320H448v42.667h-42.667zm-256 85.333H192V448h-42.667zm85.333 0h42.666V448h-42.666zM149.333 64H192v42.667h-42.667zM320 405.333h42.667V448H320zM234.667 64h42.666v42.667h-42.666zM320 64h42.667v42.667H320zm85.333 170.667H448v42.666h-42.667zM64 320h42.667v42.667H64zm341.333-170.667H448V192h-42.667zM64 234.667h42.667v42.666H64zm0-85.334h42.667V192H64z"/>
    </svg>
  )
}

export function ConfigIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <mask id="configMask">
        <g fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round">
          <path d="m12 2l-3 3h-4v4l-3 3l3 3v4h4l3 3l3-3h4v-4l3-3l-3-3V5h-4l-3-3Z"/>
          <circle cx="12" cy="12" r="3"/>
        </g>
      </mask>
      <rect width="24" height="24" fill="currentColor" mask="url(#configMask)"/>
    </svg>
  )
}

export function TrendUpIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export function TrendDownIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

export function TrendStableIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <line x1="1" y1="18" x2="23" y2="18" />
      <polyline points="17 14 23 18 17 22" />
    </svg>
  )
}

export function ChatIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  )
}

export function ChartIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function SettingsIcon({ size = 24, className, style }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}