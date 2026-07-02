'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge } from '@/components/UI'
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
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number | null) => {
    if (!value) return 'var(--color-text-secondary)'
    const status = getGlucoseStatus(value)
    const colors: Record<string, string> = {
      low: 'var(--color-warning)',
      normal: 'var(--color-success)',
      high: 'var(--color-warning)',
      critical: 'var(--color-critical)',
    }
    return colors[status]
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: 'var(--spacing-xl)',
          textAlign: 'center',
        }}
      >
        Dashboard
      </h1>

      {stats && stats.current !== null && (
        <Card
          style={{
            marginBottom: 'var(--spacing-lg)',
            textAlign: 'center',
            padding: 'var(--spacing-2xl)',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
            Glicose Atual
          </div>
          <div
            style={{
              fontSize: '4rem',
              fontWeight: 700,
              color: getStatusColor(stats.current),
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            {stats.current}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>mg/dL</div>
          <div
            style={{
              marginTop: 'var(--spacing-md)',
              display: 'inline-block',
            }}
          >
            <Badge color={getGlucoseStatus(stats.current) === GLUCOSE_STATUS.NORMAL ? 'success' : 'warning'}>
              {getGlucoseStatusLabel(stats.current)}
            </Badge>
          </div>
        </Card>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <Card>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
            Média
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.average || '--'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>mg/dL</div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
            Mínimo
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.min || '--'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>mg/dL</div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
            Máximo
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.max || '--'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>mg/dL</div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
            No Alvo
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{inTargetPercent}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>70-180 mg/dL</div>
        </Card>
      </div>

      {trend && (
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
            Tendência
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
            }}
          >
            {trend.direction === 'up' && <span style={{ color: 'var(--color-warning)' }}>↑</span>}
            {trend.direction === 'down' && <span style={{ color: 'var(--color-success)' }}>↓</span>}
            {trend.direction === 'stable' && <span>→</span>}
            {trend.label}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          Insight
        </div>
        <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{insight || 'Adicione medições para ver insights.'}</p>
      </Card>

      {lastUpdate && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-lg)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          Atualizado em {lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  )
}