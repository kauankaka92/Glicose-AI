'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge } from '@/components/UI'
import { saveGlucose, getGlucoseEntries, deleteGlucoseEntry } from '@/lib/storage'
import { GlucoseEntry, GlucoseContext } from '@/lib/types'
import { getGlucoseStatus, getGlucoseStatusLabel } from '@/lib/types'

const contextOptions: { value: GlucoseContext; label: string }[] = [
  { value: 'fasting', label: 'Jejum' },
  { value: 'before_meal', label: 'Antes' },
  { value: 'after_meal', label: 'Depois' },
  { value: 'bedtime', label: 'Dormir' },
  { value: 'night', label: 'Madrugada' },
  { value: 'exercise', label: 'Exercício' },
  { value: 'other', label: 'Outro' },
]

export default function GlucosePage() {
  const [value, setValue] = useState('')
  const [context, setContext] = useState<GlucoseContext>('other')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<GlucoseEntry[]>([])
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const all = getGlucoseEntries()
    const sorted = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(sorted.slice(0, 50))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 20 || numValue > 600) {
      setStatus('error')
      setMessage('Valor inválido (20-600 mg/dL)')
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
    setStatus('success')
    setMessage('Glicose registrada!')

    const all = getGlucoseEntries()
    const sorted = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(sorted.slice(0, 50))

    setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, 2000)
  }

  const handleDelete = (id: string) => {
    deleteGlucoseEntry(id)
    const all = getGlucoseEntries()
    const sorted = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(sorted.slice(0, 50))
  }

  const getStatusBadge = (val: number) => {
    const status = getGlucoseStatus(val)
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      normal: 'success',
      low: 'warning',
      high: 'warning',
      critical: 'danger',
    }
    return variants[status] || 'warning'
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: 'var(--letter-spacing-tight)',
          marginBottom: 'var(--spacing-sm)',
        }}>
          Glicose
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Registrar nova leitura
        </p>
      </div>

      {/* Status Message */}
      {(status === 'success' || status === 'error') && (
        <div style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-xl)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          backgroundColor: status === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          color: status === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${status === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
        }}>
          {message}
        </div>
      )}

      {/* Form */}
      <Card style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px',
            }}>
              Glicose (mg/dL)
            </label>
            <input
              type="number"
              min="20"
              max="600"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex: 120"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)'
                e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px',
            }}>
              Contexto
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as GlucoseContext)}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                outline: 'none',
                cursor: 'pointer',
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
              {contextOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px',
            }}>
              Observação (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Após almoço"
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)'
                e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <Button type="submit" variant="primary" glow style={{ width: '100%' }}>
            Registrar Glicose
          </Button>
        </form>
      </Card>

      {/* History */}
      <h2 style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-display)',
        marginBottom: 'var(--spacing-lg)',
        letterSpacing: 'var(--letter-spacing-tight)',
      }}>
        Histórico
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {entries.map(entry => (
          <Card key={entry.id} style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 700,
                    color: entry.value > 180 ? 'var(--color-warning)' : entry.value < 70 ? 'var(--color-warning)' : 'var(--color-success)',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {entry.value}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>mg/dL</span>
                  <Badge variant={getStatusBadge(entry.value)} style={{ fontSize: 'var(--font-size-xs)' }}>
                    {getGlucoseStatusLabel(entry.value)}
                  </Badge>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {new Date(entry.timestamp).toLocaleString('pt-BR')}
                  {entry.context && ` • ${contextOptions.find(c => c.value === entry.context)?.label}`}
                  {entry.note && ` • ${entry.note}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                Excluir
              </button>
            </div>
          </Card>
        ))}

        {entries.length === 0 && (
          <Card style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)', opacity: 0.2 }}>
              ◐
            </div>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>
              Nenhum registro ainda
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)' }}>
              Registre sua primeira glicose acima
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}