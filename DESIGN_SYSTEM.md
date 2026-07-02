# Glicose AI Design System

## Design Tokens

### Cores

#### Paleta Base (Escala 50-950)

```json
{
  "blue": {
    "50": "#eff6ff",
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
    "800": "#1e40af",
    "900": "#1e3a8a",
    "950": "#172554"
  },
  "green": {
    "50": "#f0fdf4",
    "100": "#dcfce7",
    "200": "#bbf7d0",
    "300": "#86efac",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
    "700": "#15803d",
    "800": "#166534",
    "900": "#14532d",
    "950": "#052e16"
  },
  "red": {
    "50": "#fef2f2",
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
    "800": "#991b1b",
    "900": "#7f1d1d",
    "950": "#450a0a"
  },
  "yellow": {
    "50": "#fffbeb",
    "100": "#fef3c7",
    "200": "#fde68a",
    "300": "#fcd34d",
    "400": "#fbbf24",
    "500": "#f59e0b",
    "600": "#d97706",
    "700": "#b45309",
    "800": "#92400e",
    "900": "#78350f",
    "950": "#451a03"
  },
  "gray": {
    "50": "#f9fafb",
    "100": "#f3f4f6",
    "200": "#e5e7eb",
    "300": "#d1d5db",
    "400": "#9ca3af",
    "500": "#6b7280",
    "600": "#4b5563",
    "700": "#374151",
    "800": "#1f2937",
    "900": "#111827",
    "950": "#030712"
  }
}
```

#### Cores Semânticas

| Token | Light Mode | Dark Mode | Uso |
|-------|------------|-----------|-----|
| `--color-primary` | #007aff | #0a84ff | Ações principais, links |
| `--color-success` | #34c759 | #30d158 | Status positivo, glicose normal |
| `--color-warning` | #ff9500 | #ffb800 | Alerts, glicose alta |
| `--color-danger` | #ff3b30 | #ff453a | Erros, glicose crítica |
| `--color-bg` | #ffffff | #000000 | Fundo principal |
| `--color-bg-secondary` | #f5f5f7 | #1c1c1e | Cards, superfícies |
| `--color-text` | #1d1d1f | #f5f5f7 | Texto primário |
| `--color-text-secondary` | #6e6e73 | #98989d | Texto secundário |

### Tipografia

#### Fontes

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

#### Escala de Tamanho

| Token | Valor | Uso |
|-------|-------|-----|
| `--text-xs` | 0.75rem (12px) | Legendas, badges |
| `--text-sm` | 0.875rem (14px) | Labels, botões small |
| `--text-base` | 1rem (16px) | Corpo de texto |
| `--text-lg` | 1.125rem (18px) | Títulos pequenos |
| `--text-xl` | 1.25rem (20px) | Títulos médios |
| `--text-2xl` | 1.5rem (24px) | Títulos grandes |
| `--text-3xl` | 1.875rem (30px) | Hero text |

#### Pesos

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaçamento

Base: 4px

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-xs` | 4px | Micro espaçamento |
| `--spacing-sm` | 8px | Elementos próximos |
| `--spacing-md` | 12px | Elementos relacionados |
| `--spacing-lg` | 16px | Seções |
| `--spacing-xl` | 20px | Seções maiores |
| `--spacing-2xl` | 28px | Layout gaps |
| `--spacing-3xl` | 36px | Hero sections |

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-xs` | 6px | Elementos pequenos |
| `--radius-sm` | 8px | Botões, inputs |
| `--radius-md` | 12px | Cards |
| `--radius-lg` | 16px | Containers |
| `--radius-xl` | 20px | Modais grandes |
| `--radius-2xl` | 24px | Hero containers |
| `--radius-full` | 9999px | Pills, avatares |

### Sombras

#### Light Mode

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.1);
```

#### Dark Mode

```css
--shadow-xs: none;
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.5);
```

## Componentes

### Átomos

#### Button

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}
```

**Uso:**
```tsx
<Button variant="primary" size="md">Salvar</Button>
<Button variant="secondary" size="sm">Cancelar</Button>
<Button variant="danger" size="lg" disabled>Excluir</Button>
```

#### Input

```tsx
interface InputProps {
  label?: string;
  error?: string;
  multiline?: boolean;
  disabled?: boolean;
}
```

**Uso:**
```tsx
<Input label="Glicose" type="number" placeholder="mg/dL" />
<Input label="Nota" multiline error="Campo obrigatório" />
```

#### Badge

```tsx
interface BadgeProps {
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

**Uso:**
```tsx
<Badge color="success">Normal</Badge>
<Badge color="warning" size="sm">Alto</Badge>
```

### Moléculas

#### Card

```tsx
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}
```

**Uso:**
```tsx
<Card title="Estatísticas">
  <p>Média: 120 mg/dL</p>
</Card>
```

#### Alert

```tsx
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  onClose?: () => void;
}
```

**Uso:**
```tsx
<Alert type="success" onClose={handleClose}>
  Glicose registrada com sucesso!
</Alert>
```

## Padrões de Design

### Hierarquia Visual

1. **Primário**: Títulos H1, botões de ação principal
2. **Secundário**: Títulos H2-H3, botões secundários
3. **Terciário**: Texto de apoio, labels

### Estados

- **Hover**: Opacity 0.9 + translateY(-1px)
- **Active**: Opacity 0.8
- **Disabled**: Opacity 0.5, cursor not-allowed
- **Focus**: Outline 2px primary + offset 2px

### Acessibilidade (WCAG 2.1 AA)

- **Contraste**: 4.5:1 texto normal, 3:1 texto grande
- **Focus**: Visível em todos elementos interativos
- **Keyboard**: Navegação completa via Tab
- **Screen Reader**: Labels semânticos em inputs

## Princípios de Design

### 1. Simplicidade
Menos é mais. Remova elementos desnecessários.

### 2. Consistência
Mesmo padrão, mesmo comportamento em todo lugar.

### 3. Acessibilidade
Inclusivo por padrão. WCAG 2.1 AA mínimo.

### 4. Performance
CSS mínimo, animações otimizadas, sem bloqueios.

### 5. Mobile-First
Design pensado para mobile, expandido para desktop.