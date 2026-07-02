'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Stat, Section, Container } from '@/components/UI'
import { getGlucoseEntries, getFoodEntries, getInsulinEntries } from '@/lib/storage'
import {
  calculateGlucoseStats,
  calculateTrend,
  generateInsightText,
  getPercentageInTarget,
  analyzeNutrition,
  analyzeGlucoseVariability,
  getDailyPatterns,
  getEatingQualityScore,
} from '@/lib/insights'
import { getGlucoseStatus, getGlucoseStatusLabel } from '@/lib/types'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [trend, setTrend] = useState<any>(null)
  const [insight, setInsight] = useState('')
  const [inTargetPercent, setInTargetPercent] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [nutrition, setNutrition] = useState<any>(null)
  const [variability, setVariability] = useState<any>(null)
  const [dailyPatterns, setDailyPatterns] = useState<any[]>([])
  const [eatingScore, setEatingScore] = useState<any>(null)

  const loadData = () => {
    const glucose = getGlucoseEntries()
    const food = getFoodEntries()
    const insulin = getInsulinEntries()

    setStats(calculateGlucoseStats(glucose))
    setTrend(calculateTrend(glucose))
    setInsight(generateInsightText(calculateGlucoseStats(glucose), calculateTrend(glucose)))
    setInTargetPercent(getPercentageInTarget(glucose))
    setNutrition(analyzeNutrition(food, 7))
    setVariability(analyzeGlucoseVariability(glucose))
    setDailyPatterns(getDailyPatterns(7))
    setEatingScore(getEatingQualityScore(food, glucose))
    setLastUpdate(new Date())
  }

  useEffect(() => {
    loadData()
    const handleDataChange = () => loadData()
    window.addEventListener('glicose-data-changed', handleDataChange)
    return () => window.removeEventListener('glicose-data-changed', handleDataChange)
  }, [])

  if (!stats || !nutrition || !variability || !eatingScore) {
    return (
      <Container>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </Container>
    )
  }

  const currentGlucose = stats.current ?? 0
  const status = getGlucoseStatus(currentGlucose)
  const statusLabel = getGlucoseStatusLabel(currentGlucose)

  const statusColor: Record<string, string> = { low: 'var(--color-warning)', normal: 'var(--color-success)', high: 'var(--color-warning)', critical: 'var(--color-danger)' }
  const statusGlow: Record<string, string> = { low: 'var(--shadow-glow-warning)', normal: 'var(--shadow-glow-primary)', high: 'var(--shadow-glow-warning)', critical: 'var(--shadow-glow-danger)' }

  const gradeColor: Record<string, string> = { A: '#22c55e', B: '#4ade80', C: '#fbbf24', D: '#fb923c', F: '#ef4444' }
  const gradeGlow: Record<string, string> = { A: '0 0 30px rgba(34,197,94,0.5)', B: '0 0 25px rgba(74,222,128,0.4)', C: '0 0 20px rgba(251,191,36,0.3)', D: '0 0 15px rgba(251,146,60,0.2)', F: '0 0 25px rgba(239,68,68,0.4)' }

  const stabilityColor: Record<string, string> = { excelente: 'var(--color-success)', boa: 'var(--color-success)', moderada: 'var(--color-warning)', instavel: 'var(--color-danger)', instável: 'var(--color-danger)' }

  const currentGradeGlow = gradeGlow[eatingScore.grade] || 'none'

  return (
    <Container>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {lastUpdate && `Atualizado em ${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>

      {/* Hero - Glicose + Eating Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
        {/* Glicose Atual */}
        <Card glow={status === 'normal' ? 'primary' : status === 'critical' ? 'accent' : 'none'} style={{ background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%)', padding: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
            <div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>Glicose Atual</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: 'var(--font-size-5xl)', fontWeight: 700, color: statusColor[status], fontFamily: 'var(--font-display)', textShadow: statusGlow[status] }}>{currentGlucose}</span>
                <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)' }}>mg/dL</span>
              </div>
            </div>
            <Badge variant={status === 'normal' ? 'success' : status === 'critical' ? 'danger' : 'warning'} glow>{statusLabel}</Badge>
          </div>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '20px' }}>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {trend.direction === 'up' ? 'Subindo' : trend.direction === 'down' ? 'Descendo' : 'Estável'}
                {Math.abs(trend.value) > 0 && ` (${Math.abs(trend.value)} mg/dL)`}
              </span>
            </div>
          )}
        </Card>

        {/* Eating Quality Score */}
        <Card glow="accent" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(139,92,246,0.2)', padding: 'var(--spacing-xl)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--spacing-lg)' }}>Qualidade da Alimentação</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: `linear-gradient(135deg, ${gradeColor[eatingScore.grade]} 0%, ${gradeColor[eatingScore.grade]}80 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: currentGradeGlow, transform: 'rotate(-8deg)' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', transform: 'rotate(8deg)' }}>{eatingScore.grade}</span>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: gradeColor[eatingScore.grade], fontFamily: 'var(--font-display)' }}>{eatingScore.score}/100</div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Score baseado em nutrição e estabilidade glicêmica</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {eatingScore.factors.map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm)', background: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{f.name}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: f.impact >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{f.impact >= 0 ? '+' : ''}{f.impact}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <Card><Stat value={stats.average} label="Média" formatFn={(v: any) => Math.round(Number(v))} /></Card>
        <Card><Stat value={stats.min ?? 0} label="Mínima" /></Card>
        <Card><Stat value={stats.max ?? 0} label="Máxima" /></Card>
        <Card><Stat value={variability.cv} label="Variação (CV)%" /></Card>
      </div>

      {/* Nutrition + Variability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
        {/* Nutrition */}
        <Card style={{ padding: 'var(--spacing-xl)', background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(59,130,246,0.03) 100%)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-lg)' }}>Análise Nutricional (7 dias)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Carboidratos</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>{nutrition.totalCarbs}g</p>
            </div>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Proteínas (est.)</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>{nutrition.totalProtein}g</p>
            </div>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Gorduras (est.)</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>{nutrition.totalFat}g</p>
            </div>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Calorias (est.)</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>{nutrition.totalCalories}</p>
            </div>
          </div>
          <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-contrast)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Média carbs/refeição</p>
            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: nutrition.avgCarbsPerMeal > 60 ? 'var(--color-warning)' : 'var(--color-success)' }}>{nutrition.avgCarbsPerMeal}g {nutrition.avgCarbsPerMeal > 60 && '(elevado)'}</p>
          </div>
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>Recomendações</p>
            {nutrition.recommendations.map((r: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-xs)' }}>
                <span>◐</span>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>{r}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Variability + TIR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <Card style={{ padding: 'var(--spacing-xl)', flex: 1, background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.03) 100%)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-lg)' }}>Variabilidade Glicêmica</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: stabilityColor[variability.stability] || 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>
                  {variability.stability === 'excelente' ? 'Excelente' : variability.stability === 'boa' ? 'Boa' : variability.stability === 'moderada' ? 'Moderada' : 'Instável'}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>CV: {variability.cv}% | SD: {variability.sd}</p>
              </div>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `conic-gradient(${stabilityColor[variability.stability] || 'var(--color-warning)'} ${variability.score}%, var(--color-bg-secondary) ${variability.score}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{variability.score}</span>
              </div>
            </div>
          </Card>

          {/* Time in Range */}
          <Card style={{ padding: 'var(--spacing-xl)', background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(34,197,94,0.02) 100%)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-md)' }}>Tempo na Faixa</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(var(--color-success) 0% ${inTargetPercent}%, var(--color-bg-secondary) ${inTargetPercent}% 100%)` }} />
                <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>{Math.round(inTargetPercent)}%</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Dentro de 70-180 mg/dL</p>
                <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Baixa</p>
                    <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>{stats.low}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Alta</p>
                    <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>{stats.high}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Daily Patterns */}
      <Section title="Últimos 7 Dias">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--spacing-sm)' }}>
          {dailyPatterns.map((day, i) => (
            <Card key={i} style={{ padding: 'var(--spacing-md)', textAlign: 'center', background: day.timeInRange >= 70 ? 'linear-gradient(180deg, rgba(34,197,94,0.1) 0%, transparent 100%)' : day.timeInRange >= 50 ? 'linear-gradient(180deg, rgba(251,191,36,0.1) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(239,68,68,0.1) 0%, transparent 100%)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </p>
              <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: day.avgGlucose && day.avgGlucose >= 70 && day.avgGlucose <= 180 ? 'var(--color-success)' : 'var(--color-warning)', fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-xs)' }}>
                {day.avgGlucose || '--'}
              </p>
              <Badge variant={day.timeInRange >= 70 ? 'success' : day.timeInRange >= 50 ? 'warning' : 'danger'} style={{ fontSize: 'var(--font-size-xs)' }}>
                {day.timeInRange}%
              </Badge>
            </Card>
          ))}
        </div>
      </Section>

      {/* Insight IA */}
      <Section title="Insight IA">
        <Card style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px var(--color-data-purple))' }}>◐</span>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>{insight}</p>
          </div>
        </Card>
      </Section>

      {/* Quick Actions */}
      <Section title="Ações Rápidas">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Button variant="primary" glow onClick={() => window.location.href = '/glucose'} style={{ flex: 1 }}>+ Glicose</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/insulin'} style={{ flex: 1 }}>+ Insulina</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/food'} style={{ flex: 1 }}>+ Refeição</Button>
        </div>
      </Section>
    </Container>
  )
}