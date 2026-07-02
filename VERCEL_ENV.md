# Configuração Vercel - Variáveis de Ambiente

## Problema
A IA não está conectando porque a chave da API NVIDIA não está configurada na Vercel.

## Solução

1. Acesse o painel da Vercel: https://vercel.com/dashboard
2. Vá para o projeto "glicose-ai-drab"
3. Clique em "Settings" → "Environment Variables"
4. Adicione a seguinte variável:
   - **Name**: `NVIDIA_NIM_API_KEY`
   - **Value**: `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`
   - **Environment**: Production, Preview, Development (marque todos)
5. Clique em "Save"
6. Faça um novo deploy para aplicar as mudanças

## URLs Úteis
- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Project: https://vercel.com/projects/glicose-ai-drab
- NVIDIA NIM API Docs: https://docs.nvidia.com/nim/

## Verificação

Após configurar, teste no chat:
- Digite: "minha glicose está 200"
- Verifique nos logs do console do navegador (F12) se aparece:
  - `NVIDIA API Key present: true`
  - `NVIDIA API Response status: 200`