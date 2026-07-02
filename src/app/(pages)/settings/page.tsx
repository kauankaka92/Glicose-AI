'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert } from '@/components/UI'
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

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleChange = (key: keyof UserSettings, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setSettings((prev) => ({ ...prev, [key]: numValue }))
    }
  }

  const handleSave = () => {
    saveSettings(settings)
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
      setAlert({ type: 'success', message: 'Dados importados com sucesso! Recarregue a página.' })
      setImportText('')
    } else {
      setAlert({ type: 'danger', message: 'Dados inválidos. Verifique o formato do backup.' })
    }
    setTimeout(() => setAlert(null), 3000)
  }

  const handleClearAll = () => {
    if (confirm('TEM CERTEZA? Isso apagará TODOS os dados permanentemente!')) {
      clearAllData()
      setAlert({ type: 'success', message: 'Todos os dados foram apagados. Recarregue a página.' })
      setTimeout(() => setAlert(null), 3000)
    }
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
        Ajustes
      </h1>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
          Configurações de Insulina
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Glicose Alvo (mg/dL)"
            type="number"
            value={settings.targetGlucose.toString()}
            onChange={(e) => handleChange('targetGlucose', e.target.value)}
          />

          <Input
            label="Fator de Correção (mg/dL por unidade)"
            type="number"
            value={settings.correctionFactor.toString()}
            onChange={(e) => handleChange('correctionFactor', e.target.value)}
          />

          <Input
            label="Relação Insulina:Carbo (1U para Xg)"
            type="number"
            value={settings.carbRatio.toString()}
            onChange={(e) => handleChange('carbRatio', e.target.value)}
          />

          <Input
            label="Tempo de Ação da Insulina (horas)"
            type="number"
            value={settings.activeInsulinTime.toString()}
            onChange={(e) => handleChange('activeInsulinTime', e.target.value)}
          />
        </div>

        <Button onClick={handleSave} style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}>
          Salvar Configurações
        </Button>
      </Card>

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
          Backup e Restauração
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Button onClick={handleExport} variant="secondary">
            Exportar Dados (Download)
          </Button>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
            >
              Importar Dados (Cole o JSON do backup)
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole aqui o conteúdo do arquivo de backup..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
            <Button onClick={handleImport} variant="secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
              Importar Dados
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)', color: 'var(--color-danger)' }}>
          Zona de Perigo
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Esta ação não pode ser desfeita. Todos os dados de glicose, alimentação e insulina serão permanentemente apagados.
          </p>

          <Button onClick={handleClearAll} variant="danger">
            Apagar Todos os Dados
          </Button>
        </div>
      </Card>

      <Card style={{ marginTop: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Sobre
        </h2>

        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <div><strong>Glicose AI</strong> v4.0.0</div>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            Sistema de monitoramento de glicose com processamento de linguagem natural.
          </div>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            Os dados são armazenados localmente no seu navegador.
          </div>
        </div>
      </Card>
    </div>
  )
}