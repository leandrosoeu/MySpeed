# MySpeed Fork — DownloadHistoryChart

## Arquivos modificados
- `server/controller/speedtests.js` — nova função `listAllDownloadHistory()`
- `server/routes/speedtests.js` — nova rota `GET /api/speedtests/history/download`
- `client/src/pages/Statistics/Statistics.jsx` — importa e renderiza o novo gráfico

## Arquivos novos
- `client/src/pages/Statistics/charts/DownloadHistoryChart/DownloadHistoryChart.jsx`
- `client/src/pages/Statistics/charts/DownloadHistoryChart/index.js`
- `client/src/pages/Statistics/charts/DownloadHistoryChart/styles.sass`

## Locales atualizados (14 idiomas)
Adicionadas as chaves:
- `statistics.history_all`
- `statistics.tests`
- `statistics.load_error`

## Como aplicar
Copie os arquivos deste ZIP para a raiz do seu repositório MySpeed, substituindo os existentes.
Depois:
```
bun run build
```
ou em dev:
```
bun run dev
```
