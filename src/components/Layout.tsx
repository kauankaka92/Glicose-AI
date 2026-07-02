'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/glucose', label: 'Glicose' },
  { href: '/food', label: 'Alimentação' },
  { href: '/insulin', label: 'Insulina' },
  { href: '/charts', label: 'Gráficos' },
  { href: '/settings', label: 'Ajustes' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--color-text)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background-color 0.2s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
      <main style={{ flex: 1, padding: 'var(--spacing-lg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  )
}