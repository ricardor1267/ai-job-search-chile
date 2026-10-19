// Get on Board (www.getonbrd.com) - public JSON API, focused on tech/digital jobs in Chile & LatAm.
//
// Search: GET /api/v0/search/jobs?query=<q>&per_page=<n>&page=<n>&expand=["company"]
//   -> { data: [{ id, type:"job", attributes:{ title, countries[], remote, remote_modality,
//        published_at (unix s), min_salary, max_salary (USD/month), category_name, description,
//        functions, desirable, benefits, projects, company:{data:{id, attributes:{name}}} },
//        links:{ public_url } }], meta:{ page, per_page, total_pages } }
// Detail: GET /api/v0/jobs/<id> requires auth (401), so `detail` reads the public posting page
//   to find the company slug (microdata <span itemprop="url">.../companies/<slug></span>), then
//   GET /api/v0/companies/<slug>/jobs (public) and picks the posting by id.
// robots.txt (checked 2026-10-19) has no Disallow rules.

import { cleanInline, fold, htmlToText, isoFromDate, type JobDetail, type JobResult } from "./core.js"

export const BASE = "https://www.getonbrd.com"
export const UA = "Mozilla/5.0 (compatible; getonbrd-cli/1.0)"
export const PER_PAGE = 20

export interface ApiJob {
  id: string
  type?: string
  attributes: Record<string, any>
  links?: { public_url?: string }
}

export interface ApiList {
  data?: ApiJob[]
  meta?: { page?: number; per_page?: number; total_pages?: number }
}

export interface SearchParams {
  query?: string
  page: number
}

export function buildSearchUrl(p: SearchParams, perPage = PER_PAGE): string {
  const params = new URLSearchParams()
  params.set("query", p.query ?? "")
  params.set("per_page", String(perPage))
  params.set("page", String(p.page))
  params.set("expand", '["company"]')
  return `${BASE}/api/v0/search/jobs?${params.toString()}`
}

export function companyJobsUrl(slug: string, page: number): string {
  return `${BASE}/api/v0/companies/${encodeURIComponent(slug)}/jobs?per_page=100&page=${page}`
}

function locationOf(a: Record<string, any>): string | null {
  const countries: string[] = Array.isArray(a.countries) ? a.countries : []
  const parts = countries.length ? countries.join(", ") : null
  if (a.remote && !(parts ?? "").toLowerCase().includes("remot")) return parts ? `${parts} (remoto)` : "Remoto"
  return parts
}

function salaryOf(a: Record<string, any>): string | null {
  const fmt = (n: number) => n.toLocaleString("es-CL")
  const min = Number(a.min_salary) || 0
  const max = Number(a.max_salary) || 0
  if (!min && !max) return null
  if (min && max && min !== max) return `USD ${fmt(min)} - ${fmt(max)} mensual`
  return `USD ${fmt(max || min)} mensual`
}

function dateOf(a: Record<string, any>): string | null {
  const t = Number(a.published_at)
  return t > 0 ? isoFromDate(new Date(t * 1000)) : null
}

export interface GetonbrdResult extends JobResult {
  remote: boolean
  category: string | null
}

export function toResult(j: ApiJob): GetonbrdResult | null {
  const a = j?.attributes
  if (!j?.id || !a?.title) return null
  return {
    id: j.id,
    title: cleanInline(String(a.title)),
    company: a.company?.data?.attributes?.name ? cleanInline(String(a.company.data.attributes.name)) : null,
    location: locationOf(a),
    date: dateOf(a),
    url: j.links?.public_url ?? `${BASE}/jobs/${j.id}`,
    salary: salaryOf(a),
    remote: Boolean(a.remote),
    category: a.category_name ?? null,
  }
}

export function parseSearch(data: ApiList | null): GetonbrdResult[] {
  return (data?.data ?? []).map(toResult).filter((r): r is GetonbrdResult => r !== null)
}

/** Client-side location filter: matches the posting's country list ("Chile", "Remoto"...). */
export function matchesLocation(r: GetonbrdResult, location: string): boolean {
  const want = fold(location)
  if (/^remot/.test(want)) return r.remote
  return fold(r.location ?? "").includes(want)
}

export function detailIdFrom(idOrUrl: string): string | null {
  const s = idOrUrl.trim()
  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s)
    if (!/(^|\.)getonbrd\.(com|cl)$/i.test(u.hostname)) return null
    const m = u.pathname.match(/\/(?:jobs|empleos(?:\/[^/]+)?)\/([a-z0-9-]+)\/?$/i)
    return m ? m[1] : null
  }
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(s) ? s : null
}

/** Company slug from the public posting page's microdata. */
export function companySlugFromPage(html: string): string | null {
  return (
    html.match(/itemprop="url"[^>]*>\s*https:\/\/www\.getonbrd\.com\/companies\/([a-z0-9-]+)\s*</i)?.[1] ??
    html.match(/href="(?:https:\/\/www\.getonbrd\.com)?\/companies\/([a-z0-9-]+)"/i)?.[1] ??
    null
  )
}

export function toDetail(j: ApiJob, companyName: string | null): JobDetail | null {
  const base = toResult(j)
  if (!base) return null
  const a = j.attributes
  const section = (headline: unknown, body: unknown, fallback: string): string | null =>
    body ? `${cleanInline(String(headline || fallback))}:\n${htmlToText(String(body))}` : null
  const description = [
    a.projects ? htmlToText(String(a.projects)) : null,
    section(a.functions_headline, a.functions, "Funciones"),
    section(a.description_headline, a.description, "Requisitos"),
    section(a.desirable_headline, a.desirable, "Deseable"),
    section(a.benefits_headline, a.benefits, "Beneficios"),
  ]
    .filter(Boolean)
    .join("\n\n")
  return {
    ...base,
    company: base.company ?? companyName,
    description: description || null,
    deadline: null,
    employmentType: a.remote_modality ? String(a.remote_modality).replace(/_/g, " ") : null,
    category: a.category_name ?? null,
  }
}
