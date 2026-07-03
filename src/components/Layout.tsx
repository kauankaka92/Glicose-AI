'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SpriteIcon } from './icons/IconSystem'

const iconMap: Record<string, 'dashboard' | 'chatai' | 'glucometer' | 'food' | 'insulin' | 'graphs' | 'settings'> = {
  '/dashboard': 'dashboard',
  '/chat': 'chatai',
  '/glucose': 'glucometer',
  '/food': 'food',
  '/insulin': 'insulin',
  '/charts': 'graphs',
  '/settings': 'settings',
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/chat', label: 'Chat IA', icon: 'chatai' },
  { href: '/glucose', label: 'Glicose', icon: 'glucometer' },
  { href: '/food', label: 'Alimentação', icon: 'food' },
  { href: '/insulin', label: 'Insulina', icon: 'insulin' },
  { href: '/charts', label: 'Gráficos', icon: 'graphs' },
  { href: '/settings', label: 'Ajustes', icon: 'settings' },
] as const

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Bottom Nav - Refined with glassmorphism */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderTop: `1px solid var(--color-border)`,
          padding: 'var(--spacing-6) var(--spacing-4) env(safe-area-inset-bottom)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-around',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
        }}
        className="mobile-nav"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                transition: 'all var(--transition-base)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                letterSpacing: 'var(--letter-spacing-wide)',
                minWidth: '64px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                }}
              >
                <SpriteIcon
                  name={item.icon}
                  size={24}
                  strokeWidth={2}
                  aria-hidden="true"
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 8px var(--color-primary-glow))' : 'none',
                    transition: 'all var(--transition-base)',
                  }}
                />
              </div>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Main content - with padding for bottom nav */}
      <main
        style={{
          minHeight: '100vh',
          paddingBottom: 'env(safe-area-inset-bottom, 80px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-lg) var(--spacing-4) var(--spacing-3xl)',
            maxWidth: '100%',
          }}
        >
          {children}
        </div>
      </main>

      {/* Global styles for nav */}
      <style jsx global>{`
        .mobile-nav {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        @media (min-width: 768px) {
          .mobile-nav {
            display: none;
          }
        }
      `}</style>
    </>
  )
}