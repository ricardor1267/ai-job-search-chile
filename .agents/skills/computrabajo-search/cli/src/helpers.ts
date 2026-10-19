// Computrabajo Chile (cl.computrabajo.com) - parsing and URL building.
//
// Search: server-rendered HTML at /trabajo-de-<query-slug>[-en-<place-slug>][?p=<page>],
//   20 results per page, each an <article class="box_offer ..." data-id="<HEX ID>">.
//   <place-slug> is a region ("rmetropolitana") or a comuna ("puente-alto").
// Detail: /ofertas-de-trabajo/oferta-de-trabajo-de-<anything>-<HEX ID> (any slug works);
//   the page carries a schema.org JobPosting inside an ld+json @graph.
// robots.txt (checked 2026-10-19) DISALLOWS the filter parameters (pubdate=, by=, sal=,
//   cont=, dis=, emp= ...). This CLI therefore never sends them: recency is filtered
//   client-side and results come in the portal's default order. Only ?p= is used.
// Parsing anchors are documented in ../../url-reference.md.

import {
  cleanInline,
  findJobPostingLd,
  fold,
  htmlToText,
  ldSalary,
  parseSpanishDate,
  type JobDetail,
  type JobResult,
} from "./core.js"

export const BASE = "https://cl.computrabajo.com"
export const UA = "Mozilla/5.0 (compatible; computrabajo-cli/1.0)"
export const PAGE_SIZE = 20

const REGION_ALIASES: Record<string, string> = {
  "rm": "rmetropolitana",
  "metropolitana": "rmetropolitana",
  "region metropolitana": "rmetropolitana",
  "region metropolitana de santiago": "rmetropolitana",
  "santiago": "rmetropolitana",
  "r metropolitana": "rmetropolitana",
  "rmetropolitana": "rmetropolitana",
  "valparaiso": "valparaiso",
  "region de valparaiso": "valparaiso",
  "biobio": "biobio",
  "region del biobio": "biobio",
  "antofagasta": "antofagasta",
}

/** "Jefe de Tienda" -> "jefe-de-tienda" (accents folded, everything else to dashes). */
export function slugify(text: string): string {
  return fold(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

/** Region aliases map to the portal's region slug; anything else is used as a comuna/place slug. */
export function placeSlug(location: string): string {
  const key = fold(location).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()
  return REGION_ALIASES[key] ?? slugify(location)
}

export interface SearchParams {
  query: string
  location?: string
  page: number
}

export function buildSearchUrl(p: SearchParams): string {
  let path = `/trabajo-de-${slugify(p.query)}`
  if (p.location) path += `-en-${placeSlug(p.location)}`
  return `${BASE}${path}${p.page > 1 ? `?p=${p.page}` : ""}`
}

export interface ComputrabajoResult extends JobResult {
  featured: boolean
}

export function parseSearch(html: string, now: Date = new Date()): ComputrabajoResult[] {
  const out: ComputrabajoResult[] = []
  const chunks = html.split(/<article class="box_offer/).slice(1)
  for (const raw of chunks) {
    const chunk = raw.split(/<\/article>/)[0]
    const id = chunk.match(/data-id="([0-9A-F]{16,})"/i)?.[1]
    const link = chunk.match(/<a class="js-o-link[^"]*" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!id || !link) continue
    const title = cleanInline(link[2])
    if (!title) continue
    const href = link[1].split("#")[0]
    const url = href.startsWith("http") ? href : `${BASE}${href}`

    const companyMatch = chunk.match(/<a[^>]*offer-grid-article-company-url[^>]*>([\s\S]*?)<\/a>/i)
    // Blind/confidential offers have no company link; the name (if any) sits in the plain <p>.
    let company = companyMatch ? cleanInline(companyMatch[1]) || null : null
    if (!company) {
      const p = chunk.match(/<p class="dFlex vm_fx fs16 fc_base mt5">([\s\S]*?)<\/p>/i)
      if (p) company = cleanInline(p[1].replace(/<span class="fx_none[\s\S]*?<\/span>\s*<\/span>/i, "")) || null
    }
    // Location: the plain <p class="fs16 fc_base mt5"> (the rating <p> also has "dFlex", so anchor on the exact class).
    const loc = chunk.match(/<p class="fs16 fc_base mt5">\s*<span class="mr10">([\s\S]*?)<\/span>/i)
    const location = loc ? cleanInline(loc[1]) || null : null
    const sal = chunk.match(/<span class="icon i_salary"><\/span>([\s\S]*?)<\/span>/i)
    const salary = sal ? cleanInline(sal[1]) || null : null
    const dateRaw = chunk.match(/<p class="fs13 fc_aux mt15">([\s\S]*?)<\/p>/i)
    const date = dateRaw ? parseSpanishDate(cleanInline(dateRaw[1]), now) : null
    const featured = /^[^"]*\boutstanding\b/.test(raw) || /Empleo destacado/i.test(chunk)

    out.push({
      id: id,
      title: title,
      company: company,
      location: location,
      date: date,
      url: url,
      salary: salary,
      featured: featured,
    })
  }
  return out
}

export function detailUrl(idOrUrl: string): string | null {
  const s = idOrUrl.trim()
  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s)
    if (!/(^|\.)computrabajo\.com$/i.test(u.hostname)) return null
    const m = u.pathname.match(/-([0-9A-F]{16,})\/?$/i)
    return m ? `${BASE}/ofertas-de-trabajo/oferta-de-trabajo-de-x-${m[1].toUpperCase()}` : null
  }
  return /^[0-9A-F]{16,}$/i.test(s) ? `${BASE}/ofertas-de-trabajo/oferta-de-trabajo-de-x-${s.toUpperCase()}` : null
}

export function parseDetail(html: string, id: string): JobDetail | null {
  const ld = findJobPostingLd(html)
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = ld?.title ? cleanInline(String(ld.title)) : h1 ? cleanInline(h1[1]) : null
  if (!title) return null
  // Computrabajo swaps the fields: addressRegion holds "Santiago - Las condes", addressLocality the region.
  const addr = ld?.jobLocation?.address ?? {}
  const location = [addr.addressRegion, addr.addressLocality].filter(Boolean).join(", ") || null
  let description = ld?.description ? htmlToText(String(ld.description)) : null
  if (description) description = description.replace(/\s*-Requerimientos-\s*/, "\n\nRequerimientos:\n")
  return {
    id,
    title,
    company: ld?.hiringOrganization?.name ? cleanInline(String(ld.hiringOrganization.name)) : null,
    location,
    date: parseSpanishDate(ld?.datePosted ?? null),
    url: ld?.url ? String(ld.url) : `${BASE}/ofertas-de-trabajo/oferta-de-trabajo-de-x-${id}`,
    salary: ld ? ldSalary(ld) : null,
    description,
    deadline: parseSpanishDate(ld?.validThrough ?? null),
    employmentType: ld?.employmentType && ld.employmentType !== "OTHER" ? String(ld.employmentType) : null,
    category: ld?.industry ? String(ld.industry) : null,
  }
}
