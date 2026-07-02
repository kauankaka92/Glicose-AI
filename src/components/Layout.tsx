'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardIcon, AIIcon, GlucoseIcon, FoodIcon, InsulinIcon, ChatIcon, ChartIcon, SettingsIcon } from '@/components/SVGIcons'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/chat', label: 'Chat IA', icon: ChatIcon },
  { href: '/glucose', label: 'Glicose', icon: GlucoseIcon },
  { href: '/food', label: 'Alimentação', icon: FoodIcon },
  { href: '/insulin', label: 'Insulina', icon: InsulinIcon },
  { href: '/charts', label: 'Gráficos', icon: ChartIcon },
  { href: '/settings', label: 'Ajustes', icon: SettingsIcon },
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
          padding: '12px 12px env(safe-area-inset-bottom)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-around',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
        }}
        className="mobile-nav"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                transition: 'all var(--transition-base)',
                textDecoration: 'none',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                minWidth: '56px',
              }}
            >
              <IconComponent
                size={20}
                style={{
                  filter: isActive ? 'drop-shadow(0 0 8px var(--color-primary-glow))' : 'none',
                  transition: 'all var(--transition-base)',
                }}
              />
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
            padding: '20px 16px 100px',
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