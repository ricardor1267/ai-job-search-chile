import { emitSearch, fetchText, withinDays, writeError } from "../core.js"
import { UA, buildSearchUrl, parseSearch, type SearchParams } from "../helpers.js"

export interface SearchOpts extends SearchParams {
  limit?: number
  format: string
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await fetchText(buildSearchUrl(opts), { ua: UA })
    let rows = parseSearch(html)
    // The portal's own "fecha" filter is coarse (hoy / 3 / 6 días / semana / mes);
    // apply the exact window client-side on top. Unknown dates are kept.
    if (opts.jobage) rows = rows.filter((r) => withinDays(r.date, opts.jobage as number))
    if (opts.limit !== undefined) rows = rows.slice(0, opts.limit)
    emitSearch(rows, opts.page, opts.format)
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
