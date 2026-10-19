// Trabajando.com Chile (www.trabajando.cl) - JSON API used by the portal's own search page.
//
// Search: GET /api/searchjob?palabraClave=<q>&pagina=<n>&region=<id>&orden=FECHA_PUBLICACION&tipoOrden=DESC
//   -> { ofertas: [...], cantidadRegistros, cantidadPaginas, paginaActual, registrosPorPagina (15), facetas }
// Detail: GET /api/ofertas/<id> -> full posting (HTML description, requirements, dates, ubicacion{...}).
// Public posting page: /trabajo/<id>-<slug> (any slug works).
// robots.txt (checked 2026-10-19): "Allow: /" except account/CV paths; /api/ is not disallowed.
// Field paths are documented in ../../url-reference.md.

import { cleanInline, fold, htmlToText, parseSpanishDate, type JobDetail, type JobResult } from "./core.js"

export const BASE = "https://www.trabajando.cl"
export const UA = "Mozilla/5.0 (compatible; trabajando-cli/1.0)"
export const PAGE_SIZE = 15

/** Region ids from the API's own "region" facet. */
export const REGION_IDS: Record<string, string> = {
  "metropolitana": "1",
  "tarapaca": "2",
  "antofagasta": "3",
  "atacama": "4",
  "coquimbo": "5",
  "valparaiso": "6",
  "ohiggins": "7",
  "maule": "8",
  "biobio": "9",
  "araucania": "10",
  "los lagos": "11",
  "aysen": "12",
  "magallanes": "13",
  "extranjero": "14",
  "los rios": "472",
  "arica y parinacota": "473",
  "nuble": "556",
}

const REGION_ALIASES: Record<string, string> = {
  "rm": "metropolitana",
  "santiago": "metropolitana",
  "region metropolitana": "metropolitana",
  "metropolitana de santiago": "metropolitana",
  "region metropolitana de santiago": "metropolitana",
  "libertador general bernardo ohiggins": "ohiggins",
  "lib gral bdo ohiggins": "ohiggins",
  "la araucania": "araucania",
  "arica": "arica y parinacota",
  "magallanes y antartica chilena": "magallanes",
}

export function regionId(location: string): string | null {
  if (/^\d{1,3}$/.test(location.trim())) return location.trim()
  let key = fold(location).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()
  key = key.replace(/^(r|region)( de| del)? /, "").trim()
  key = REGION_ALIASES[key] ?? key
  return REGION_IDS[key] ?? null
}

export interface SearchParams {
  query?: string
  location?: string
  page: number
}

export function buildSearchUrl(p: SearchParams): string {
  const params = new URLSearchParams()
  if (p.query) params.set("palabraClave", p.query)
  params.set("pagina", String(p.page))
  if (p.location) {
    const id = regionId(p.location)
    if (id) params.set("region", id)
  }
  params.set("orden", "FECHA_PUBLICACION")
  params.set("tipoOrden", "DESC")
  return `${BASE}/api/searchjob?${params.toString()}`
}

export interface ApiSearch {
  ofertas?: Array<{
    idOferta: number
    nombreCargo?: string
    nombreEmpresa?: string
    ubicacion?: string
    fechaPublicacion?: string
    descripcionOferta?: string
    nombreJornada?: string
    ofertaDestacada?: boolean
  }>
  cantidadRegistros?: number
  cantidadPaginas?: number
  paginaActual?: number
}

export interface TrabajandoResult extends JobResult {
  workday: string | null
  featured: boolean
}

export function postingUrl(id: string | number, slug?: string): string {
  return `${BASE}/trabajo/${slug && slug.startsWith(String(id)) ? slug : String(id)}`
}

export function parseSearch(data: ApiSearch | null): TrabajandoResult[] {
  return (data?.ofertas ?? [])
    .filter((o) => o && o.idOferta && o.nombreCargo)
    .map((o) => ({
      id: String(o.idOferta),
      title: cleanInline(o.nombreCargo as string),
      company: o.nombreEmpresa ? cleanInline(o.nombreEmpresa) || null : null,
      location: o.ubicacion ? cleanInline(o.ubicacion) || null : null,
      date: parseSpanishDate(o.fechaPublicacion ?? null),
      url: postingUrl(o.idOferta),
      snippet: o.descripcionOferta ? cleanInline(o.descripcionOferta) || null : null,
      workday: o.nombreJornada ?? null,
      featured: Boolean(o.ofertaDestacada),
    }))
}

export function detailId(idOrUrl: string): string | null {
  const s = idOrUrl.trim()
  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s)
    if (!/(^|\.)trabajando\.(cl|com)$/i.test(u.hostname)) return null
    return u.pathname.match(/\/trabajo\/(\d{5,})/)?.[1] ?? null
  }
  return /^\d{5,}$/.test(s) ? s : null
}

export function detailApiUrl(id: string): string {
  return `${BASE}/api/ofertas/${id}`
}

export function parseDetail(d: Record<string, any> | null, id: string): JobDetail | null {
  if (!d || !d.nombreCargo) return null
  const u = d.ubicacion ?? {}
  const location = [u.nombreComuna, u.nombreRegion].filter(Boolean).join(", ") || null
  const parts: string[] = []
  if (d.descripcionOferta) parts.push(htmlToText(String(d.descripcionOferta)))
  if (d.requisitosMinimos) parts.push("Requisitos mínimos:\n" + htmlToText(String(d.requisitosMinimos)))
  const extras = [
    d.aniosExperiencia ? `Experiencia: ${d.nombreOperadorExperiencia ?? "desde"} ${d.aniosExperiencia} año(s)`.replace(/\s+/g, " ") : null,
    d.nombreNivelAcademico ? `Nivel académico: ${d.nombreNivelAcademico}${d.nombreSituacionAcademica ? ` (${d.nombreSituacionAcademica})` : ""}` : null,
    d.cantidadVacantes ? `Vacantes: ${d.cantidadVacantes}` : null,
  ].filter(Boolean)
  if (extras.length) parts.push(extras.join("\n"))
  const sueldo = Number(d.sueldo)
  const salary = d.mostrarSueldo && sueldo > 0 ? `CLP ${sueldo.toLocaleString("es-CL")}` : null
  return {
    id,
    title: cleanInline(String(d.nombreCargo)),
    company: d.ofertaConfidencial ? "Confidencial" : d.nombreEmpresaFantasia ? cleanInline(String(d.nombreEmpresaFantasia)) : null,
    location,
    date: parseSpanishDate(d.fechaPublicacionFormatoIngles ?? d.fechaPublicacion ?? null),
    url: postingUrl(id, d.slug),
    salary,
    description: parts.join("\n\n").trim() || null,
    deadline: parseSpanishDate(d.fechaExpiracionFormatoIngles ?? d.fechaExpiracion ?? null),
    employmentType: [d.nombreJornada, d.tiempoContrato].filter(Boolean).join(" · ") || null,
    category: d.nombreArea ?? d.nombreTipoCargo ?? null,
    externalApplyUrl: d.linkPostulacionExterno ?? null,
    status: d.estadoOferta ?? null,
  } as JobDetail
}
