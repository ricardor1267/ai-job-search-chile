---
name: computrabajo-search
version: 1.0.0
description: >
  Use this skill to search job offers on Computrabajo Chile (cl.computrabajo.com), a
  high-volume general job board covering every sector and comuna in Chile. Trigger
  phrases: find jobs in Chile, job search Chile, Computrabajo, buscar trabajo, ofertas
  de trabajo, empleos en Santiago, empleo por comuna, vacantes, trabajo en Maipú,
  trabajo en La Florida.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/computrabajo-search/cli/src/cli.ts *)
---

# Computrabajo Chile — búsqueda de empleos (Chile)

Busca ofertas vigentes en **Computrabajo Chile** (https://cl.computrabajo.com) sin autenticación ni API key, con **cero
dependencias de ejecución** (sólo `bun`). Fuente de datos: HTML público de búsqueda (`/trabajo-de-<consulta>-en-<lugar>`) y JSON-LD `JobPosting` (`@graph`) de cada oferta.

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
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search [flags]
```

| Flag | Descripción |
|------|-------------|
| `--query`, `-q` | Palabras clave. **Obligatorio** (las búsquedas del portal son páginas por palabra clave). |
| `--location`, `-l` | Región o comuna. Alias de región: `Región Metropolitana`, `RM`, `Santiago` → `rmetropolitana`; `Valparaíso`, `Biobío`, `Antofagasta`. Cualquier otro valor se usa como comuna: `Puente Alto`, `Maipú`, `La Florida`, `Las Condes`... |
| `--jobage <días>` | Antigüedad máxima, **filtrada en el cliente** (ver Notas). |
| `--page <n>` | Página, 20 resultados por página. |
| `--limit`, `-n` | Máximo de resultados (en el cliente). |
| `--format` | `json` (por defecto), `table`, `plain`. |

### Detalle de una oferta

```bash
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Acepta el `id` que devuelve `search` o la URL del aviso. Devuelve título, empresa, ubicación,
fecha de publicación (`date`), fecha de cierre (`deadline`, si existe), renta publicada
(`salary`), jornada/contrato (`employmentType`), área (`category`) y la descripción completa.

## Ejemplos

```bash
# Jefaturas de tienda en la Región Metropolitana, últimos 14 días
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "jefe de tienda" -l "Región Metropolitana" --jobage 14 --format table

# Supermercado en Puente Alto
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "supermercado" -l "Puente Alto" --format table

# Bodega en Maipú, página 2
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "jefe de bodega" -l "Maipú" --page 2 --format table

# Detalle (acepta el id hexadecimal o la URL)
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail F3EB77D92D1ED0DF61373E686DCF3405 --format plain
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

- **robots.txt del portal prohíbe sus parámetros de filtro** (`pubdate=`, `by=`, `sal=`, `cont=`, `emp=`...). El CLI nunca los envía: la antigüedad se filtra en el cliente sobre las fechas relativas de cada tarjeta ("Hace 4 horas", "Ayer", "Hace 2 días") y el orden es el del portal. Sólo usa `?p=` para paginar.
- "Hace más de 30 días" no tiene fecha exacta: queda como `date: null` y **no** se descarta con `--jobage` (las fechas desconocidas se conservan; evalúelas a mano).
- La fecha del listado refleja la última **actualización**; `detail` entrega el `datePosted` original, que puede ser bastante anterior. Ambas son reales: úselas para juzgar frescura.
- Algunas ofertas son **confidenciales** (`company: null`).
- Si el aviso publica renta, la búsqueda la trae en `salary` (texto del portal, p. ej. `$ 1.500.000,00 (Mensual)`) y `detail` la normaliza (`CLP 1.500.000 mensual`). No indica si es líquido o bruto: confírmelo con la empresa.
- Campos extra: `salary`, `featured`.
- Reintentos con backoff exponencial ante 429/5xx (máx. 6). Un 404 en `detail` se informa como `NOT_FOUND`.
- Si el portal cambia su HTML/API, los anclajes de parseo están en `url-reference.md`; `/scrape health` detecta un parser degradado.
