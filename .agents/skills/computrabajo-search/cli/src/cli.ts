#!/usr/bin/env bun
// computrabajo-cli - search job offers on Computrabajo Chile (cl.computrabajo.com).
// Self-contained: plain bun + fetch + regex parsing, zero runtime dependencies.
// Personal use only: keep volume low. The portal's robots.txt disallows its URL
// filter parameters, so this CLI never sends them (recency is filtered client-side).

import { checkKnownFlags, formatFlag, parseFlags, positiveInt, writeError } from "./core.js"
import { runSearch } from "./commands/search.js"
import { runDetail } from "./commands/detail.js"

const HELP = `computrabajo-cli — busca ofertas en Computrabajo Chile

USO
  bun run src/cli.ts search --query "<texto>" [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

FLAGS DE BÚSQUEDA
  --query, -q <texto>     Palabras clave (cargo, área). OBLIGATORIO.
  --location, -l <texto>  Región o comuna: "Región Metropolitana" (o "RM", "Santiago"),
                          "Valparaíso", "Puente Alto", "La Florida", "Maipú"...
  --jobage <días>         Publicadas hace N días como máximo (filtro en el cliente:
                          robots.txt del portal no permite su filtro de fecha).
  --page <n>              Página (20 resultados por página). Por defecto 1.
  --limit, -n <n>         Máximo de resultados a mostrar.
  --format <fmt>          json (por defecto) | table | plain.

EJEMPLOS
  bun run src/cli.ts search -q "jefe de tienda" -l "Región Metropolitana" --jobage 14 --format table
  bun run src/cli.ts search -q "supermercado" -l "Puente Alto" --format table
  bun run src/cli.ts detail F3EB77D92D1ED0DF61373E686DCF3405 --format plain

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
    const query = typeof flags.query === "string" ? flags.query.trim() : ""
    if (!query) {
      writeError('the --query/-q flag is required (Computrabajo searches are keyword pages, e.g. -q "jefe de tienda")', "NO_QUERY")
      return 1
    }
    const format = formatFlag(flags.format, ["json", "table", "plain"])
    if (!format) return 1
    const ints: Record<string, number | undefined> = {}
    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] === undefined) continue
      const v = positiveInt(name, flags[name])
      if (v === null) return 1
      ints[name] = v
    }
    return runSearch({
      query,
      location: typeof flags.location === "string" && flags.location.trim() ? flags.location : undefined,
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
