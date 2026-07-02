# Glicose AI - Documentação Completa

> **Versão:** 4.0 - Bio-Tech Minimal  
> **Última atualização:** 2026-07-02  
> **Repositório:** [kauankaka92/Glicose-AI](https://github.com/kauankaka92/Glicose-AI)  
> **Deploy:** Vercel (região iad1)

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Objetivo](#objetivo)
3. [Funcionalidades](#funcionalidades)
4. [Fluxo de Execução](#fluxo-de-execução)
5. [Regras de Negócio](#regras-de-negócio)
6. [Arquitetura](#arquitetura)
7. [Tecnologias Usadas](#tecnologias-usadas)
8. [Estrutura de Pastas](#estrutura-de-pastas)
9. [APIs e Endpoints](#apis-e-endpoints)
10. [Exemplos de Uso](#exemplos-de-uso)
11. [Variáveis de Ambiente](#variáveis-de-ambiente)
12. [Configurações](#configurações)
13. [Dependências](#dependências)
14. [Erros Comuns e Soluções](#erros-comuns-e-soluções)
15. [Instalação e Execução](#instalação-e-execução)
16. [Manutenção](#manutenção)
17. [Estado Atual](#estado-atual)
18. [Próximos Passos](#próximos-passos)

---

## Visão Geral

O **Glicose AI** é um sistema completo de monitoramento de glicose com processamento de linguagem natural. O sistema permite que usuários registrem medições de glicose, refeições e doses de insulina através de texto em linguagem natural (Português), interpretado por uma IA que extrai dados clínicos e atualiza automaticamente a interface.

**Diferencial:** Ao invés de formulários tradicionais, o usuário conversa naturalmente com o sistema e os dados são automaticamente estruturados e registrados.

---

## Objetivo

Proporcionar uma experiência simplificada de monitoramento glicêmico através de:

- **Registro conversacional:** Digite "minha glicose estava 250 antes do almoço, comi arroz e feijão" e o sistema registra tudo automaticamente
- **Cálculo automático de insulina:** Quando a glicose ultrapassa 150 mg/dL, o sistema sugere dose de correção baseada nas configurações pessoais
- **Design Bio-Tech Minimal:** Interface inspirada em dispositivos médicos de precisão, com estética bioluminescente e Dark Mode OLED
- **100% client-side:** Dados persistentes no LocalStorage do navegador, sem necessidade de backend

---

## Funcionalidades

### Dashboard
- Visão geral das métricas de glicose (atual, média, mín, máx)
- Cards de status com cores dinâmicas (verde/ambar/rosa berdasarkan status)
- Insulinas sugeridas e aplicadas
- Acesso rápido a todas as seções

### Chat IA (Motor de Dados)
- **Stream de Eventos Clínicos:** Uma única mensagem pode gerar múltiplos registros (glicoses, refeições, insulinas)
- **Detecção de múltiplas glicoses:** "Acordei 267, depois do café 324, antes do almoço 183" → 3 registros
- **Extração de alimentos:** Identifica 40+ alimentos em PT-BR e estima carboidratos
- **Insulina por refeição:** Formato "(X unidades de insulina)" após descrição da refeição cria evento separado
- **Respostas curtas:** Sem explicação de cálculos, apenas confirmação objetiva

### Glicose
- Registro manual de glicose com contexto (jejum, antes/depois de refeição, etc.)
- Validação: 20-600 mg/dL
- Inputs HTML nativos (sem focus loss)

### Alimentação
- Cadastro de refeições com estimativa automática de carboidratos
- Tabela interna com 40+ alimentos (arroz=28g, feijão=14g, banana=23g, etc.)
- Detecção de quantidades ("3 pedaços", "2 copos")

### Insulina
- Cálculo automático baseado em:
  - **Target:** 100 mg/dL (padrão)
  - **Fator de correção:** 50 mg/dL/U (padrão)
  - **Razão de carboidratos:** 10g/U (padrão)
- Fórmula: `correção = (glicose - target) / fator`
- Apenas registra doses >= 1.5U (arredondadas)

### Gráficos
- Evolução temporal de glicoses
- Distribuição por status (LOW, NORMAL, HIGH, CRITICAL)
- Tendências

### Ajustes
- Target de glicose
- Fator de correção
- Razão de carboidratos
- Tempo de insulina ativa
- Auto-save (500ms debounce)
- Exportar/Importar dados (JSON)

---

## Fluxo de Execução

### Fluxo Principal - Chat IA

```
┌─────────────────────┐
│  Mensagem do Usuário│
│  (linguagem natural)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  POST /api/chat                         │
│  MOTOR DE DADOS                         │
│                                         │
│  1. Extrai TODAS as glicoses (regex)    │
│  2. Extrai TODAS as refeições           │
│  3. Extrai insulinas de parênteses      │
│  4. Calcula insulina (se glicose > 150) │
│  5. Cria STREAM de eventos              │
│  6. Salva no localStorage (client-side) │
│  7. Dispara glicose-data-changed        │
│  8. Retorna resposta curta              │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Frontend (chat/page.tsx)               │
│  - Recebe event + saved                 │
│  - Executa saveGlucose/SaveFood/saveInsulin
│  - Dispara evento custom event          │
│  - Atualiza UI                          │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Dashboard/Outras Páginas               │
│  - Ouve glicose-data-changed            │
│  - Lê localStorage                      │
│  - Re-renderiza                         │
└─────────────────────────────────────────┘
```

### Fluxo de Extração de Dados

**Exemplo de input complexo:**
```
No café da manhã eu consumi:
2 pães com manteiga
2 copos de café com leite (8 unidades de insulina)

No almoço eu consumi:
3 pedaços de frango cozido
300 ml de suco de pacote (5 unidades de insulina)

Depois do almoço comi:
1 banana envolta em açúcar puro (3 unidades de insulina)

Acordei 267. Depois do café 324. Antes do almoço 183.
```

**Stream de eventos gerado:**
```json
{
  "events": [
    {"type": "glucose_event", "value": 267, "context": "fasting", "order": 1},
    {"type": "glucose_event", "value": 324, "context": "breakfast", "order": 2},
    {"type": "glucose_event", "value": 183, "context": "before_meal", "order": 3},
    {"type": "food_event", "items": ["pao", "manteiga", "cafe", "leite"], "meal": "breakfast", "insulin": 8, "order": 4},
    {"type": "insulin_event", "dose": 8, "meal": "breakfast", "order": 5},
    {"type": "food_event", "items": ["frango", "suco"], "meal": "lunch", "insulin": 5, "order": 6},
    {"type": "insulin_event", "dose": 5, "meal": "lunch", "order": 7},
    {"type": "food_event", "items": ["banana", "acucar"], "meal": "snack", "insulin": 3, "order": 8},
    {"type": "insulin_event", "dose": 3, "meal": "snack", "order": 9}
  ]
}
```

---

## Regras de Negócio

### Glicose
- Valores válidos: **20-600 mg/dL**
- Contextos: `fasting`, `before_meal`, `after_meal`, `bedtime`, `night`, `exercise`, `other`
- Detecção por múltiplos patterns regex (ver seção de APIs)
- Ordenação por ordem de aparecimento no texto

### Alimentos
- **40+ alimentos catalogados** com tabela de carboidratos
- Exclusão de palavras não-alimento: "junto", "tudo", "isso", "nada", "mais", etc.
- Segmentação por marcadores: "café da manhã", "almoço", "jantar", "depois do almoço"
- Estimação: quantidade × base (ex: "3 pedaços de frango" = 3 × 5g = 15g)

### Insulina
- **Cálculo automático** quando glicose > 150 mg/dL
- **Bloqueio possível:** "não quero correção/insulina" ignora cálculo
- **Mínimo para registro:** 1.5U (arredonda para 2U)
- **Insulina por refeição:** Detectada no formato "(X unidades de insulina)"
- **Order field:** Associa insulina à glicose mais próxima anterior

### Respostas da IA
- **Máximo 5 linhas**
- **Sem explicação de cálculos internos**
- **Formato:** `✔ {n} glicose(s) registrada(s). Última: {valor} ({status}). Dose: {total}U.`

### Status da Glicose
| Valor (mg/dL) | Status | Cor |
|---------------|--------|-----|
| < 70 | LOW | Rosa/Vermelho |
| 70-180 | NORMAL | Verde |
| 181-300 | HIGH | Âmbar |
| > 300 | CRITICAL | Rosa glow |

---

## Arquitetura

### Stack Tecnológica
```
┌─────────────────────────────────────────┐
│           Next.js 14 App Router         │
│           TypeScript (strict)           │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│   Pages   │ │ API Routes│ │   Lib     │
│ (client)  │ │ (server)  │ │ (shared)  │
└───────────┘ └───────────┘ └───────────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   LocalStorage        │
        │   (browser)           │
        └───────────────────────┘
```

### Princípios Arquiteturais
1. **Stateless APIs:** Nenhuma rota depende de memória local
2. **Client-side storage:** Dados persistentes no navegador
3. **Event-driven UI:** Custom events (`glicose-data-changed`) disparam updates
4. **SSR-safe:** Verificação `typeof window === 'undefined'` em storage
5. **Serverless-first:** Deploy na Vercel com região iad1 (mais próxima do Brasil)

### Camadas
| Camada | Responsabilidade | Exemplo |
|--------|------------------|---------|
| Pages | UI, interação usuário | `chat/page.tsx` |
| API Routes | Processamento, validação | `/api/chat/route.ts` |
| Lib | Types, storage, utilities | `src/lib/storage.ts` |

---

## Tecnologias Usadas

### Core
- **Next.js 14.2** - Framework React com App Router
- **React 18.3** - UI library
- **TypeScript 5.4** - Tipagem estática (strict mode)

### Build/Runtime
- **SWC** - Compilador Rust (rápido)
- **Node.js 18+** - Runtime
- **Sharp** - Otimização de imagens

### Design System
- **Space Grotesk** - Fontes display/títulos
- **Inter** - Corpo de texto
- **JetBrains Mono** - Números/código
- **CSS custom properties** - Tokens de design

### IA
- **NVIDIA NIM API** - Llama 3.1 8B Instruct
- **Regex patterns** - Extração determinística

### Desenvolvimento
- **Vercel CLI** - Deploy
- **Git** - Versionamento
- **PWA** - Manifest + icons

---

## Estrutura de Pastas

```
C:\Glicose AI\
├── .env / .env.local              # Variáveis de ambiente (KEYS NVIDIA)
├── .gitignore                     # Ignore rules
├── next.config.js                 # Configuração Next.js
├── tsconfig.json                  # TypeScript paths
├── vercel.json                    # Deploy config (region, headers)
├── package.json                   # Dependencies
├── README.md                      # Quick start
├── DEPLOY.md                      # Guia de deploy
├── DESIGN.md                      # Design System completo
├── VERCEL_ENV.md                  # Vercel environment setup
│
├── public/
│   ├── manifest.json              # PWA config
│   ├── favicon.ico
│   └── icons/                     # Ícones PWA (192/512 SVG/PNG)
│
└── src/
    ├── app/
    │   ├── layout.tsx             # Root layout (fonts, metadata)
    │   ├── page.tsx               # Home (redirect /dashboard)
    │   ├── globals.css            # CSS tokens, animações
    │   │
    │   ├── (pages)/               # Páginas principais
    │   │   ├── layout.tsx         # Layout com navegação
    │   │   ├── dashboard/page.tsx
    │   │   ├── chat/page.tsx      # Chat IA (typewriter effect)
    │   │   ├── glucose/page.tsx
    │   │   ├── food/page.tsx
    │   │   ├── insulin/page.tsx
    │   │   ├── charts/page.tsx
    │   │   └── settings/page.tsx
    │   │
    │   └── api/                   # API Routes (serverless)
    │       ├── glucose/route.ts   # CRUD glicose
    │       ├── food/route.ts      # CRUD refeições
    │       ├── insulin/route.ts   # CRUD insulina
    │       ├── chat/route.ts      # MOTOR DE DADOS (IA)
    │       ├── ai-log/route.ts    # Auditoria de eventos
    │       ├── sync/route.ts      # Sync endpoint
    │       └── health/route.ts    # Health check
    │
    ├── components/
    │   ├── Layout.tsx             # Nav mobile, estrutura
    │   └── UI.tsx                 # Componentes reutilizáveis
    │                              # (Card, Button, Badge, Input)
    │
    └── lib/
        ├── types.ts               # Interfaces TypeScript
        ├── storage.ts             # LocalStorage wrappers
        ├── ai-engine.ts           # NLP patterns (fallback)
        ├── insights.ts            # Cálculos, estatísticas
        ├── chat-storage.ts        # Histórico do chat
        └── index.ts               # Barrel exports
```

---

## APIs e Endpoints

### `/api/glucose`

**GET** - Lista todas as medições
```json
{
  "success": true,
  "data": [{"id": "...", "value": 120, "timestamp": "...", "context": "fasting"}],
  "meta": {"count": 5},
  "error": null
}
```

**POST** - Salva nova medição
```json
{
  "value": 120,
  "timestamp": "2026-07-02T10:00:00Z",
  "context": "fasting",
  "note": "Ao acordar"
}
```

**DELETE** - Remove por ID
```
DELETE /api/glucose?id=abc123
```

---

### `/api/food`

**GET** - Lista todas as refeições
```json
{
  "success": true,
  "data": [{"id": "...", "items": [...], "totalCarbs": 45, "timestamp": "..."}]
}
```

**POST** - Salva refeição
```json
{
  "items": [{"name": "arroz", "carbs": 28}],
  "totalCarbs": 45,
  "mealType": "lunch"
}
```

---

### `/api/insulin`

**GET** - Lista doses de insulina
**POST** - Salva dose
```json
{
  "correction": 4,
  "meal": 2,
  "total": 6,
  "glucoseValue": 250,
  "carbsValue": 45
}
```

---

### `/api/chat` (MOTOR DE DADOS)

**POST** - Processa mensagem em linguagem natural

**Request:**
```json
{
  "message": "minha glicose estava 250 antes do almoço, comi arroz e feijão"
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "event_type": "user_input",
    "actions": ["save_glucose", "save_food", "calculate_dose"],
    "data": {
      "glucose": 250,
      "context": "before_meal",
      "meal": ["arroz", "feijao"],
      "carbs_estimate": 42
    },
    "insulin": {
      "correction": 3,
      "meal": 4,
      "total": 7
    },
    "stream": {
      "events": [...],
      "summary": "1 glicose(s), 1 refeic(oes)"
    }
  },
  "saved": {
    "glucose": {...},
    "food": {...},
    "insulin": {...}
  },
  "response": "✔ Glicose registrada: 250 (HIGH). Dose: 7U."
}
```

---

### `/api/ai-log`

**POST** - Log de auditoria de eventos da IA
```json
{
  "event": {...},
  "timestamp": "2026-07-02T10:00:00Z"
}
```

---

### `/api/health`

**GET** - Health check da aplicação
```json
{
  "status": "ok",
  "timestamp": "2026-07-02T10:00:00Z"
}
```

---

### `/api/sync`

**POST** - Sincronização (preparado para future cloud sync)

---

## Exemplos de Uso

### Exemplo 1: Registro simples de glicose
```
Usuário: "glicose 120 em jejum"
Resposta: "✔ Glicose registrada: 120 (NORMAL)."
```

### Exemplo 2: Refeição com insulina
```
Usuário: "almocei arroz e feijão (3 unidades)"
Resposta: "✔ Refeição salva: arroz, feijão. 42g de carboidratos."
```

### Exemplo 3: Múltiplos eventos
```
Usuário: "Acordei 267. Café: 2 pães (2U). Antes do almoço 183."
Resposta: "✔ 3 glicose(s) registrada(s). Última: 183 (NORMAL). Refeição: 2 pães."
```

### Exemplo 4: Cálculo de insulina
```
Usuário: "medi 500 antes do jantar"
Resposta: "✔ Glicose registrada: 500 (CRITICAL). Dose sugerida: 8U."
# Cálculo: (500 - 100) / 50 = 8U de correção
```

### Exemplo 5: Bloqueio de insulina
```
Usuário: "glicose 200, não quero correção"
Resposta: "✔ Glicose registrada: 200 (HIGH)."
# Insulina NÃO calculada devido ao bloqueio
```

---

## Variáveis de Ambiente

### Obrigatórias (CHAT IA)
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NVIDIA_NIM_API_KEY` | Chave da API NVIDIA NIM | `nvapi-...` |
| `NVIDIA_NIM_MODEL` | Modelo LLM | `meta/llama-3.1-8b-instruct` |

### Configuração na Vercel
1. Acesse **Vercel Dashboard** → Projeto "glicose-ai"
2. **Settings** → **Environment Variables**
3. Adicione ambas as variáveis para **Production, Preview, Development**
4. Faça **novo deploy** para aplicar

### .env.local (desenvolvimento)
```env
NVIDIA_NIM_API_KEY=nvapi-SEU_TOKEN_AQUI
NVIDIA_NIM_MODEL=meta/llama-3.1-8b-instruct
```

**Atenção:** `.env` e `.env.local` estão no `.gitignore` — **nunca commite chaves**.

---

## Configurações

### Padrões do Sistema
| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| `targetGlucose` | 100 mg/dL | Glicose alvo para cálculo |
| `correctionFactor` | 50 mg/dL/U | Quanto 1U reduz de glicose |
| `carbRatio` | 10 g/U | Quantos grams de carboidratos por 1U |
| `activeInsulinTime` | 4 horas | Tempo de insulina ativa |

### Localização
- **Idioma:** Português (PT-BR)
- **Fuso horário:** Determinado pelo navegador
- **Formato de data:** ISO 8601

### Performance
- **Latência alvo:** < 200ms (sem IA), < 2s (com IA)
- **Região Vercel:** `iad1` (Washington DC - mais próxima do Brasil)

---

## Dependências

### Runtime
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.4.0"
}
```

### Desenvolvimento
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "sharp": "^0.35.3"
}
```

### Instalação
```bash
npm install
```

---

## Erros Comuns e Soluções

### 1. "NVIDIA API Key not present"
**Causa:** Variável de ambiente não configurada na Vercel  
**Solução:**
1. Vá para **Vercel Dashboard** → Settings → Environment Variables
2. Adicione `NVIDIA_NIM_API_KEY`
3. Redeploy

### 2. Focus loss em inputs
**Causa histórica:** Component Input re-renderizava a cada keystroke  
**Solução (implementada):** Inputs HTML nativos (`<input>`) em todas as páginas de formulário

### 3. Chat não registra dados (fallback rule-based)
**Causa:** API key inválida ou expirada (401/403)  
**Solução:**
- Verifique log do console: `NVIDIA API Key present: true/false`
- Renove a chave em https://build.nvidia.com/
- Substitua no Vercel Dashboard

### 4. Dados não persistem após refresh
**Causa:** LocalStorage desabilitado ou em modo anônimo  
**Solução:** Use modo normal do navegador ou habilite LocalStorage

### 5. Build TypeScript falha
**Causa:** Tipos incompatíveis  
**Solução:**
```bash
npm run lint
# Corrija erros reportados
npm run build
```

### 6. PWA não instala
**Causa:** Icons ausentes ou manifest incorreto  
**Solução:**
- Verifique `public/icons/icon-192.png` e `icon-512.png`
- Rode `public/icons/generate-icons.html` para regenerar

---

## Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Git
- Conta Vercel (deploy)
- NVIDIA NIM API Key (chat IA)

### Desenvolvimento Local

```bash
# 1. Clonar repositório
git clone https://github.com/kauankaka92/Glicose-AI.git
cd Glicose-AI

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env .env.local
# Edite .env.local com sua NVIDIA_NIM_API_KEY

# 4. Rodar em desenvolvimento
npm run dev

# 5. Acessar
# http://localhost:3000
```

### Build de Produção Local

```bash
# Build estático
npm run build

# Rodar servidor de produção
npm start
```

### Deploy na Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Linkar projeto
vercel link

# 4. Deploy
vercel --prod
```

**Pós-deploy:**
1. Configure `NVIDIA_NIM_API_KEY` e `NVIDIA_NIM_MODEL` no Vercel Dashboard
2. Aguarde rebuild automático
3. Acesse URL do projeto

---

## Manutenção

### Rotina Semanal
- [ ] Verificar logs Vercel por erros
- [ ] Testar chat com inputs complexos
- [ ] Validar types: `npm run lint`

### Rotina Mensal
- [ ] Atualizar dependências: `npm update`
- [ ] Renovar API key NVIDIA (se expirar)
- [ ] Backup de dados (exportar JSON)

### Atualização de Dependências
```bash
# Verificar updates disponíveis
npm outdated

# Atualizar (cuidado com breaking changes)
npm update

# Major updates (revisar changelog)
npm install next@latest
```

### Monitoramento
- **Vercel Analytics:** Performance, Core Web Vitals
- **Console do navegador:** Debug logs `[MOTOR DE DADOS]`
- **API logs:** `vercel logs <deployment-url>`

---

## Estado Atual

### Funcionalidades Implementadas (v4.0)
- ✅ Dashboard com cards de status
- ✅ Chat IA com Stream de Eventos Clínicos
- ✅ Detecção de múltiplas glicoses em uma mensagem
- ✅ Extração de 40+ alimentos em PT-BR
- ✅ Insulina por refeição (parênteses)
- ✅ Cálculo automático de insulina (glicose > 150)
- ✅ Design System Bio-Tech Minimal completo
- ✅ Dark Mode OLED com glow effects
- ✅ PWA configurado
- ✅ Security headers
- ✅ Deploy Vercel (região iad1)
- ✅ TypeScript strict (0 erros)

### Últimos Commits (2026-07-02)
```
d3c5790 fix: usar order field para associar insulina com glicose correta
63390e8 fix: add insulin_event interface no frontend
41c7610 fix: extrair e salvar insulina de cada refeicao
3bb35c1 fix: captura de insulina explícita com logging detalhado
bc559bd fix: padrões de alimentos capturam texto após newlines duplos
```

### Bugs Conhecidos
- Nenhum em produção no momento

---

## Próximos Passos

### Backlog Prioritário
1. **Cloud Sync:** Sincronização com backend para multi-device
2. **Export PDF:** Relatório médico.periodico
3. **Notificações:** Lembretes de medição
4. **Gráficos avançados:** Curva de tendência, HbA1c estimada
5. **Multi-usuário:** Perfis para famílias
6. **Modo offline:** Service worker para cache completo

### Melhorias de UX
- [ ] Onboarding tutorial (primeiro uso)
- [ ] Valores de referência personalizáveis por contexto
- [ ] Histórico de conversas do chat
- [ ] Voice input (Web Speech API)

### Melhorias Técnicas
- [ ] testes unitários (Jest/Vitest)
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline
- [ ] Backup automático cloud (supabase)

---

## Licença e Contribuição

**Repositório:** https://github.com/kauankaka92/Glicose-AI  
**Tipo:** Projeto privado (convite necessário)

Para contribuir, entre em contato com o mantenedor.

---

## Contato e Suporte

- **GitHub Issues:** https://github.com/kauankaka92/Glicose-AI/issues
- **Vercel Dashboard:** https://vercel.com/dashboard

---

*Documento gerado em 2026-07-02 • Glicose AI v4.0*