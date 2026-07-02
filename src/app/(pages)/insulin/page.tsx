'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert } from '@/components/UI'
import { saveInsulin, getInsulinEntries, deleteInsulinEntry, getSettings } from '@/lib/storage'
import { InsulinEntry } from '@/lib/types'
import { calculateTotalInsulin } from '@/lib/insights'

export default function InsulinPage() {
  const [glucose, setGlucose] = useState('')
  const [carbs, setCarbs] = useState('')
  const [correction, setCorrection] = useState('')
  const [meal, setMeal] = useState('')
  const [total, setTotal] = useState('')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<InsulinEntry[]>([])
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [suggestion, setSuggestion] = useState<{ correction: number; meal: number; total: number } | null>(null)

  const loadEntries = () => {
    const all = getInsulinEntries()
    const sorted = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(sorted.slice(0, 50))
  }

  useEffect(() => {
    loadEntries()
  }, [])

  useEffect(() => {
    const g = parseFloat(glucose)
    const c = parseFloat(carbs)

    if (g >= 20 && g <= 600 && c >= 0) {
      const settings = getSettings()
      const result = calculateTotalInsulin(g, c, settings)
      setSuggestion({
        correction: result.correction,
        meal: result.meal,
        total: result.total,
      })
      setCorrection(result.correction.toString())
      setMeal(result.meal.toString())
      setTotal(result.total.toString())
    } else {
      setSuggestion(null)
    }
  }, [glucose, carbs])

  const handleGlucoseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlucose(e.target.value)
  }

  const handleCarbsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCarbs(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const totalValue = parseFloat(total)
    if (isNaN(totalValue) || totalValue < 0) {
      setAlert({ type: 'danger', message: 'Digite um valor de insulina válido' })
      return
    }

    saveInsulin({
      correction: parseFloat(correction) || 0,
      meal: parseFloat(meal) || 0,
      total: totalValue,
      timestamp: new Date().toISOString(),
      glucoseValue: parseFloat(glucose) || undefined,
      note: note.trim() || undefined,
    })

    setGlucose('')
    setCarbs('')
    setCorrection('')
    setMeal('')
    setTotal('')
    setNote('')
    setAlert({ type: 'success', message: 'Insulina registrada com sucesso!' })
    loadEntries()

    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      deleteInsulinEntry(id)
      loadEntries()
    }
  }

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: 'var(--spacing-xl)',
          textAlign: 'center',
        }}
      >
        Insulina
      </h1>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <Input
              label="Glicose atual (mg/dL)"
              type="number"
              min="20"
              max="600"
              value={glucose}
              onChange={handleGlucoseChange}
              placeholder="Ex: 200"
            />

            <Input
              label="Carboidratos (g)"
              type="number"
              min="0"
              value={carbs}
              onChange={handleCarbsChange}
              placeholder="Ex: 60"
            />
          </div>

          {suggestion && (
            <div
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                Sugestão de dose
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Correção</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{suggestion.correction}U</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Refeição</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{suggestion.meal}U</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {suggestion.total}U
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <Input
              label="Correção (U)"
              type="number"
              min="0"
              step="0.1"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
            />

            <Input
              label="Refeição (U)"
              type="number"
              min="0"
              step="0.1"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
            />

            <Input
              label="Total (U)"
              type="number"
              min="0"
              step="0.1"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Aplicada antes do almoço"
              multiline
            />
          </div>

          <Button type="submit" style={{ width: '100%' }}>
            Registrar Insulina
          </Button>
        </form>
      </Card>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
        Histórico
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {entries.map((entry) => (
          <Card key={entry.id} style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                  {formatDateTime(entry.timestamp)}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total: </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {entry.total}U
                    </span>
                  </div>
                  {entry.correction > 0 && (
                    <div style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Correção: </span>
                      <span style={{ fontWeight: 500 }}>{entry.correction}U</span>
                    </div>
                  )}
                  {entry.meal && entry.meal > 0 && (
                    <div style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Refeição: </span>
                      <span style={{ fontWeight: 500 }}>{entry.meal}U</span>
                    </div>
                  )}
                </div>
                {entry.glucoseValue && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    Glicose: {entry.glucoseValue} mg/dL
                  </div>
                )}
                {entry.note && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    {entry.note}
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDelete(entry.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '1.25rem',
                  padding: 'var(--spacing-xs)',
                }}
              >
                ×
              </Button>
            </div>
          </Card>
        ))}

        {entries.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Nenhum registro ainda. Adicione sua primeira dose acima.
          </div>
        )}
      </div>
    </div>
  )
}