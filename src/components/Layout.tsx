'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/chat', label: 'Chat IA', icon: '💬' },
  { href: '/glucose', label: 'Glicose', icon: '🩸' },
  { href: '/food', label: 'Alimentação', icon: '🍎' },
  { href: '/insulin', label: 'Insulina', icon: '💉' },
  { href: '/charts', label: 'Gráficos', icon: '📈' },
  { href: '/settings', label: 'Ajustes', icon: '⚙️' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-around',
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
                gap: '2px',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
                minWidth: '56px',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.625rem', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop Sidebar */}
      <nav
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '240px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--spacing-xl)',
          zIndex: 100,
          display: 'none',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
        }}
        className="desktop-nav"
      >
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Glicose AI
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Monitoramento com IA
          </p>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--color-text)',
                textDecoration: 'none',
                fontWeight: isActive ? 500 : 400,
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main Content */}
      <main
        style={{
          marginLeft: '240px',
          marginRight: 0,
          marginBottom: '0',
          padding: 'var(--spacing-xl)',
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
        }}
        className="main-content"
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '80px' }}>
          {children}
        </div>
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-nav {
            display: flex !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding-bottom: 80px !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-nav {
            display: none !important;
          }
          .desktop-nav {
            display: flex !important;
          }
          .main-content {
            margin-left: 240px !important;
          }
        }

        /* Smooth animations */
        @media (prefers-reduced-motion: no-preference) {
          * {
            transition-behavior: normal;
          }
        }
      `}</style>
    </>
  )
}