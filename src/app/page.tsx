'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/components/UI'
import { GlucoseIcon, AIIcon, DashboardIcon, TrendStableIcon } from '@/components/SVGIcons'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hasData = localStorage.getItem('glicose_entries')
    if (hasData) {
      router.push('/dashboard')
    }
  }, [router])

  if (!mounted) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-2xl)',
        textAlign: 'center',
      }}
    >
      {/* Logo / Hero Icon */}
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: 'var(--color-primary-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-2xl)',
          boxShadow: 'var(--shadow-glow-primary)',
          animation: 'biometric-pulse 3s ease-in-out infinite',
        }}
      >
        <span
          style={{
            fontSize: '48px',
            color: 'var(--color-text-inverse)',
          }}
        >
          ◈
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: 'var(--letter-spacing-tight)',
          marginBottom: 'var(--spacing-md)',
          background: 'var(--color-primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Glicose AI
      </h1>

      <p
        style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          maxWidth: '400px',
          marginBottom: 'var(--spacing-3xl)',
          lineHeight: 'var(--line-height-relaxed)',
        }}
      >
        Monitoramento inteligente de glicose com insights em tempo real
      </p>

      {/* Features */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-lg)',
          maxWidth: '600px',
          marginBottom: 'var(--spacing-4xl)',
        }}
      >
        {[
          { icon: GlucoseIcon, label: 'Registros' },
          { icon: AIIcon, label: 'IA Chat' },
          { icon: DashboardIcon, label: 'Gráficos' },
        ].map((feature) => {
          const IconComponent = feature.icon
          return (
            <Card
              key={feature.label}
              style={{
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconComponent size={32} style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }} />
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {feature.label}
              </div>
            </Card>
          )
        })}
      </div>

      {/* CTA Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => router.push('/dashboard')}
        glow
        style={{
          padding: '16px 48px',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        Começar Agora
        <TrendStableIcon size={20} style={{ transform: 'rotate(-45deg)' }} />
      </Button>

      {/* Footer */}
      <p
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        v4.0 • Bio-Tech Minimal
      </p>
    </div>
  )
}