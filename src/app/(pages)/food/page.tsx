'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert, Badge } from '@/components/UI'
import { saveFood, getFoodEntries, deleteFoodEntry } from '@/lib/storage'
import { FoodEntry, MealType } from '@/lib/types'
import { searchFood } from '@/lib/ai-engine'

const mealTypeOptions: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Café da manhã' },
  { value: 'morning_snack', label: 'Lanche da manhã' },
  { value: 'lunch', label: 'Almoço' },
  { value: 'afternoon_snack', label: 'Lanche da tarde' },
  { value: 'dinner', label: 'Jantar' },
  { value: 'night_snack', label: 'Ceia' },
]

interface FoodItemForm {
  name: string
  carbs: string
  portion: string
}

export default function FoodPage() {
  const [items, setItems] = useState<FoodItemForm[]>([{ name: '', carbs: '', portion: '' }])
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [searchResults, setSearchResults] = useState<Array<{ name: string; carbs: number }>>([])

  const loadEntries = () => {
    const all = getFoodEntries()
    const sorted = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(sorted.slice(0, 50))
  }

  useEffect(() => {
    loadEntries()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const lastItem = items[items.length - 1]
      if (lastItem.name.length >= 2) {
        const results = searchFood(lastItem.name)
        setSearchResults(results.slice(0, 5))
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [items])

  const addItem = () => {
    setItems([...items, { name: '', carbs: '', portion: '' }])
    setSearchResults([])
  }

  const updateItem = (index: number, field: keyof FoodItemForm, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)

    if (field === 'name' && value.length >= 2) {
      const results = searchFood(value)
      setSearchResults(results.slice(0, 5))
    } else {
      setSearchResults([])
    }
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  const selectFood = (index: number, food: { name: string; carbs: number }) => {
    updateItem(index, 'name', food.name)
    updateItem(index, 'carbs', food.carbs.toString())
    setSearchResults([])
  }

  const calculateTotalCarbs = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.carbs) || 0), 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validItems = items
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        carbs: parseFloat(item.carbs) || 0,
        portion: item.portion.trim() || undefined,
      }))

    if (validItems.length === 0) {
      setAlert({ type: 'danger', message: 'Adicione pelo menos um alimento' })
      return
    }

    const totalCarbs = calculateTotalCarbs()

    saveFood({
      items: validItems,
      totalCarbs,
      timestamp: new Date().toISOString(),
      mealType,
      note: note.trim() || undefined,
    })

    setItems([{ name: '', carbs: '', portion: '' }])
    setNote('')
    setAlert({ type: 'success', message: `Refeição registrada! Total: ${totalCarbs}g de carboidratos` })
    loadEntries()

    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      deleteFoodEntry(id)
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
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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
          Alimentação
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Registre suas refeições e carboidratos
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
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
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
              Tipo de refeição
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
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
              {mealTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
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
              Alimentos
            </label>

            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', position: 'relative' }}>
                <div style={{ flex: 2 }}>
                  <Input
                    placeholder="Alimento"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                  {searchResults.length > 0 && index === items.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-xl)',
                        zIndex: 100,
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          onClick={() => selectFood(index, result)}
                          style={{
                            padding: 'var(--spacing-md)',
                            cursor: 'pointer',
                            borderBottom: i < searchResults.length - 1 ? '1px solid var(--color-border)' : 'none',
                            transition: 'background-color var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{result.name}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            {result.carbs}g de carboidratos
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder="Carbs (g)"
                    type="number"
                    min="0"
                    value={item.carbs}
                    onChange={(e) => updateItem(index, 'carbs', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder="Porção"
                    value={item.portion}
                    onChange={(e) => updateItem(index, 'portion', e.target.value)}
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-secondary)',
                      fontSize: '20px',
                      padding: 'var(--spacing-sm)',
                      opacity: 0.6,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <Button type="button" variant="secondary" onClick={addItem} size="sm" style={{ marginTop: 'var(--spacing-sm)' }}>
              + Adicionar alimento
            </Button>
          </div>

          {/* Total Display */}
          <div
            style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-xl)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--color-border)',
            }}
          >
            <span
              style={{
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                letterSpacing: 'var(--letter-spacing-wide)',
                textTransform: 'uppercase',
              }}
            >
              Total de carboidratos
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-display)',
                textShadow: 'var(--shadow-glow-primary)',
              }}
            >
              {calculateTotalCarbs()}g
            </span>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <Input
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Restaurante japonês"
              multiline
            />
          </div>

          <Button type="submit" variant="primary" glow style={{ width: '100%' }}>
            Registrar Refeição
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
          <Card key={entry.id} style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  <Badge variant="neutral" size="sm">
                    {mealTypeOptions.find((m) => m.value === entry.mealType)?.label}
                  </Badge>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  {entry.items.map((i) => i.name).join(', ')}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--font-size-lg)',
                    }}
                  >
                    {entry.totalCarbs}g
                  </span>{' '}
                  de carboidratos
                </div>
                {entry.note && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                      marginTop: 'var(--spacing-sm)',
                    }}
                  >
                    {entry.note}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '20px',
                  padding: 'var(--spacing-xs)',
                  opacity: 0.6,
                  transition: 'all var(--transition-fast)',
                }}
              >
                ×
              </button>
            </div>
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
              ◎
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
              }}
            >
              Nenhum registro de refeições.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}