import { emitSearch, fetchText, withinDays, writeError } from "../core.js"
import { UA, buildSearchUrl, parseSearch, type SearchParams } from "../helpers.js"

export interface SearchOpts extends SearchParams {
  jobage?: number
  limit?: number
  format: string
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await fetchText(buildSearchUrl(opts), { ua: UA })
    let rows = parseSearch(html)
    // robots.txt disallows the portal's own date filter (pubdate=), so the
    // recency window is applied here, on the relative dates the cards print.
    if (opts.jobage) rows = rows.filter((r) => withinDays(r.date, opts.jobage as number))
    if (opts.limit !== undefined) rows = rows.slice(0, opts.limit)
    emitSearch(rows, opts.page, opts.format)
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
