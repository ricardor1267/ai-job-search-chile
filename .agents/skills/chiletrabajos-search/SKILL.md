---
name: chiletrabajos-search
version: 1.0.0
description: >
  Use this skill to search job postings on Chiletrabajos (chiletrabajos.cl), one of
  Chile's largest general job boards (retail, logistics, administration, operations,
  sales, services and more). Trigger phrases: find jobs in Chile, job search Chile,
  Chiletrabajos, buscar trabajo, ofertas de trabajo, ofertas de empleo, empleos en
  Santiago, vacantes, bolsa de trabajo, trabajo en Puente Alto.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts *)
---

# Chiletrabajos — búsqueda de empleos (Chile)

Busca ofertas vigentes en **Chiletrabajos** (https://www.chiletrabajos.cl) sin autenticación ni API key, con **cero
dependencias de ejecución** (sólo `bun`). Fuente de datos: HTML público del buscador (`/encuentra-un-empleo`) y JSON-LD `JobPosting` de cada aviso.

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
bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts search [flags]
```

| Flag | Descripción |
|------|-------------|
| `--query`, `-q` | Palabras clave (cargo, área, habilidad). Opcional, recomendado. |
| `--location`, `-l` | Ciudad/provincia del filtro del portal: `Santiago`, `Puente Alto`, `San Bernardo`, `Colina`, `Concepción`, `Valparaíso`, `Antofagasta`, `Temuco`, `Puerto Montt`... (también acepta el id numérico). Un valor desconocido devuelve error `BAD_LOCATION` con la lista válida. |
| `--jobage <días>` | Antigüedad máxima. Se envía el tramo del portal (`fecha`: hoy, 3, 6 días, semana, mes) y además se filtra la fecha exacta en el cliente. |
| `--page <n>` | Página, 30 resultados por página. |
| `--limit`, `-n` | Máximo de resultados (en el cliente). |
| `--format` | `json` (por defecto), `table`, `plain`. |

### Detalle de una oferta

```bash
bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Acepta el `id` que devuelve `search` o la URL del aviso. Devuelve título, empresa, ubicación,
fecha de publicación (`date`), fecha de cierre (`deadline`, si existe), renta publicada
(`salary`), jornada/contrato (`employmentType`), área (`category`) y la descripción completa.

## Ejemplos

```bash
# Jefaturas de tienda en Santiago, últimos 14 días
bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts search -q "jefe de tienda" -l "Santiago" --jobage 14 --format table

# Bodega en Puente Alto
bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts search -q "bodega" -l "Puente Alto" --format table

# Administración de local en Concepción
bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts search -q "administrador de local" -l "Concepción" --jobage 30 --format table

# Detalle completo de un aviso
bun run .agents/skills/chiletrabajos-search/cli/src/cli.ts detail 3888534 --format plain
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

- Los avisos **destacados** (pagados) aparecen primero y a veces no calzan con la búsqueda (p. ej. "garzón" al buscar "jefe de tienda"). Cada resultado trae `featured: true|false`; filtre por pertinencia antes de presentar.
- Los títulos del listado pueden venir truncados con "…"; `detail` entrega el título completo.
- El filtro de ubicación del portal es por **ciudad/provincia**: "Santiago" cubre buena parte de la RM; para una comuna puntual use la provincia (`Puente Alto` = Cordillera) o incluya la comuna en `--query`.
- `detail` lee el bloque JSON-LD `JobPosting` (título, empresa, fechas, descripción, `validThrough` como fecha de cierre) y la tabla de datos (Tipo, Duración del contrato).
- Campos extra en la salida: `snippet` (extracto) y `featured`.
- Reintentos con backoff exponencial ante 429/5xx (máx. 6). Un 404 en `detail` se informa como `NOT_FOUND`.
- Si el portal cambia su HTML/API, los anclajes de parseo están en `url-reference.md`; `/scrape health` detecta un parser degradado.
