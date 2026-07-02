# Guia de Deploy - Vercel

## Pré-requisitos

- Conta na Vercel
- Node.js 18+ instalado
- Git repository

## Deploy em 3 passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Linkar com Vercel

```bash
npm install -g vercel
vercel login
vercel link
```

### 3. Deploy

```bash
vercel --prod
```

## Ambiente Local

```bash
npm run dev
```

Acesse: http://localhost:3000

## Build de Produção Local

```bash
npm run build
npm run start
```

## Variáveis de Ambiente

Opcional: Configure na Vercel

- `AI_API_KEY`: Chave da API de IA (se usar NVIDIA NIM)

## Estrutura de Rotas

- `/dashboard` - Dashboard principal
- `/glucose` - Gerenciar glicose
- `/food` - Gerenciar alimentação
- `/insulin` - Gerenciar insulina
- `/charts` - Gráficos e estatísticas
- `/settings` - Configurações

## API Endpoints

- `GET/POST /api/glucose` - Listar/salvar glicose
- `GET/POST /api/food` - Listar/salvar alimentação
- `GET/POST /api/insulin` - Listar/salvar insulina
- `GET/POST /api/ai` - Processar linguagem natural
- `GET /api/health` - Health check

## Otimizações Vercel

- Edge Runtime automático
- Serverless Functions
- Cache automático
- Compressão habilitada
- Headers de segurança configurados