# Backend - Dogecoin only

Estrutura mínima pronta para deploy. Conteúdos principais:
- `server.js` (corrigido)
- Rotas: /api/auth, /api/session, /api/admin, /api/crypto
- DB: SQLite em `db/database.sqlite`

**Notas importantes**
- Este exemplo usa senhas em texto plano (apenas para demonstração). Para produção, usa bcrypt e JWT.
- Conversão steps -> DOGE usa uma taxa fixa placeholder (STEPS_PER_DOGE em controllers/cryptoController.js).
- Para deploy no Render, assegura que o `start` script em package.json é `node server.js`.
