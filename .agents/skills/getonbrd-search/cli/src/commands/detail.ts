import { emitDetail, fetchJson, fetchText, writeError } from "../core.js"
import { BASE, UA, companyJobsUrl, companySlugFromPage, detailIdFrom, toDetail, type ApiList } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: string
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = detailIdFrom(opts.id)
  if (!id) {
    writeError(`not a Get on Board job id or URL: "${opts.id}" (expected the slug id from search, e.g. semi-senior-java-developer-etl-23people-remote-ebb4)`, "BAD_ID")
    return 1
  }
  try {
    // /api/v0/jobs/<id> needs auth, so: public page -> company slug -> public company jobs API.
    const page = await fetchText(`${BASE}/jobs/${id}`, { ua: UA })
    const slug = page ? companySlugFromPage(page) : null
    if (!slug) {
      writeError(`job ${id} not found (it may have been closed)`, "NOT_FOUND")
      return 1
    }
    for (let p = 1; p <= 3; p++) {
      const list = await fetchJson<ApiList>(companyJobsUrl(slug, p), { ua: UA })
      const hit = list?.data?.find((j) => j.id === id)
      if (hit) {
        const detail = toDetail(hit, null)
        if (detail) {
          emitDetail(detail, opts.format)
          return 0
        }
      }
      if (!list?.data?.length || (list.meta?.total_pages ?? 1) <= p) break
    }
    writeError(`job ${id} is no longer listed by its company (closed or unpublished)`, "NOT_FOUND")
    return 1
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
