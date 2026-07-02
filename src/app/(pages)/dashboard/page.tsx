'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Stat, Section, Container } from '@/components/UI'
import { getGlucoseEntries, getSettings } from '@/lib/storage'
import { calculateGlucoseStats, calculateTrend, generateInsightText, getPercentageInTarget } from '@/lib/insights'
import { getGlucoseStatus, getGlucoseStatusLabel, GLUCOSE_STATUS } from '@/lib/types'

export default function Dashboard() {
  const [stats, setStats] = useState<ReturnType<typeof calculateGlucoseStats> | null>(null)
  const [trend, setTrend] = useState<ReturnType<typeof calculateTrend> | null>(null)
  const [insight, setInsight] = useState('')
  const [inTargetPercent, setInTargetPercent] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadData = () => {
    const entries = getGlucoseEntries()
    const s = calculateGlucoseStats(entries)
    const t = calculateTrend(entries)
    setStats(s)
    setTrend(t)
    setInsight(generateInsightText(s, t))
    setInTargetPercent(getPercentageInTarget(entries))
    setLastUpdate(new Date())
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatusColor = (value: number | null) => {
    if (!value) return 'var(--color-text-secondary)'
    const status = getGlucoseStatus(value)
    const colors: Record<string, string> = {
      low: 'var(--color-warning)',
      normal: 'var(--color-success)',
      high: 'var(--color-warning)',
      critical: 'var(--color-danger)',
    }
    return colors[status]
  }

  const getStatusGlow = (value: number | null) => {
    if (!value) return 'none'
    const status = getGlucoseStatus(value)
    const glows: Record<string, string> = {
      low: 'var(--shadow-glow-warning)',
      normal: 'var(--shadow-glow-primary)',
      high: 'var(--shadow-glow-warning)',
      critical: 'var(--shadow-glow-danger)',
    }
    return glows[status]
  }

  if (!stats) {
    return (
      <Container>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </Container>
    )
  }

  const currentGlucose = stats.current ?? 0
  const currentStatus = getGlucoseStatus(currentGlucose)
  const statusLabel = getGlucoseStatusLabel(currentGlucose)

  return (
    <Container>
      {/* Header */}
      <div
        style={{
          marginBottom: 'var(--spacing-2xl)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          vis&atilde;o geral
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {lastUpdate && `Atualizado em ${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>

      {/* Current Glucose - Hero Card */}
      <Card
        glow={currentStatus === 'normal' ? 'primary' : currentStatus === 'critical' ? 'accent' : 'none'}
        style={{
          marginBottom: 'var(--spacing-2xl)',
          background: `linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              Glicose Atual
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-5xl)',
                  fontWeight: 700,
                  color: getStatusColor(currentGlucose),
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  textShadow: getStatusGlow(currentGlucose),
                }}
              >
                {currentGlucose}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-lg)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                mg/dL
              </span>
            </div>
          </div>
          <Badge
            variant={
              currentStatus === 'normal' ? 'success' :
              currentStatus === 'critical' ? 'danger' :
              'warning'
            }
            glow
            style={{
              padding: '8px 14px',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-bg-contrast)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                color: trend.direction === 'up' ? 'var(--color-warning)' :
                       trend.direction === 'down' ? 'var(--color-success)' :
                       'var(--color-text-secondary)',
              }}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Tendência: {trend.direction === 'up' ? 'Subindo' : trend.direction === 'down' ? 'Descendo' : 'Estável'}
            </span>
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-2xl)',
        }}
      >
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <Stat
            value={stats.average}
            label="Média"
            formatFn={(v) => Math.round(Number(v))}
          />
        </Card>
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <Stat
            value={stats.min ?? 0}
            label="Mínima"
            trend="down"
            trendValue={5}
          />
        </Card>
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <Stat
            value={stats.max ?? 0}
            label="Máxima"
            trend="up"
            trendValue={8}
          />
        </Card>
      </div>

      {/* Time in Range */}
      <Section title="Tempo na Faixa">
        <Card
          style={{
            background: `linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-success)',
                  fontFamily: 'var(--font-display)',
                  textShadow: 'var(--shadow-glow-primary)',
                }}
              >
                {Math.round(inTargetPercent)}%
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--spacing-xs)',
                }}
              >
                dentro do alvo (70-180 mg/dL)
              </p>
            </div>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `conic-gradient(
                  var(--color-success) 0% ${inTargetPercent}%,
                  var(--color-bg-secondary) ${inTargetPercent}% 100%
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow-primary)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {Math.round(inTargetPercent / 10)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* Insight Card */}
      <Section title="Insight IA">
        <Card
          style={{
            background: `linear-gradient(135deg, rgba(123, 97, 255, 0.05) 0%, rgba(0, 212, 255, 0.03) 100%)`,
            border: `1px solid rgba(123, 97, 255, 0.15)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                filter: 'drop-shadow(0 0 8px var(--color-data-purple))',
              }}
            >
              ◐
            </span>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              {insight}
            </p>
          </div>
        </Card>
      </Section>

      {/* Quick Actions */}
      <Section title="Ações Rápidas">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <Button
            variant="primary"
            glow
            onClick={() => window.location.href = '/glucose'}
            style={{ flex: 1 }}
          >
            + Glicose
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/insulin'}
            style={{ flex: 1 }}
          >
            + Insulina
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/food'}
            style={{ flex: 1 }}
          >
            + Refeição
          </Button>
        </div>
      </Section>
    </Container>
  )
}