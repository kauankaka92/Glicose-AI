# Como Corrigir o Cache do Navegador

## Problema
Se você está vendo:
- Respostas terminando em `.undefined`
- Cálculos usando `50` em vez de `40` no correctionFactor
- Configurações antigas sendo usadas

Isso é causado pelo **cache do navegador** que ainda está carregando código antigo.

## Solução

### Método 1: Hard Refresh (Recomendado)
1. Na página do chat, pressione:
   - **Windows/Linux**: `Ctrl + Shift + R` ou `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`

### Método 2: Limpar Cache Completo
1. Pressione `F12` para abrir DevTools
2. Vá para a aba **Application**
3. Clique em **Clear storage** no menu esquerdo
4. Clique em **Clear site data**
5. Recarregue a página

### Método 3: Navegação Anônima
1. Abra uma janela anônima/privada
2. Acesse `https://glicose-ai-drab.vercel.app`
3. Teste o chat

## Como Verificar se Funcionou

1. Abra o console do navegador (F12)
2. Digite no chat: "QUANTAS UNIDADES PARA 500?"
3. Verifique no console as logs:
   ```
   [CHAT] Sending settings to API: {correctionFactor: 40, ...}
   ```
4. A resposta deve ser:
   ```
   Para 500 mg/dL: (500 - 100) / 40 = 10U de correção.
   ```
   - **Sem** `.undefined` no final
   - **Com** 40 (teu fator) em vez de 50

## URLs

- **Produção**: https://glicose-ai-drab.vercel.app
- **Preview (antigo, não use)**: https://glicose-ai-drab-leitekauan538-2799s-projects.vercel.app

## Notas

- O Next.js usa cache agressivo para performance
- Cada deploy gera novos hashes de JavaScript
- Hard refresh força o navegador a baixar a versão mais recente
- Após o hard refresh, o chat vai usar tuas settings salvas (correctionFactor: 40)