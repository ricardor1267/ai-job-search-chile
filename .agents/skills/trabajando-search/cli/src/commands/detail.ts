import { emitDetail, fetchJson, writeError } from "../core.js"
import { UA, detailApiUrl, detailId, parseDetail } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: string
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = detailId(opts.id)
  if (!id) {
    writeError(`not a Trabajando.com offer id or URL: "${opts.id}" (expected e.g. 6137907 or https://www.trabajando.cl/trabajo/6137907-...)`, "BAD_ID")
    return 1
  }
  try {
    const data = await fetchJson<Record<string, any>>(detailApiUrl(id), { ua: UA })
    const detail = parseDetail(data, id)
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
