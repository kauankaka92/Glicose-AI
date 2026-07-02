'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/UI'
import { getGlucoseEntries, getFoodEntries, getInsulinEntries } from '@/lib/storage'
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
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: 'var(--spacing-xl)',
          textAlign: 'center',
        }}
      >
        Gráficos
      </h1>

      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
          justifyContent: 'center',
        }}
      >
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: timeRange === range ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
              color: timeRange === range ? '#fff' : 'var(--color-text)',
              cursor: 'pointer',
              fontWeight: timeRange === range ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Distribuição de Glicose
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-md)',
          }}
        >
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-success)15',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {distribution.inRangePercent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>No alvo (70-180)</div>
          </div>

          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-warning)15',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>
              {distribution.lowPercent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Baixo {'<'}70)</div>
          </div>

          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-warning)15',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>
              {distribution.highPercent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Alto {'>'}180)</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Evolução Diária
        </h2>

        {days.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
            Sem dados no período selecionado
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', minWidth: 'fit-content' }}>
              {days.map((day) => {
                const dayData = groupedData[day]
                const dayValues = dayData.map((d) => d.value)
                const dayAvg = Math.round(dayValues.reduce((a, b) => a + b, 0) / dayValues.length)
                const dayMin = Math.min(...dayValues)
                const dayMax = Math.max(...dayValues)

                return (
                  <div
                    key={day}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      minWidth: '60px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '200px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {dayData.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left: `${(i / dayData.length) * 100}%`,
                            bottom: 0,
                            width: `${40 / dayData.length}px`,
                            height: `${getChartHeight(d.value)}px`,
                            backgroundColor: getColor(d.value),
                            opacity: 0.7,
                            borderRadius: '2px 2px 0 0',
                          }}
                          title={`${formatTime(d.date)}: ${d.value} mg/dL`}
                        />
                      ))}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${((70 - minValue) / (maxValue - minValue || 100)) * 100}%`,
                          left: 0,
                          right: 0,
                          borderTop: '1px dashed var(--color-warning)',
                          opacity: 0.5,
                        }}
                        title="Limite inferior (70)"
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${((180 - minValue) / (maxValue - minValue || 100)) * 100}%`,
                          left: 0,
                          right: 0,
                          borderTop: '1px dashed var(--color-success)',
                          opacity: 0.5,
                        }}
                        title="Limite superior (180)"
                      />
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                      {formatDate(day)}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{dayAvg}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-secondary)' }}>
                      {dayMin}-{dayMax}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {stats && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Resumo do Período
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 'var(--spacing-md)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Média</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.average}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Mínimo</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.min}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Máximo</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.max}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Leituras</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.readings}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}