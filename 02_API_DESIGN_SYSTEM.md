
DESIGN DE API

FORMATO PADRÃO:
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}

REGRAS:
- Nunca retornar strings soltas
- Nunca retornar dados sem estrutura
- Sempre incluir timestamp em dados clínicos
- Validar todos inputs

ROTAS:

/api/glucose
- POST cria leitura
- GET lista leituras

/api/food
- POST registra refeição

/api/ai
- interpreta linguagem natural

/api/insulin
- calcula dose baseada em config do usuário

/api/sync
- sincronização futura
