# Glicose AI

Sistema de monitoramento de glicose com processamento de linguagem natural.

## Funcionalidades

- **Dashboard**: Visão geral das métricas de glicose
- **Glicose**: Registrar e acompanhar medições
- **Alimentação**: Registrar refeições com cálculo de carboidratos
- **Insulina**: Calcular e registrar doses de insulina
- **Gráficos**: Evolução e distribuição de glicose
- **Ajustes**: Configurações pessoais e backup

## Tecnologias

- Next.js 14 App Router
- TypeScript
- LocalStorage
- PWA Ready
- Otimizado para Vercel

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar em produção
npm start
```

## Deploy na Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login e deploy
vercel login
vercel --prod
```

## Estrutura

```
src/
├── app/
│   ├── (pages)/         # Páginas principais
│   ├── api/             # API Routes
│   ├── layout.tsx       # Layout root
│   └── globals.css      # Estilos globais
├── components/          # Componentes React
├── lib/                 # Módulos core
│   ├── types.ts         # Tipos TypeScript
│   ├── storage.ts       # LocalStorage
│   ├── ai-engine.ts     # Processamento de linguagem natural
│   └── insights.ts      # Cálculos e insights
└── styles/              # Estilos
```

## API Endpoints

- `GET/POST /api/glucose` - Gerenciar medições de glicose
- `GET/POST /api/food` - Gerenciar refeições
- `GET/POST /api/insulin` - Gerenciar insulina
- `POST /api/ai` - Processar linguagem natural
- `GET /api/health` - Health check

## Armazenamento

Os dados são armazenados localmente no navegador usando LocalStorage. A sincronização com cloud pode ser implementada futuramente.

## Segurança

- Todas as operações sensíveis ocorrem no cliente
- Nenhuma chave de API é exposta no frontend
- Headers de segurança configurados

## License

MIT