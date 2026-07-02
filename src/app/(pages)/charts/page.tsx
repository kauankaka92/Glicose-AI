'use client'

import { useState, useEffect } from 'react'
import { Card, Badge, ProgressBar, Section, Container } from '@/components/UI'
import { getGlucoseEntries } from '@/lib/storage'
import { calculateGlucoseStats, getGlucoseDistribution } from '@/lib/insights'

export default function ChartsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [glucoseData, setGlucoseData] = useState<Array<{ date: string; value: number }>>([])
  const [distribution, setDistribution] = useState({ inRangePercent: 0, lowPercent: 0, highPercent: 0 })
  const [stats, setStats] = useState<ReturnType<typeof calculateGlucoseStats> | null>(null)

  useEffect(() => {
    const now = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const glucose = getGlucoseEntries()
      .filter((e) => new Date(e.timestamp) >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    setGlucoseData(glucose.map((e) => ({ date: e.timestamp, value: e.value })))

    const filteredStats = calculateGlucoseStats(glucose)
    setStats(filteredStats)
    setDistribution(getGlucoseDistribution(glucose))
  }, [timeRange])

  const maxValue = Math.max(...glucoseData.map((d) => d.value), 200)
  const minValue = Math.min(...glucoseData.map((d) => d.value), 50)

  const getChartHeight = (value: number) => {
    const range = maxValue - minValue || 100
    return ((value - minValue) / range) * 200 + 20
  }

  const getColor = (value: number) => {
    if (value < 70) return 'var(--color-warning)'
    if (value <= 180) return 'var(--color-success)'
    return 'var(--color-warning)'
  }

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const formatTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const groupedData = glucoseData.reduce((acc, curr) => {
    const day = curr.date.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(curr)
    return acc
  }, {} as Record<string, typeof glucoseData>)

  const days = Object.keys(groupedData).slice(-14)

  return (
    <Container maxWidth="800px">
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
            fontFamily: 'var(--font-display)',
            letterSpacing: 'var(--letter-spacing-tight)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Gráficos
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Visualize sua evolução
        </p>
      </div>

      {/* Time Range Selector */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-xl)',
          justifyContent: 'center',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content',
          margin: '0 auto var(--spacing-xl)',
        }}
      >
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: timeRange === range ? 'var(--color-primary)' : 'transparent',
              color: timeRange === range ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: timeRange === range ? 600 : 400,
              transition: 'all var(--transition-base)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <Card style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
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
              Média
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {Math.round(stats.average)}
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              mg/dL
            </p>
          </Card>
          <Card style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
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
              Mínimo
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'var(--color-warning)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {stats.min ?? '--'}
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              mg/dL
            </p>
          </Card>
          <Card style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
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
              Máximo
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'var(--color-data-purple)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {stats.max ?? '--'}
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              mg/dL
            </p>
          </Card>
        </div>
      )}

      {/* Distribution Card */}
      <Section title="Distribuição">
        <Card
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Na faixa (70-180 mg/dL)
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-success)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {Math.round(distribution.inRangePercent)}%
                </span>
              </div>
              <ProgressBar
                value={distribution.inRangePercent}
                variant="success"
              />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Abaixo {'<'}70 mg/dL
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-warning)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {Math.round(distribution.lowPercent)}%
                </span>
              </div>
              <ProgressBar
                value={distribution.lowPercent}
                variant="warning"
              />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Acima {'>'}180 mg/dL
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-warning)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {Math.round(distribution.highPercent)}%
                </span>
              </div>
              <ProgressBar
                value={distribution.highPercent}
                variant="warning"
              />
            </div>
          </div>
        </Card>
      </Section>

      {/* Chart */}
      <Section title="Evolução">
        <Card
          style={{
            minHeight: '280px',
            background: `
              linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%),
              var(--grid-pattern)
            `,
          }}
        >
          {glucoseData.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Sem dados no período selecionado
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '4px',
                height: '220px',
                padding: 'var(--spacing-md)',
                overflowX: 'auto',
              }}
            >
              {glucoseData.map((point, i) => {
                const isInTarget = point.value >= 70 && point.value <= 180
                const color = getColor(point.value)
                return (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 auto',
                      width: '6px',
                      height: `${getChartHeight(point.value)}px`,
                      backgroundColor: color,
                      borderRadius: '2px',
                      opacity: 0.8,
                      transition: 'all var(--transition-base)',
                      boxShadow: isInTarget ? '0 0 8px rgba(0, 255, 157, 0.3)' : 'none',
                      position: 'relative',
                    }}
                    title={`${formatTime(point.date)}: ${point.value} mg/dL`}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '9px',
                        color: 'var(--color-text-tertiary)',
                        whiteSpace: 'nowrap',
                        opacity: 0,
                        transition: 'opacity var(--transition-fast)',
                      }}
                    >
                      {point.value}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </Section>

      {/* Data Points List */}
      <Section title={`Últimas medições (${days.length} dias)`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {glucoseData.slice(-10).reverse().map((point, i) => (
            <Card
              key={i}
              style={{
                padding: 'var(--spacing-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {formatDate(point.date)} às {formatTime(point.date)}
              </span>
              <Badge
                variant={point.value >= 70 && point.value <= 180 ? 'success' : 'warning'}
                glow={point.value >= 70 && point.value <= 180}
              >
                {point.value} mg/dL
              </Badge>
            </Card>
          ))}
        </div>
      </Section>
    </Container>
  )
}