/**
 * Glicose AI - Icon System
 *
 * Two patterns for SVG asset integration:
 * 1. Dynamic Async Fetch Component (per-file loading)
 * 2. SVG Sprite Pipeline (single HTTP request)
 *
 * Assets loaded from: C:\Glicose AI\svg\
 * Mapped to public: ./svg/
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'

// =============================================================================
// PATTERN 1: DYNAMIC ASYNC FETCH COMPONENT
// =============================================================================
// Loads SVG files asynchronously via fetch()
// Guarantees currentColor stroke inheritance for theme support

export type IconName =
  | 'glucometer'
  | 'insulin'
  | 'dashboard'
  | 'settings'
  | 'chatai'
  | 'food'
  | 'graphs'

export interface IconProps {
  name: IconName
  size?: number | string
  className?: string
  strokeWidth?: number
  title?: string
  'aria-hidden'?: boolean
  'aria-label'?: string
  role?: 'img' | 'presentation'
}

interface IconCache {
  [key: string]: string
}

const iconCache: IconCache = {}

async function fetchIcon(name: IconName): Promise<string> {
  if (iconCache[name]) {
    return iconCache[name]
  }

  const response = await fetch(`/svg/${name}.svg`)
  if (!response.ok) {
    throw new Error(`Failed to load icon: ${name}`)
  }
  const svgContent = await response.text()
  iconCache[name] = svgContent
  return svgContent
}

function parseSVGContent(content: string, props: IconProps): React.ReactNode {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'image/svg+xml')
  const svgElement = doc.querySelector('svg')
  if (!svgElement) return null

  const size = typeof props.size === 'number' ? `${props.size}px` : props.size

  // Extract inner content preserving all elements
  const innerHTML = svgElement.innerHTML

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={props.className}
      style={{
        width: size,
        height: size,
        ...(props.strokeWidth && { '--stroke-width': props.strokeWidth.toString() } as React.CSSProperties),
      }}
      role={props['aria-label'] ? 'img' : props.role ?? 'presentation'}
      aria-hidden={props['aria-hidden'] ?? !props['aria-label']}
      aria-label={props['aria-label']}
      dangerouslySetInnerHTML={{ __html: innerHTML }}
    />
  )
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className = '',
  strokeWidth,
  title,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  role,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    fetchIcon(name)
      .then((content) => {
        if (mounted) {
          setSvgContent(content)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err)
        }
      })

    return () => {
      mounted = false
    }
  }, [name])

  if (error) {
    console.error(`Icon load error: ${name}`, error)
    return null
  }

  if (!svgContent) {
    return (
      <span
        className={className}
        style={{ width: size, height: size, display: 'inline-block' }}
        aria-hidden="true"
      />
    )
  }

  return parseSVGContent(svgContent, {
    name,
    size,
    className,
    strokeWidth,
    title,
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    role,
  })
}

// =============================================================================
// PATTERN 2: SVG SPRITE PIPELINE
// =============================================================================
// Single sprite sheet loaded once, referenced via <use> elements
// Optimal for performance: minimal HTTP requests, shared DOM definitions

export const SpriteSheet = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    aria-hidden="true"
  >
    <symbol id="icon-glucometer">
      <rect x="7" y="2" width="10" height="18" rx="3" />
      <rect x="9" y="5" width="6" height="7" rx="1.5" />
      <path d="M11 15.5h2" />
      <path d="M9.5 18h5" />
      <path d="M12 20v2" />
      <path d="M15.5 19.5c0 1.4-1.6 2.5-3.5 2.5s-3.5-1.1-3.5-2.5 1.6-3.5 3.5-3.5 3.5 2.1 3.5 3.5z" />
    </symbol>

    <symbol id="icon-insulin">
      <path d="M3 21h18" />
      <path d="M12 2v4" />
      <circle cx="12" cy="2.5" r="1.5" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <path d="M11 10h2" />
      <path d="M11 12h2" />
      <path d="M11 14h2" />
      <path d="M11 16h2" />
      <path d="M12 20v2" />
      <circle cx="12" cy="21" r="0.75" />
    </symbol>

    <symbol id="icon-dashboard">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </symbol>

    <symbol id="icon-settings">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.22 4.22l2.12 2.12" />
      <path d="M17.66 17.66l2.12 2.12" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.22 19.78l2.12-2.12" />
      <path d="M17.66 6.34l2.12-2.12" />
      <circle cx="12" cy="2" r="1" />
      <circle cx="12" cy="22" r="1" />
      <circle cx="2" cy="12" r="1" />
      <circle cx="22" cy="12" r="1" />
    </symbol>

    <symbol id="icon-chatai">
      <path d="M20 14.66a3.34 3.34 0 0 1-3.34 3.34H8l-4 3V6a3.34 3.34 0 0 1 3.34-3.34h9.32A3.34 3.34 0 0 1 20 6v8.66z" />
      <path d="M12 9v1.5" />
      <path d="M12 13v1.5" />
      <path d="M10.5 10.5h3" />
      <path d="M12 6.5l.5 1.5h1.5l-1.2.9.5 1.5-1.3-.9-1.3.9.5-1.5-1.2-.9h1.5z" />
    </symbol>

    <symbol id="icon-food">
      <path d="M12 21c-4 0-7-3.5-7-7s4-8 7-12c3 4 7 8.5 7 12s-3 7-7 7z" />
      <path d="M12 8v4" />
      <path d="M12 15v4" />
      <path d="M10 11h4" />
      <path d="M12 3c1.5 0 2.5-1 2.5-2" />
      <path d="M12 3c-1.5 0-2.5-1-2.5-2" />
      <path d="M17 8c1.5 0 2.5 1 2.5 2.5S18.5 13 17 13" />
    </symbol>

    <symbol id="icon-graphs">
      <path d="M3 3v18h18" />
      <path d="M6 17l3.5-4.5 4 3 5-6" />
      <circle cx="6" cy="17" r="1" />
      <circle cx="9.5" cy="12.5" r="1" />
      <circle cx="13.5" cy="15.5" r="1" />
      <circle cx="18.5" cy="9.5" r="1" />
    </symbol>
  </svg>
)

interface SpriteIconProps {
  name: IconName
  size?: number | string
  className?: string
  strokeWidth?: number
  'aria-hidden'?: boolean
  'aria-label'?: string
  role?: 'img' | 'presentation'
}

export const SpriteIcon: React.FC<SpriteIconProps> = ({
  name,
  size = 24,
  className = '',
  strokeWidth,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  role,
}) => {
  const iconId = `icon-${name}`
  const iconSize = typeof size === 'number' ? `${size}px` : size

  return (
    <svg
      viewBox="0 0 24 24"
      width={iconSize}
      height={iconSize}
      className={className}
      role={ariaLabel ? 'img' : role ?? 'presentation'}
      aria-hidden={ariaHidden ?? !ariaLabel}
      aria-label={ariaLabel}
      style={
        strokeWidth
          ? { stroke: 'currentColor', strokeWidth: strokeWidth.toString() } as React.CSSProperties
          : { stroke: 'currentColor' } as React.CSSProperties
      }
    >
      <use href={`#${iconId}`} />
    </svg>
  )
}

// =============================================================================
// DEFAULT EXPORT (Choose pattern based on needs)
// =============================================================================
// Pattern 1 (Icon): Better for dynamic imports, on-demand loading
// Pattern 2 (SpriteIcon): Better for performance, consistent iconography

export const useIcon = (name: IconName) => {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    fetchIcon(name).then(setContent).catch(console.error)
  }, [name])

  return content
}

export default {
  Icon,
  SpriteIcon,
  SpriteSheet,
  useIcon,
}