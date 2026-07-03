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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 1.5.7 2.8 1.8 3.7L5 15.5v.2c0 2.6 2.1 4.8 4.8 4.8h4.4c2.6 0 4.8-2.1 4.8-4.8v-.2l-4.3-5.3c1.1-.9 1.8-2.2 1.8-3.7C16.5 4 14.5 2 12 2zm0 1.5c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm-2.2 12l2.2-3 2.2 3H9.8zm2.2 3.5c-1.1 0-2.1-.6-2.6-1.5h5.2c-.5.9-1.5 1.5-2.6 1.5z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M8 2v9c0 2.8-2.2 5-5 5S8 21 8 21s5-2.2 5-5V2H8zm11 0v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V2h8zM6 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm11 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M12 2L9 5l2 2-2 2 2 2-2 2 3 3 2-2 2 2 2-2-2-2 2-2-2-2-2 2-2-2 2-2-2-2zm-1 13l-2 2-2-2 2-2 2 2zm-7 3v4h16v-2H4v-2H2z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v5h-8V3zm0 7h8v11h-8V10z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
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
      <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M5 9.2h3V19H5zM10.4 5.4h3V19h-3zm5.2 7.6h3V19h-3zM3 3h18v2H3zm1.5 4h15v2h-15z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M19 19H5V5h2v12h12zm-3.5-5.8L11 8.7l-2.6 2.6-1.4-1.4L11 5.8l5.9 5.9-1.4 1.5z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M19 19H5V5h2v12h12zm-7-3.8l4.5-4.5 1.4 1.4L13 16l-5.9-5.9 1.4-1.4 2.5 2.5V5h2v10.2z"/>
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
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M3 17h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zm0-16h14v14H5V5z"/>
    </svg>
  )
}