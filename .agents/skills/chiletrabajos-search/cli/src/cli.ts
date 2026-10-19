#!/usr/bin/env bun
// chiletrabajos-cli - search job postings on Chiletrabajos (www.chiletrabajos.cl), Chile.
// Self-contained: plain bun + fetch + regex parsing, zero runtime dependencies.
// Personal use only: keep volume low and respect the portal's terms and robots.txt.

import { checkKnownFlags, formatFlag, parseFlags, positiveInt, writeError } from "./core.js"
import { CITY_IDS, cityId } from "./helpers.js"
import { runSearch } from "./commands/search.js"
import { runDetail } from "./commands/detail.js"

const HELP = `chiletrabajos-cli — busca ofertas en Chiletrabajos (Chile)

USO
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

FLAGS DE BÚSQUEDA
  --query, -q <texto>     Palabras clave (cargo, área, habilidad). Recomendado.
  --location, -l <texto>  Ciudad/provincia del filtro del portal, p. ej. "Santiago",
                          "Puente Alto", "Concepción", "Valparaíso" (o su id numérico).
  --jobage <días>         Publicadas hace N días como máximo (el portal filtra por
                          tramos y además se filtra la fecha exacta en el cliente).
  --page <n>              Página (30 resultados por página). Por defecto 1.
  --limit, -n <n>         Máximo de resultados a mostrar.
  --format <fmt>          json (por defecto) | table | plain.

EJEMPLOS
  bun run src/cli.ts search -q "jefe de tienda" -l "Santiago" --jobage 14 --format table
  bun run src/cli.ts search -q "bodega" -l "Puente Alto" --format table
  bun run src/cli.ts detail 3888534 --format plain

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
      if (!cityId(location)) {
        writeError(
          `unknown --location "${location}". Chiletrabajos filters by city/province; use one of: ${Object.keys(CITY_IDS).join(", ")}`,
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
