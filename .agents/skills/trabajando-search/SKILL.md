---
name: trabajando-search
version: 1.0.0
description: >
  Use this skill to search job offers on Trabajando.com Chile (trabajando.cl), a major
  Chilean job board with many retail, professional and regional postings. Trigger
  phrases: find jobs in Chile, job search Chile, Trabajando.com, buscar trabajo, ofertas
  de trabajo, ofertas de empleo, empleos en la Región Metropolitana, vacantes, trabajo
  en regiones.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/trabajando-search/cli/src/cli.ts *)
---

# Trabajando.com — búsqueda de empleos (Chile)

Busca ofertas vigentes en **Trabajando.com** (https://www.trabajando.cl) sin autenticación ni API key, con **cero
dependencias de ejecución** (sólo `bun`). Fuente de datos: API JSON que usa el propio buscador del portal (`/api/searchjob`, `/api/ofertas/<id>`).

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
bun run .agents/skills/trabajando-search/cli/src/cli.ts search [flags]
```

| Flag | Descripción |
|------|-------------|
| `--query`, `-q` | Palabras clave. Opcional, recomendado. Para filtrar por comuna, inclúyala aquí (`"bodega puente alto"`). |
| `--location`, `-l` | **Región**: `Metropolitana` (`RM`, `Santiago`), `Valparaíso`, `Biobío`, `Antofagasta`, `Coquimbo`, `Maule`, `Los Lagos`, `Ñuble`... (o el id numérico de la API). Una comuna devuelve `BAD_LOCATION` con una pista. |
| `--jobage <días>` | Antigüedad máxima (en el cliente; la API ordena por fecha, más nuevas primero). |
| `--page <n>` | Página, 15 resultados por página. |
| `--limit`, `-n` | Máximo de resultados (en el cliente). |
| `--format` | `json` (por defecto), `table`, `plain`. |

### Detalle de una oferta

```bash
bun run .agents/skills/trabajando-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Acepta el `id` que devuelve `search` o la URL del aviso. Devuelve título, empresa, ubicación,
fecha de publicación (`date`), fecha de cierre (`deadline`, si existe), renta publicada
(`salary`), jornada/contrato (`employmentType`), área (`category`) y la descripción completa.

## Ejemplos

```bash
# Jefaturas de tienda en la RM, últimos 14 días
bun run .agents/skills/trabajando-search/cli/src/cli.ts search -q "jefe de tienda" -l "RM" --jobage 14 --format table

# Bodega en Puente Alto (la comuna va en la consulta)
bun run .agents/skills/trabajando-search/cli/src/cli.ts search -q "bodega puente alto" -l "Metropolitana" --format table

# Supervisión de operaciones en Antofagasta
bun run .agents/skills/trabajando-search/cli/src/cli.ts search -q "supervisor de operaciones" -l "Antofagasta" --format table

# Detalle (id o URL /trabajo/<id>-...)
bun run .agents/skills/trabajando-search/cli/src/cli.ts detail 6137907 --format plain
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

- La salida JSON de `search` agrega `meta.total` y `meta.pages` (totales de la API) y por resultado `workday` (jornada: Jornada Completa, Part Time, Por Turnos...), `featured` y `snippet`.
- `detail` combina la descripción, los **requisitos mínimos**, años de experiencia y nivel académico, y entrega `deadline` (fecha de expiración). Si la oferta postula en un sitio externo, `externalApplyUrl` trae ese enlace; `status` refleja el estado (`PUBLICADA`).
- La renta sólo aparece si la empresa decidió mostrarla (`mostrarSueldo`); el portal no indica si es líquida o bruta.
- Ofertas confidenciales aparecen como `company: "Confidencial"`.
- Reintentos con backoff exponencial ante 429/5xx (máx. 6). Un 404 en `detail` se informa como `NOT_FOUND`.
- Si el portal cambia su HTML/API, los anclajes de parseo están en `url-reference.md`; `/scrape health` detecta un parser degradado.
