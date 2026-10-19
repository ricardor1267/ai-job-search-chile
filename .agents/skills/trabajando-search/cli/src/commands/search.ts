import { emitSearch, fetchJson, withinDays, writeError } from "../core.js"
import { UA, buildSearchUrl, parseSearch, type ApiSearch, type SearchParams } from "../helpers.js"

export interface SearchOpts extends SearchParams {
  jobage?: number
  limit?: number
  format: string
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const data = await fetchJson<ApiSearch>(buildSearchUrl(opts), { ua: UA })
    let rows = parseSearch(data)
    // The API has no age filter; results are sorted newest first, so filter client-side.
    if (opts.jobage) rows = rows.filter((r) => withinDays(r.date, opts.jobage as number))
    if (opts.limit !== undefined) rows = rows.slice(0, opts.limit)
    emitSearch(rows, opts.page, opts.format, {
      total: data?.cantidadRegistros ?? null,
      pages: data?.cantidadPaginas ?? null,
    })
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
