# Design System — Glicose AI v4

## Visão Geral

**Nome:** Bio-Tech Minimal  
**Inspiração:** Dispositivos médicos de precisão + laboratórios de biotecnologia + visualização de dados científicos

Uma estética que une precisão técnica com elegância biomédica. O design evoca equipmentos de monitoramento clínico de alta precisão, com elementos que sugerem bioluminescência e dados em tempo real.

---

## Paleta de Cores

### Primary
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#00ff9d` | Ações principais, dados normais |
| `--color-primary-hover` | `#00e68e` | Hover states |
| `--color-primary-light` | `rgba(0, 255, 157, 0.06)` | Backgrounds sutis |
| `--color-primary-glow` | `rgba(0, 255, 157, 0.4)` | Efeitos de brilho |

### Accent
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-accent` | `#ff6b8e` | Contraste quente, estados críticos |
| `--color-accent-light` | `rgba(255, 107, 142, 0.06)` | Backgrounds sutis |

### Data Visualization
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-data-purple` | `#7b61ff` | Dados secundários |
| `--color-data-cyan` | `#00d4ff` | Gradientes, dados terciários |
| `--color-data-amber` | `#ffb86b` | Warnings, dados de atenção |

### Status
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-success` | `#00ff9d` | Glicose normal, sucesso |
| `--color-warning` | `#ffb86b` | Glicose alta/baixa |
| `--color-danger` | `#ff6b8e` | Crítico, erro |
| `--color-critical` | `#ff4757` | Emergência |

### Background (Dark Mode OLED)
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#0d0d12` | Background principal |
| `--color-bg-elevated` | `#15151e` | Cards, superfícies |
| `--color-bg-secondary` | `#1e1e2a` | Inputs, superfícies secundárias |
| `--color-bg-tertiary` | `#252532` | Elementos interativos |
| `--color-bg-contrast` | `#0a0a0f` | Contraste máximo |

### Text
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-text` | `#fafafc` | Texto principal |
| `--color-text-primary` | `#ffffff` | Títulos, ênfase |
| `--color-text-secondary` | `#9494a3` | Texto de apoio |
| `--color-text-tertiary` | `#5f5f6e` | Texto desabilitado |

---

## Tipografia

### Fontes
```css
--font-display: 'Space Grotesk'  /* Títulos, dados grandes */
--font-family: 'Inter'           /* Corpo de texto */
--font-mono: 'JetBrains Mono'    /* Valores numéricos */
```

### Escala Tipográfica
| Token | Valor | Uso |
|-------|-------|-----|
| `--font-size-xs` | 0.6875rem (11px) | Labels, badges |
| `--font-size-sm` | 0.8125rem (13px) | Texto secundário |
| `--font-size-base` | 0.9375rem (15px) | Corpo de texto |
| `--font-size-lg` | 1.125rem (18px) | Subtítulos |
| `--font-size-xl` | 1.375rem (22px) | Títulos secundários |
| `--font-size-2xl` | 1.75rem (28px) | Títulos de seção |
| `--font-size-3xl` | 2.25rem (36px) | Hero, estatísticas |
| `--font-size-4xl` | 3rem (48px) | Display |
| `--font-size-5xl` | 4rem (64px) | Hero grande |

### Espaçamento de Texto
```css
--letter-spacing-tight: -0.03em   /* Títulos grandes */
--letter-spacing-base: -0.01em    /* Texto normal */
--letter-spacing-wide: 0.02em     /* Labels em uppercase */
--letter-spacing-mono: 0          /* Números */
```

---

## Espaçamento

Grid de 4px consistente:

| Token | Valor |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 12px |
| `--spacing-lg` | 16px |
| `--spacing-xl` | 20px |
| `--spacing-2xl` | 28px |
| `--spacing-3xl` | 36px |
| `--spacing-4xl` | 48px |
| `--spacing-5xl` | 64px |
| `--spacing-6xl` | 96px |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-xs` | 4px | Elementos pequenos |
| `--radius-sm` | 6px | Inputs pequenos |
| `--radius-md` | 10px | Botões, inputs |
| `--radius-lg` | 14px | Cards pequenos |
| `--radius-xl` | 18px | Cards principais |
| `--radius-2xl` | 24px | Modais grandes |
| `--radius-3xl` | 32px | Hero sections |
| `--radius-full` | 9999px | Badges, pills |

---

## Sombras

### Shadows Base
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4)
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5)
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5)
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.55)
--shadow-2xl: 0 24px 80px rgba(0, 0, 0, 0.6)
```

### Glow Effects (Biométrico)
```css
--shadow-glow-primary: 0 0 32px rgba(0, 255, 157, 0.25)
--shadow-glow-accent: 0 0 32px rgba(255, 107, 142, 0.25)
--shadow-glow-warning: 0 0 32px rgba(255, 184, 107, 0.2)
--shadow-glow-danger: 0 0 32px rgba(255, 107, 142, 0.3)
```

---

## Animações

### Durações
```css
--transition-fast: 100ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Keyframes

#### Biometric Pulse (Assinatura)
```css
@keyframes biometric-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  30% { transform: scale(1.05); opacity: 0.8; }
  60% { transform: scale(0.98); opacity: 1; }
}
```

#### Glow Pulse
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 24px rgba(0, 255, 157, 0.2); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 157, 0.4); }
}
```

#### Float (Ambient)
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

#### Shimmer (Loading)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## Elementos Assinatura

### Grid Pattern
Linhas de grade ultra-finas (1px a 2% opacity) em intervalos de 20-40px criam uma sensação de precisão técnica.

### Glow Biométrico
Elementos de dados importantes possuem um glow sutil que "pulsa" como um sinal vital.

### Glassmorphism Dark
```css
--glass-bg: rgba(21, 21, 30, 0.7)
--glass-blur: blur(20px) saturate(140%)
--glass-border: rgba(255, 255, 255, 0.06)
```

### Iconografia
Símbolos geométricos minimalistas:
- ◈ Dados/Hub
- ◐ IA/Sistema
- ◉ Registro/Ponto
- ◎ Alimentação/Ciclo
- ⚙ Configurações
- ▤ Gráficos/Dados

---

## Padrões de Layout

### Cards
- Background: `--color-bg-elevated`
- Border: `1px solid --color-border-subtle`
- Radius: `--radius-xl` (18px)
- Padding: `--spacing-xl` (20px)
- Sombra: `--shadow-sm`

### Hero Section
- Centralizado verticalmente
- Fonte display: Space Grotesk
- Gradiente no texto
- Glow animado no elemento principal

### Estatísticas
- Fonte: Space Grotesk para números
- Letter-spacing negativo: `-0.04em`
- Glow colorido conforme status

### Navegação Mobile
- Glassmorphism com blur
- Ícones + labels curtos
- Active state com primary light bg

---

## Princípios de Design

1. **Precisão Técnica** — Cada elemento serve uma função, sem decoração desnecessária

2. **Bio-Luminescência** — Cores de glow evocam reações enzimáticas e sinais vitais

3. **Dark Mode OLED** — Preto profundo economiza energia e destaca elementos importantes

4. **Dados em Primeiro Lugar** — Tipografia de dados é grande, legível, memorável

5. **Movimento Significativo** — Animações simulam呼吸 (breathing) e batimentos

6. **Contraste Acessível** — Todas as combinações passam WCAG AA mínimo

---

## Uso de Cores por Contexto

| Contexto | Cor Primária | Glow |
|----------|--------------|------|
| Glicose normal (70-180) | `#00ff9d` | Verde |
| Glicose alta (>180) | `#ffb86b` | Âmbar |
| Glicose baixa (<70) | `#ff6b8e` | Rosa/Vermelho |
| Ações principais | `#00ff9d` | Verde |
| Erros/Crítico | `#ff4757` | Vermelho |
| Dados secundários | `#7b61ff` | Roxo |
| Dados terciários | `#00d4ff` | Ciano |

---

##作弊 Sheet Rápido

```css
/* Card com glow biométrico */
.card-glow {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glow-primary);
  animation: biometric-pulse 3s infinite;
}

/* Texto gradiente hero */
.text-gradient-hero {
  background: var(--color-primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Badge de status */
.badge-status {
  padding: 6px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge-success { background: var(--color-success-light); color: var(--color-success); }
.badge-warning { background: var(--color-warning-light); color: var(--color-warning); }
.badge-danger { background: var(--color-danger-light); color: var(--color-danger); }

/* Input focado */
.input-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

---

*Última atualização: 2026-07-02*  
*Versão: 4.0 — Bio-Tech Minimal*