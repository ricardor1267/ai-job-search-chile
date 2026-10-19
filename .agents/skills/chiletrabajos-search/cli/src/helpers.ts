// Chiletrabajos (www.chiletrabajos.cl) - parsing and URL building.
//
// Search: server-rendered HTML at /encuentra-un-empleo[/<offset>]?action=search&2=<query>
//   &13=<city id>&fecha=<age code>. 30 results per page; page N lives at offset (N-1)*30.
//   Each result is a <div class="job-item ..."> card.
// Detail: /trabajo/<slug>-<id> (any slug works, e.g. /trabajo/x-3888534). The page carries
//   a schema.org JobPosting in ld+json, which we read instead of scraping markup.
// robots.txt (checked 2026-10-19) allows these paths for User-agent: *.
// Parsing anchors are documented in ../../url-reference.md.

import {
  cleanInline,
  findJobPostingLd,
  htmlToText,
  fold,
  ldSalary,
  parseSpanishDate,
  type JobDetail,
  type JobResult,
} from "./core.js"

export const BASE = "https://www.chiletrabajos.cl"
export const UA = "Mozilla/5.0 (compatible; chiletrabajos-cli/1.0)"
export const PAGE_SIZE = 30

/** City/province filter ids from the portal's own "Ciudad" select (parameter `13`). */
export const CITY_IDS: Record<string, string> = {
  "arica": "1000", "putre": "1001", "iquique": "1002", "pozo almonte": "1003",
  "antofagasta": "1004", "tocopilla": "1005", "calama": "1006", "copiapo": "1007",
  "chanaral": "1008", "vallenar": "1009", "la serena": "1010", "coquimbo": "1011",
  "ovalle": "1012", "illapel": "1013", "valparaiso": "1014", "la ligua": "1015",
  "los andes": "1016", "san felipe": "1017", "quillota": "1018", "san antonio": "1019",
  "hanga roa": "1020", "quilpue": "1021", "santiago": "1022", "colina": "1023",
  "puente alto": "1024", "san bernardo": "1025", "melipilla": "1026", "talagante": "1027",
  "rancagua": "1028", "san fernando": "1029", "pichilemu": "1030", "talca": "1031",
  "curico": "1032", "linares": "1033", "cauquenes": "1034", "concepcion": "1035",
  "chillan": "1036", "los angeles": "1037", "lebu": "1038", "temuco": "1039",
  "angol": "1040", "valdivia": "1041", "la union": "1042", "puerto montt": "1043",
  "osorno": "1044", "castro": "1045", "chaiten": "1046", "coyhaique": "1047",
  "puerto aysen": "1048", "chile chico": "1049", "cochrane": "1050", "punta arenas": "1051",
  "puerto natales": "1052", "porvenir": "1053", "puerto williams": "1054", "quirihue": "1055",
  "bulnes": "1056", "san carlos": "1057",
}

export function cityId(location: string): string | null {
  if (/^\d{4}$/.test(location.trim())) return location.trim()
  return CITY_IDS[fold(location).replace(/[^a-z ]/g, "").replace(/\s+/g, " ")] ?? null
}

/** Map --jobage days onto the portal's "fecha" select (1=hoy, 2=desde ayer, 3=<3 días, 4=<6 días, 5=una semana, 6=un mes). */
export function fechaCode(days: number | undefined): string | null {
  if (!days) return null
  if (days <= 1) return "1"
  if (days <= 2) return "2"
  if (days <= 3) return "3"
  if (days <= 6) return "4"
  if (days <= 7) return "5"
  if (days <= 31) return "6"
  return null
}

export interface SearchParams {
  query?: string
  location?: string
  jobage?: number
  page: number
}

export function buildSearchUrl(p: SearchParams): string {
  const offset = (p.page - 1) * PAGE_SIZE
  const params = new URLSearchParams()
  params.set("action", "search")
  params.set("2", p.query ?? "")
  if (p.location) {
    const id = cityId(p.location)
    if (id) params.set("13", id)
  }
  const f = fechaCode(p.jobage)
  if (f) params.set("fecha", f)
  return `${BASE}/encuentra-un-empleo${offset > 0 ? `/${offset}` : ""}?${params.toString()}`
}

export interface ChiletrabajosResult extends JobResult {
  featured: boolean
}

/** Parse the search page. Each card is parsed independently so one bad card cannot break the rest. */
export function parseSearch(html: string, now: Date = new Date()): ChiletrabajosResult[] {
  const out: ChiletrabajosResult[] = []
  const chunks = html.split(/<div class="job-item/).slice(1)
  for (const raw of chunks) {
    // Bound the chunk at the next card boundary already handled by split; also guard size.
    const chunk = raw.slice(0, 20000)
    const featured = /^[^"]*\bdestacado\b/.test(chunk)
    const link = chunk.match(/<h2[^>]*class="title[^"]*"[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!link) continue
    const url = link[1].split("?")[0]
    const title = cleanInline(link[2])
    const idMatch = chunk.match(/data-id=["'](\d+)["']/) ?? url.match(/-(\d+)$/)
    if (!title || !idMatch) continue

    const metas = [...chunk.matchAll(/<h3 class="meta">([\s\S]*?)<\/h3>/gi)].map((m) => m[1])
    let company: string | null = null
    let location: string | null = null
    if (metas[0]) {
      const loc = metas[0].match(/<a[^>]*>([\s\S]*?)<\/a>/i)
      location = loc ? cleanInline(loc[1]) || null : null
      const beforeLink = metas[0].split(/<a[\s>]/i)[0]
      company = cleanInline(beforeLink).replace(/,\s*$/, "") || null
    }
    const date = metas[1] ? parseSpanishDate(cleanInline(metas[1]), now) : null

    const desc = chunk.match(/<p class="description"[^>]*>([\s\S]*?)<\/p>/i)
    const snippet = desc ? cleanInline(desc[1].replace(/<a[^>]*class="ver-mas-btn"[\s\S]*?<\/a>/i, "")) || null : null

    out.push({
      id: idMatch[1],
      title: title,
      company: company,
      location: location,
      date: date,
      url: url,
      snippet: snippet,
      featured: featured,
    })
  }
  return out
}

export function detailUrl(idOrUrl: string): string | null {
  const s = idOrUrl.trim()
  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s)
    if (!/(^|\.)chiletrabajos\.cl$/i.test(u.hostname)) return null
    const m = u.pathname.match(/(\d{5,})\/?$/)
    return m ? `${BASE}/trabajo/x-${m[1]}` : null
  }
  return /^\d{5,}$/.test(s) ? `${BASE}/trabajo/x-${s}` : null
}

/** Parse a posting page via its JobPosting ld+json, with the info table as fallback. */
export function parseDetail(html: string, id: string): JobDetail | null {
  const ld = findJobPostingLd(html)
  const row = (label: string): string | null => {
    const m = html.match(new RegExp(`<td[^>]*>\\s*${label}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i"))
    return m ? cleanInline(m[1]) || null : null
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = (ld?.title ? cleanInline(String(ld.title)) : null) ?? (h1 ? cleanInline(h1[1]) : null)
  if (!title) return null

  const addr = ld?.jobLocation?.address ?? {}
  const location = [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ") || row("Ubicación")
  const expira = row("Expira")
  const duracion = row("Duración")
  const tipo = row("Tipo")

  return {
    id,
    title,
    company: ld?.hiringOrganization?.name ? cleanInline(String(ld.hiringOrganization.name)) : row("Buscado"),
    location: location || null,
    date: parseSpanishDate(ld?.datePosted ?? row("Fecha")),
    url: `${BASE}/trabajo/x-${id}`,
    salary: ld ? ldSalary(ld) : null,
    description: ld?.description ? htmlToText(String(ld.description)) : null,
    deadline: parseSpanishDate(ld?.validThrough ?? expira),
    employmentType: [tipo, duracion].filter(Boolean).join(" · ") || (ld?.employmentType ?? null),
    category: ld?.industry ?? row("Categoría"),
  }
}
