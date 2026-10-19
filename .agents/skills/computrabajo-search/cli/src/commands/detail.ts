import { emitDetail, fetchText, writeError } from "../core.js"
import { UA, detailUrl, parseDetail } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: string
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = detailUrl(opts.id)
  if (!url) {
    writeError(`not a Computrabajo offer id or URL: "${opts.id}" (expected the hex id from search, e.g. F3EB77D92D1ED0DF61373E686DCF3405, or a cl.computrabajo.com offer URL)`, "BAD_ID")
    return 1
  }
  try {
    const html = await fetchText(url, { ua: UA })
    const id = url.match(/-([0-9A-F]+)$/)![1]
    const detail = html ? parseDetail(html, id) : null
    if (!detail) {
      writeError(`offer ${id} not found (it may have expired)`, "NOT_FOUND")
      return 1
    }
    emitDetail(detail, opts.format)
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
