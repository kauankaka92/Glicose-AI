'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Alert } from '@/components/UI'
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
      // Only auto-fill if fields are empty
      if (!correction) setCorrection(result.correction.toFixed(1))
      if (!meal) setMeal(result.meal.toFixed(1))
      if (!total) setTotal(result.total.toFixed(1))
    } else {
      setSuggestion(null)
    }
  }, [glucose, carbs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const totalValue = parseFloat(total)
    if (isNaN(totalValue) || totalValue < 0) {
      setAlert({ type: 'danger', message: 'Digite um valor de insulina válido' })
      return
    }

    await saveInsulin({
      correction: parseFloat(correction) || 0,
      meal: parseFloat(meal) || 0,
      total: totalValue,
      timestamp: new Date().toISOString(),
      glucoseValue: parseFloat(glucose) || undefined,
      carbsValue: parseFloat(carbs) || undefined,
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-base)',
    outline: 'none',
    transition: 'all var(--transition-fast)',
    fontFamily: 'var(--font-mono)',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    marginBottom: '6px',
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
          Insulina
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Calcule e registre suas doses
        </p>
      </div>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      {/* Suggestion Card */}
      {suggestion && (
        <Card
          style={{
            marginBottom: 'var(--spacing-xl)',
            background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 212, 255, 0.03) 100%)',
            border: '1px solid rgba(0, 255, 157, 0.15)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
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
                Correção
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-data-cyan)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {suggestion.correction.toFixed(1)}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                unidades
              </p>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
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
                Refeição
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-data-purple)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {suggestion.meal.toFixed(1)}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                unidades
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
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
                Total
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-display)',
                  textShadow: 'var(--shadow-glow-primary)',
                }}
              >
                {suggestion.total.toFixed(1)}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                unidades
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Form Card */}
      <Card
        style={{
          marginBottom: 'var(--spacing-2xl)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div>
              <label style={labelStyle}>Glicose (mg/dL)</label>
              <input
                type="number"
                min="20"
                max="600"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
                placeholder="Ex: 120"
                style={inputStyle}
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
            <div>
              <label style={labelStyle}>Carboidratos (g)</label>
              <input
                type="number"
                min="0"
                max="500"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="Ex: 45"
                style={inputStyle}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div>
              <label style={labelStyle}>Correção (U)</label>
              <input
                type="number"
                step="0.1"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                placeholder="0.0"
                style={inputStyle}
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
            <div>
              <label style={labelStyle}>Refeição (U)</label>
              <input
                type="number"
                step="0.1"
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
                placeholder="0.0"
                style={inputStyle}
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
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={labelStyle}>Total (U)</label>
            <input
              type="number"
              step="0.1"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0.0"
              required
              style={inputStyle}
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

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={labelStyle}>Observação (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Antes do almoço"
              style={inputStyle}
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
            Registrar Insulina
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
        {entries.map((entry) => (
          <Card
            key={entry.id}
            style={{
              padding: 'var(--spacing-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-display)',
                    textShadow: 'var(--shadow-glow-primary)',
                  }}
                >
                  {entry.total.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  unidades
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
                {entry.glucoseValue && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    Glicose: {entry.glucoseValue} mg/dL
                  </div>
                )}
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
        ))}

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
              ◈
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
              }}
            >
              Nenhum registro de insulina.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}