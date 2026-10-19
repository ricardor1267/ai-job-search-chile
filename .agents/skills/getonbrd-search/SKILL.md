---
name: getonbrd-search
version: 1.0.0
description: >
  Use this skill to search tech and digital jobs (software, data, design, product,
  marketing, IT support) on Get on Board (getonbrd.com), the main tech job board in
  Chile and Latin America, including remote roles. Trigger phrases: tech jobs Chile,
  remote developer jobs LatAm, Get on Board, empleos tecnológicos, trabajo remoto,
  desarrollador, analista de datos, ofertas TI.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/getonbrd-search/cli/src/cli.ts *)
---

# Get on Board — búsqueda de empleos (Chile)

Busca ofertas vigentes en **Get on Board** (https://www.getonbrd.com) sin autenticación ni API key, con **cero
dependencias de ejecución** (sólo `bun`). Fuente de datos: API pública v0 (`/api/v0/search/jobs`, `/api/v0/companies/<slug>/jobs`).

## ⚠️ Sólo uso personal

Este CLI consulta páginas/servicios públicos del portal. Úselo para su propia búsqueda de
empleo: **volumen bajo**, sin uso comercial ni recolección masiva, respetando los términos del
portal y su robots.txt (revisado el 2026-10-19; ver `url-reference.md`). Bajo su propia
responsabilidad.

## Cuándo usarlo

- Buscar ofertas abiertas en Chile por cargo/palabra clave, ubicación y antigüedad.
- Obtener la descripción completa de una oferta puntual (`detail`).

## Comandos

### Buscar ofertas

```bash
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search [flags]
```

| Flag | Descripción |
|------|-------------|
| `--query`, `-q` | Palabras clave (cargo o tecnología). **Obligatorio.** |
| `--location`, `-l` | País de la oferta (`Chile`, `Perú`...) o `Remoto`. Filtro en el cliente sobre el campo `countries`. |
| `--jobage <días>` | Antigüedad máxima (en el cliente). |
| `--page <n>` | Página de la API (20 por página; 50 cuando hay filtros de cliente). |
| `--limit`, `-n` | Máximo de resultados (en el cliente). |
| `--format` | `json` (por defecto), `table`, `plain`. |

### Detalle de una oferta

```bash
bun run .agents/skills/getonbrd-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Acepta el `id` que devuelve `search` o la URL del aviso. Devuelve título, empresa, ubicación,
fecha de publicación (`date`), fecha de cierre (`deadline`, si existe), renta publicada
(`salary`), jornada/contrato (`employmentType`), área (`category`) y la descripción completa.

## Ejemplos

```bash
# Analistas de datos en Chile, últimos 14 días
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search -q "data analyst" -l "Chile" --jobage 14 --format table

# Desarrollo full stack remoto
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search -q "full stack" -l "Remoto" --format table

# Soporte TI
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search -q "soporte TI" --format table

# Detalle (id tipo slug o URL)
bun run .agents/skills/getonbrd-search/cli/src/cli.ts detail semi-senior-java-developer-etl-23people-remote-ebb4 --format plain
```

## Formato de salida

`search --format json` sigue el contrato común de los portales:

```json
{ "meta": { "count": 2, "page": 1 }, "results": [
  { "id": "...", "title": "...", "company": "...", "location": "...", "date": "YYYY-MM-DD", "url": "https://..." }
] }
```

Los valores ausentes son `null`, nunca se omiten. `date` es la fecha de publicación (ISO) o
`null` si el portal no la informa con precisión.

| Formato | Uso |
|---------|-----|
| `json` | Por defecto — uso programático, IDs para `detail` |
| `table` | Revisión rápida |
| `plain` | Lectura de una oferta completa (`detail`) |

Los errores se escriben en **stderr** como `{ "error": "...", "code": "..." }` con código de
salida `1` (p. ej. `UNKNOWN_FLAG`, `BAD_ARG`, `BAD_LOCATION`, `NO_QUERY`, `NOT_FOUND`).
Ningún flag desconocido se ignora en silencio.

## Notas

- Portal **orientado a tecnología**: para cargos de retail, logística u operaciones use los otros portales chilenos.
- Las rentas publicadas vienen en **USD mensuales** (`salary`, p. ej. `USD 2.000 - 2.200 mensual`), normalmente brutas.
- El endpoint `/api/v0/jobs/<id>` exige autenticación, así que `detail` lee la página pública para obtener la empresa y luego su listado público de ofertas. Si la oferta ya no aparece en ese listado devuelve `NOT_FOUND` (cerrada).
- `detail` une proyecto, funciones, requisitos, deseables y beneficios en `description`; no hay fecha de cierre (`deadline: null`).
- Campos extra: `salary`, `remote`, `category`.
- Reintentos con backoff exponencial ante 429/5xx (máx. 6). Un 404 en `detail` se informa como `NOT_FOUND`.
- Si el portal cambia su HTML/API, los anclajes de parseo están en `url-reference.md`; `/scrape health` detecta un parser degradado.
