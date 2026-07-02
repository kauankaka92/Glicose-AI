'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert } from '@/components/UI'
import { saveGlucose, getGlucoseEntries, deleteGlucoseEntry } from '@/lib/storage'
import { GlucoseEntry, GlucoseContext } from '@/lib/types'
import { getGlucoseStatus, getGlucoseStatusLabel } from '@/lib/types'

const contextOptions: { value: GlucoseContext; label: string }[] = [
  { value: 'fasting', label: 'Jejum' },
  { value: 'before_meal', label: 'Antes da refeição' },
  { value: 'after_meal', label: 'Após refeição' },
  { value: 'bedtime', label: 'Hora de dormir' },
  { value: 'night', label: 'Madrugada' },
  { value: 'exercise', label: 'Exercício' },
  { value: 'other', label: 'Outro' },
]

export default function GlucosePage() {
  const [value, setValue] = useState('')
  const [context, setContext] = useState<GlucoseContext>('other')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<GlucoseEntry[]>([])
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)

  const loadEntries = () => {
    const all = getGlucoseEntries()
    const sorted = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(sorted.slice(0, 50))
  }

  useEffect(() => {
    loadEntries()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 20 || numValue > 600) {
      setAlert({ type: 'danger', message: 'Digite um valor de glicose válido (20-600 mg/dL)' })
      return
    }

    saveGlucose({
      value: numValue,
      timestamp: new Date().toISOString(),
      context,
      note: note.trim() || undefined,
    })

    setValue('')
    setNote('')
    setAlert({ type: 'success', message: 'Glicose registrada com sucesso!' })
    loadEntries()

    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      deleteGlucoseEntry(id)
      loadEntries()
    }
  }

  const getStatusColor = (val: number) => {
    const status = getGlucoseStatus(val)
    const colors: Record<string, string> = {
      normal: 'var(--color-success)',
      low: 'var(--color-warning)',
      high: 'var(--color-warning)',
      critical: 'var(--color-critical)',
    }
    return colors[status]
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
        Glicose
      </h1>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Glicose (mg/dL)"
              type="number"
              min="20"
              max="600"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex: 120"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
            >
              Contexto
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as GlucoseContext)}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '1rem',
              }}
            >
              {contextOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Após caminhada"
              multiline
            />
          </div>

          <Button type="submit" style={{ width: '100%' }}>
            Registrar
          </Button>
        </form>
      </Card>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
        Histórico
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {entries.map((entry) => (
          <Card
            key={entry.id}
            style={{
              padding: 'var(--spacing-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: getStatusColor(entry.value),
                  minWidth: '80px',
                }}
              >
                {entry.value}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {formatDateTime(entry.timestamp)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {contextOptions.find((c) => c.value === entry.context)?.label || entry.context}
                </div>
                {entry.note && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    {entry.note}
                  </div>
                )}
              </div>
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
            Nenhum registro ainda. Adicione sua primeira medição acima.
          </div>
        )}
      </div>
    </div>
  )
}