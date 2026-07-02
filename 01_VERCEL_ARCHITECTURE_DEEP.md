
ARQUITETURA PROFISSIONAL VERCEL

DEPLOY FINAL:
- Frontend: Next.js ou PWA estático
- Backend: Vercel Serverless Functions (/api)
- Integração IA: endpoint dedicado /api/ai
- Storage: LocalStorage + opcional DB futura (Postgres/Vercel KV)

REGRAS DE PRODUÇÃO:

1. TODA API deve ser stateless
2. Nenhuma rota pode depender de memória local
3. Respostas devem ser JSON mínimo e consistente
4. Latência máxima aceitável: 200ms (sem IA)
5. IA: até 2s com fallback obrigatório

ESTRUTURA:
/
  /api
  /public
  /lib
  /components
  /styles

CADA CAMADA TEM RESPONSABILIDADE ÚNICA
