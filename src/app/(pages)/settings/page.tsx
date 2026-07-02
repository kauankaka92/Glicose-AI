'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Alert, Toggle, Divider, Container } from '@/components/UI'
import { getSettings, saveSettings, exportData, importData, clearAllData } from '@/lib/storage'
import { UserSettings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    targetGlucose: 100,
    correctionFactor: 50,
    carbRatio: 10,
    activeInsulinTime: 4,
  })
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    const saved = getSettings()
    setSettings(saved)
    console.log('Settings carregadas:', saved)
  }, [])

  const handleChange = (key: keyof UserSettings, value: string) => {
    const numValue = parseFloat(value.replace(',', '.'))
    console.log(`Mudando ${key} para ${numValue}`)
    if (!isNaN(numValue) && numValue > 0) {
      setSaved(false)
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: numValue }
        console.log('Novo settings:', newSettings)
        // Auto-save após 800ms sem mudanças
        setTimeout(() => {
          saveSettings(newSettings)
          setSaved(true)
          console.log('Settings auto-saved:', newSettings)
        }, 800)
        return newSettings
      })
    }
  }

  const handleSave = () => {
    const updated = saveSettings(settings)
    console.log('Settings salvas manualmente:', updated)
    setSaved(true)
    setAlert({ type: 'success', message: 'Configurações salvas com sucesso!' })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glicose-ai-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setAlert({ type: 'success', message: 'Backup exportado com sucesso!' })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleImport = () => {
    if (!importText.trim()) {
      setAlert({ type: 'danger', message: 'Cole os dados do backup para importar' })
      return
    }

    const success = importData(importText)
    if (success) {
      setAlert({ type: 'success', message: 'Dados importados com sucesso!' })
      setSettings(getSettings())
      setShowImport(false)
      setImportText('')
    } else {
      setAlert({ type: 'danger', message: 'Falha ao importar dados. Verifique o formato.' })
    }
    setTimeout(() => setAlert(null), 3000)
  }

  const handleClear = () => {
    if (confirm('Tem certeza? Isso apagará TODOS os dados permanentemente.')) {
      if (confirm('Esta ação não pode ser desfeita. Continuar?')) {
        clearAllData()
        setAlert({ type: 'success', message: 'Todos os dados foram apagados.' })
        setTimeout(() => setAlert(null), 3000)
      }
    }
  }

  const settingItemStyle: React.CSSProperties = {
    marginBottom: 'var(--spacing-xl)',
    paddingBottom: 'var(--spacing-xl)',
    borderBottom: '1px solid var(--color-border)',
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
    letterSpacing: '-0.01em',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
    marginTop: '6px',
  }

  return (
    <Container maxWidth="600px">
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
          Ajustes
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Configure suas preferências
        </p>
      </div>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      {/* Treatment Settings */}
      <Card
        style={{
          marginBottom: 'var(--spacing-xl)',
          background: 'linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--spacing-lg)',
            letterSpacing: 'var(--letter-spacing-tight)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Tratamento
          {!saved && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', animation: 'pulse-glow 1s ease-in-out infinite' }}>
              Salvando...
            </span>
          )}
          {saved && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>
              ✓ Salvo
            </span>
          )}
        </h2>

        <div style={settingItemStyle}>
          <label style={labelStyle}>Glicose alvo (mg/dL)</label>
          <input
            type="number"
            value={settings.targetGlucose}
            onChange={(e) => handleChange('targetGlucose', e.target.value)}
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
          <div style={hintStyle}>Valor recomendado: 100 mg/dL</div>
        </div>

        <div style={settingItemStyle}>
          <label style={labelStyle}>Fator de correção (mg/dL por U)</label>
          <input
            type="number"
            value={settings.correctionFactor}
            onChange={(e) => handleChange('correctionFactor', e.target.value)}
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
          <div style={hintStyle}>Quanto 1U de insulina reduz sua glicose</div>
        </div>

        <div style={settingItemStyle}>
          <label style={labelStyle}>Proporção insulina:carbo (g por U)</label>
          <input
            type="number"
            value={settings.carbRatio}
            onChange={(e) => handleChange('carbRatio', e.target.value)}
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
          <div style={hintStyle}>Quantos gramas de carbo 1U cobre</div>
        </div>

        <div style={settingItemStyle}>
          <label style={labelStyle}>Tempo de insulina ativa (horas)</label>
          <input
            type="number"
            step="0.5"
            value={settings.activeInsulinTime}
            onChange={(e) => handleChange('activeInsulinTime', e.target.value)}
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
          <div style={hintStyle}>Duração do efeito da insulina</div>
        </div>

        <Button variant="primary" glow onClick={handleSave} style={{ width: '100%' }}>
          Salvar Configurações
        </Button>
      </Card>

      {/* Data Management */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
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
          Dados
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setShowExport(!showExport)
              setShowImport(false)
            }}
          >
            {showExport ? 'Cancelar' : 'Exportar Backup'}
          </Button>

          {showExport && (
            <div
              style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                Baixe todos os seus dados em formato JSON
              </p>
              <Button variant="primary" onClick={handleExport}>
                Download
              </Button>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              setShowImport(!showImport)
              setShowExport(false)
            }}
          >
            {showImport ? 'Cancelar' : 'Importar Backup'}
          </Button>

          {showImport && (
            <div
              style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                Cole os dados do backup JSON
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Cole aqui..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-mono)',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                <Button variant="primary" onClick={handleImport} style={{ flex: 1 }}>
                  Importar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card
        style={{
          border: '1px solid var(--color-danger)',
          background: 'linear-gradient(180deg, rgba(255, 107, 142, 0.05) 0%, rgba(255, 71, 87, 0.02) 100%)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            color: 'var(--color-danger)',
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--spacing-lg)',
            letterSpacing: 'var(--letter-spacing-tight)',
          }}
        >
          Zona de Perigo
        </h2>

        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          Ações destrutivas que não podem ser desfeitas
        </p>

        <Button
          variant="danger"
          onClick={handleClear}
          style={{ width: '100%' }}
        >
          Apagar Todos os Dados
        </Button>
      </Card>

      {/* Footer */}
      <div
        style={{
          marginTop: 'var(--spacing-3xl)',
          textAlign: 'center',
          padding: 'var(--spacing-xl)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          Glicose AI v4.0
        </p>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-tertiary)',
            marginTop: 'var(--spacing-xs)',
          }}
        >
          Bio-Tech Minimal Design System
        </p>
      </div>
    </Container>
  )
}