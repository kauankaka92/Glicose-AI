'use client'

import React from 'react'
import { SpriteIcon, type IconName } from './icons/IconSystem'

interface NavItem {
  href: string
  label: string
  icon: IconName
  active?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/glucose', label: 'Glicose', icon: 'glucometer' },
  { href: '/insulin', label: 'Insulina', icon: 'insulin' },
  { href: '/food', label: 'Nutrição', icon: 'food' },
  { href: '/chat', label: 'IA Chat', icon: 'chatai' },
  { href: '/charts', label: 'Gráficos', icon: 'graphs' },
  { href: '/settings', label: 'Ajustes', icon: 'settings' },
]

export function SidebarNav() {
  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      <ul className="sidebar-nav__list">
        {navItems.map((item) => (
          <li key={item.href} className="sidebar-nav__item">
            <a
              href={item.href}
              className={`sidebar-nav__link ${item.active ? 'sidebar-nav__link--active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
            >
              <SpriteIcon name={item.icon} size={20} aria-hidden="true" />
              <span className="sidebar-nav__label">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}