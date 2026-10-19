#!/usr/bin/env bun
// trabajando-cli - search job offers on Trabajando.com Chile (www.trabajando.cl) via the JSON
// API its own search page uses. Self-contained: plain bun + fetch, zero runtime dependencies.
// Personal use only: keep volume low and respect the portal's terms and robots.txt.

import { checkKnownFlags, formatFlag, parseFlags, positiveInt, writeError } from "./core.js"
import { REGION_IDS, regionId } from "./helpers.js"
import { runSearch } from "./commands/search.js"
import { runDetail } from "./commands/detail.js"

const HELP = `trabajando-cli — busca ofertas en Trabajando.com (Chile)

USO
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

FLAGS DE BÚSQUEDA
  --query, -q <texto>     Palabras clave (cargo, área, habilidad). Recomendado.
  --location, -l <texto>  Región: "Metropolitana" (o "RM", "Santiago"), "Valparaíso",
                          "Biobío", "Antofagasta", "Los Lagos"... (o su id numérico).
                          El portal no filtra por comuna: incluya la comuna en --query.
  --jobage <días>         Publicadas hace N días como máximo (filtro en el cliente;
                          los resultados vienen ordenados por fecha, más nuevas primero).
  --page <n>              Página (15 resultados por página). Por defecto 1.
  --limit, -n <n>         Máximo de resultados a mostrar.
  --format <fmt>          json (por defecto) | table | plain.

EJEMPLOS
  bun run src/cli.ts search -q "jefe de tienda" -l "RM" --jobage 14 --format table
  bun run src/cli.ts search -q "bodega puente alto" -l "Metropolitana" --format table
  bun run src/cli.ts detail 6137907 --format plain

Uso personal: mantenga un volumen bajo de consultas.
`

const KNOWN: Record<string, Set<string>> = {
  search: new Set(["query", "location", "jobage", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const cmd = flags._[0]
  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }
  if (KNOWN[cmd] && !checkKnownFlags(flags, cmd, KNOWN[cmd])) return 1

  if (cmd === "search") {
    const format = formatFlag(flags.format, ["json", "table", "plain"])
    if (!format) return 1
    let location: string | undefined
    if (flags.location !== undefined) {
      location = String(flags.location)
      if (!regionId(location)) {
        writeError(
          `unknown --location "${location}". Trabajando.com filters by region only (put the comuna in --query); use one of: ${Object.keys(REGION_IDS).join(", ")}`,
          "BAD_LOCATION",
        )
        return 1
      }
    }
    const ints: Record<string, number | undefined> = {}
    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] === undefined) continue
      const v = positiveInt(name, flags[name])
      if (v === null) return 1
      ints[name] = v
    }
    return runSearch({
      query: typeof flags.query === "string" ? flags.query : undefined,
      location,
      jobage: ints.jobage,
      page: ints.page ?? 1,
      limit: ints.limit,
      format,
    })
  }

  if (cmd === "detail") {
    const id = flags._[1]
    if (!id) {
      writeError("detail requires an <id|url>", "NO_ID")
      return 1
    }
    const format = formatFlag(flags.format, ["json", "plain"])
    if (!format) return 1
    return runDetail({ id, format })
  }

  writeError(`Unknown command "${cmd}"`, "BAD_CMD")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    writeError(e instanceof Error ? e.message : String(e), "INTERNAL_ERROR")
    process.exit(1)
  })
