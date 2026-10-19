# getonbrd-cli

CLI del fork chileno para buscar ofertas en este portal. Ver `../SKILL.md` (uso y flags) y
`../url-reference.md` (endpoints y anclajes de parseo).

- **Dependencias de ejecución:** ninguna (`bun` + `fetch`). `bun install` sólo trae tipos para `typecheck`.
- **Comandos:** `search` y `detail <id|url>`; errores en stderr como `{ "error", "code" }`, exit 1.
- **Código compartido:** `src/core.ts` es idéntico en los cuatro CLIs chilenos
  (chiletrabajos, computrabajo, trabajando, getonbrd). Si lo modifica, cópielo a los demás;
  `tests/test_cl_portal_core_sync.py` falla si divergen.

## Tests

```bash
bun run typecheck
bun test                      # sin red: parsers y CLI contra fixtures reales capturadas
LIVE=1 bun test tests/live.test.ts   # prueba en vivo contra el portal (manual, volumen bajo)
```

Uso personal: mantenga un volumen bajo de consultas.
