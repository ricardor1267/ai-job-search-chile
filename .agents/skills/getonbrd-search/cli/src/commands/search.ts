import { emitSearch, fetchJson, withinDays, writeError } from "../core.js"
import { UA, buildSearchUrl, matchesLocation, parseSearch, type ApiList, type SearchParams } from "../helpers.js"

export interface SearchOpts extends SearchParams {
  location?: string
  jobage?: number
  limit?: number
  format: string
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    // Location and age are client-side filters, so ask for a larger page when they are set.
    const perPage = opts.location || opts.jobage ? 50 : 20
    const data = await fetchJson<ApiList>(buildSearchUrl(opts, perPage), { ua: UA })
    let rows = parseSearch(data)
    if (opts.location) rows = rows.filter((r) => matchesLocation(r, opts.location as string))
    if (opts.jobage) rows = rows.filter((r) => withinDays(r.date, opts.jobage as number))
    if (opts.limit !== undefined) rows = rows.slice(0, opts.limit)
    emitSearch(rows, opts.page, opts.format, { pages: data?.meta?.total_pages ?? null })
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
