'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert } from '@/components/UI'
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
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: 'var(--spacing-xl)',
          textAlign: 'center',
        }}
      >
        Alimentação
      </h1>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <form onSubmit={handleSubmit}>
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
              Tipo de refeição
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
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
              {mealTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 10,
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          onClick={() => selectItem(index, result)}
                          style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            cursor: 'pointer',
                            borderBottom: i < searchResults.length - 1 ? '1px solid var(--color-border)' : 'none',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        >
                          <div style={{ fontWeight: 500 }}>{result.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeItem(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      fontSize: '1.25rem',
                      padding: 'var(--spacing-sm)',
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="secondary" onClick={addItem} size="sm" style={{ marginTop: 'var(--spacing-sm)' }}>
              + Adicionar alimento
            </Button>
          </div>

          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 500 }}>Total de carboidratos</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{calculateTotalCarbs()}g</span>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Restaurante japonês"
              multiline
            />
          </div>

          <Button type="submit" style={{ width: '100%' }}>
            Registrar Refeição
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
                  {mealTypeOptions.find((m) => m.value === entry.mealType)?.label} • {formatDateTime(entry.timestamp)}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                  {entry.items.map((i) => i.name).join(', ')}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{entry.totalCarbs}g</span> de carboidratos
                </div>
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
            Nenhum registro ainda. Adicione sua primeira refeição acima.
          </div>
        )}
      </div>
    </div>
  )
}

function selectItem(index: number, result: { name: string; carbs: number }) {
  const event = new CustomEvent('select-food', { detail: { index, result } })
  window.dispatchEvent(event)
}