import { emitDetail, fetchText, writeError } from "../core.js"
import { UA, detailUrl, parseDetail } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: string
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = detailUrl(opts.id)
  if (!url) {
    writeError(`not a Chiletrabajos job id or URL: "${opts.id}" (expected e.g. 3888534 or https://www.chiletrabajos.cl/trabajo/...-3888534)`, "BAD_ID")
    return 1
  }
  try {
    const html = await fetchText(url, { ua: UA })
    const id = url.match(/(\d+)$/)![1]
    const detail = html ? parseDetail(html, id) : null
    if (!detail) {
      writeError(`posting ${id} not found (it may have expired)`, "NOT_FOUND")
      return 1
    }
    emitDetail(detail, opts.format)
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
