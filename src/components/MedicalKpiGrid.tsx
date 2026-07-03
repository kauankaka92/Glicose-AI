'use client'

import React from 'react'
import { SpriteIcon } from './IconSystem'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  icon: 'glucometer' | 'insulin' | 'food' | 'graphs'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  description?: string
}

export function KpiCard({
  title,
  value,
  unit,
  icon,
  trend = 'neutral',
  trendValue,
  description,
}: KpiCardProps) {
  return (
    <article className="kpi-card" role="region" aria-labelledby={`kpi-${icon}-label`}>
      <header className="kpi-card__header">
        <div className="kpi-card__icon">
          <SpriteIcon name={icon} size={24} aria-hidden="true" />
        </div>
        {trendValue && (
          <span className={`kpi-card__trend kpi-card__trend--${trend}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </header>

      <div className="kpi-card__body">
        <h3 id={`kpi-${icon}-label`} className="kpi-card__title">
          {title}
        </h3>
        <p className="kpi-card__value">
          {value}
          {unit && <span className="kpi-card__unit">{unit}</span>}
        </p>
        {description && <p className="kpi-card__description">{description}</p>}
      </div>
    </article>
  )
}

export function MedicalKpiGrid() {
  return (
    <div className="kpi-grid">
      <KpiCard
        title="Glicemia Atual"
        value={112}
        unit="mg/dL"
        icon="glucometer"
        trend="neutral"
        trendValue="Estável"
        description="Última: 30 min atrás"
      />
      <KpiCard
        title="Insulina Aplicada"
        value={8.5}
        unit="U"
        icon="insulin"
        trend="up"
        trendValue="+12%"
        description="Hoje às 08:30"
      />
      <KpiCard
        title="Carboidratos"
        value={145}
        unit="g"
        icon="food"
        trend="down"
        trendValue="-8%"
        description="Meta: 150g/dia"
      />
      <KpiCard
        title="Média 7 dias"
        value={108}
        unit="mg/dL"
        icon="graphs"
        trend="up"
        trendValue="+3%"
        description="Variação: 92-128 mg/dL"
      />
    </div>
  )
}