'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert, Badge } from '@/components/UI'
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
          Glicose
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Registre suas medições de glicose
        </p>
      </div>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      {/* Form Card */}
      <Card
        style={{
          marginBottom: 'var(--spacing-2xl)',
          background: 'linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
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

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                letterSpacing: 'var(--letter-spacing-wide)',
                textTransform: 'uppercase',
              }}
            >
              Contexto
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as GlucoseContext)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid var(--color-border)`,
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                outline: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)'
                e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.boxShadow = 'none'
              }}
            >
              {contextOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <Input
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Após caminhada"
              multiline
            />
          </div>

          <Button type="submit" variant="primary" glow style={{ width: '100%' }}>
            Registrar Glicose
          </Button>
        </form>
      </Card>

      {/* History */}
      <h2
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
          marginBottom: 'var(--spacing-lg)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}
      >
        Histórico
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {entries.map((entry) => {
          const status = getGlucoseStatus(entry.value)
          const statusLabel = getGlucoseStatusLabel(entry.value)
          return (
            <Card
              key={entry.id}
              style={{
                padding: 'var(--spacing-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${status === 'normal' ? 'rgba(0, 255, 157, 0.15)' : 'var(--color-border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '70px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 700,
                      color: getStatusColor(entry.value),
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {entry.value}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    mg/dL
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    {formatDateTime(entry.timestamp)}
                  </div>
                  <Badge variant="neutral" size="sm">
                    {contextOptions.find((c) => c.value === entry.context)?.label || entry.context}
                  </Badge>
                  {entry.note && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                        marginTop: 'var(--spacing-xs)',
                      }}
                    >
                      {entry.note}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '20px',
                  padding: '8px',
                  opacity: 0.6,
                  transition: 'all var(--transition-fast)',
                }}
              >
                ×
              </button>
            </Card>
          )
        })}

        {entries.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-3xl)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: 'var(--spacing-lg)',
                opacity: 0.2,
              }}
            >
              ◉
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
              }}
            >
              Nenhum registro ainda.
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-tertiary)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Adicione sua primeira medição acima.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}