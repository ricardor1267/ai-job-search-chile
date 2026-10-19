// Shared core for the Chilean portal CLIs (chiletrabajos, computrabajo,
// trabajando, getonbrd). Each skill ships its OWN copy of this file in
// cli/src/core.ts so every CLI stays self-contained and runs with plain `bun`
// (zero runtime dependencies), per the portal-skill contract in
// .claude/commands/add-portal.md. Keep the copies identical: edit one, then
// copy it over the others.

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

export interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

export function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-") && a.length > 1 && !/^-\d/.test(a)) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || (next.startsWith("-") && !/^-\d/.test(next))) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      flags._.push(a)
    }
  }
  return flags
}

/** Reject flags a command does not know: a silently dropped filter changes results. */
export function checkKnownFlags(flags: Flags, cmd: string, known: Set<string>): boolean {
  for (const key of Object.keys(flags)) {
    if (key === "_" || known.has(key)) continue
    writeError(
      `unknown flag --${key} for '${cmd}' - flags are never silently ignored, because a discarded filter changes what the search returns; see --help for the supported flags`,
      "UNKNOWN_FLAG",
    )
    return false
  }
  return true
}

/** Whole number >= 1, or null after writing a BAD_ARG error. */
export function positiveInt(name: string, raw: string | boolean | string[]): number | null {
  const val = typeof raw === "string" ? Number(raw.trim()) : NaN
  if (!Number.isInteger(val) || val < 1) {
    writeError(`--${name} must be a whole number of at least 1, got "${raw}"`, "BAD_ARG")
    return null
  }
  return val
}

export function formatFlag(raw: string | boolean | string[] | undefined, allowed: string[]): string | null {
  const fmt = raw !== undefined ? String(raw) : "json"
  if (!allowed.includes(fmt)) {
    writeError(`--format must be one of ${allowed.join("|")}, got "${fmt}"`, "BAD_ARG")
    return null
  }
  return fmt
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export interface FetchOpts {
  ua: string
  accept?: string
  timeoutMs?: number
}

/**
 * Fetch text with exponential backoff + jitter on 429/5xx (max 6 retries).
 * Returns "" on a 404 (callers treat that as "not found", never a crash).
 */
export async function fetchText(url: string, opts: FetchOpts): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": opts.ua,
        Accept: opts.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.5",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export async function fetchJson<T>(url: string, opts: FetchOpts): Promise<T | null> {
  const text = await fetchText(url, { ...opts, accept: "application/json" })
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Expected JSON from ${new URL(url).host} but got something else (the portal may have changed its API)`)
  }
}

// ---------------------------------------------------------------------------
// Text cleanup
// ---------------------------------------------------------------------------

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü",
  iexcl: "¡", iquest: "¿", ordf: "ª", ordm: "º", deg: "°",
  laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—",
  bull: "•", middot: "·", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", euro: "€",
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED[name] ?? m)
}

/** Strip tags and collapse whitespace into one line. */
export function cleanInline(html: string): string {
  return decodeEntities(
    html
      // Inline formatting tags vanish without a gap ("<strong>Seguro</strong>: x" -> "Seguro: x");
      // every other tag becomes a space so adjacent blocks never glue words together.
      .replace(/<\/?(?:strong|b|em|i|u|span|a|small|sup|sub|mark)\b[^>]*>/gi, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim()
}

/** HTML (or plain text with \r\n) -> readable multi-line text, paragraphs kept. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/\r\n?/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|ul|ol|div|h\d|tr)>/gi, "\n")
  return withBreaks
    .split("\n")
    .map((line) => cleanInline(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Strip accents and lowercase: "Región Metropolitana" -> "region metropolitana". */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}

// ---------------------------------------------------------------------------
// Dates (Spanish)
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
}

function iso(y: number, m: number, d: number): string | null {
  if (!y || !m || !d || m > 12 || d > 31) return null
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function isoFromDate(d: Date): string {
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) as string
}

/**
 * Parse the date formats the Chilean portals print into YYYY-MM-DD:
 *   "16 de  Octubre de 2026", "2026-10-07 16:25:37", "19/10/2026",
 *   "Hace 4 horas", "Hace 2 días", "Ayer", "Hoy", "Publicada hoy",
 *   "Hace 13 días", "Hace más de 30 días" (-> null: unknown exact date).
 * `now` is injectable for tests. Returns null when the text has no usable date.
 */
export function parseSpanishDate(raw: string | null | undefined, now: Date = new Date()): string | null {
  if (!raw) return null
  const t = fold(raw).replace(/\s+/g, " ")

  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return iso(+m[1], +m[2], +m[3])

  m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return iso(+m[3], +m[2], +m[1])

  m = t.match(/(\d{1,2}) de ([a-z]+)(?: de| del)? (\d{4})/)
  if (m && MONTHS[m[2]]) return iso(+m[3], MONTHS[m[2]], +m[1])

  if (/mas de/.test(t)) return null

  const daysAgo = (n: number): string => {
    const d = new Date(now.getTime())
    d.setDate(d.getDate() - n)
    return isoFromDate(d)
  }
  if (/\b(hoy|minutos?|horas?|segundos?)\b/.test(t)) {
    m = t.match(/hace (\d+) horas?/)
    if (m) {
      const d = new Date(now.getTime() - +m[1] * 3600_000)
      return isoFromDate(d)
    }
    return daysAgo(0)
  }
  if (/\bayer\b/.test(t)) return daysAgo(1)
  m = t.match(/hace (\d+) dias?/)
  if (m) return daysAgo(+m[1])
  m = t.match(/hace (\d+) semanas?/)
  if (m) return daysAgo(+m[1] * 7)
  m = t.match(/hace (\d+) mes(es)?/)
  if (m) return daysAgo(+m[1] * 30)
  return null
}

/** True when `date` (YYYY-MM-DD) is within `days` of `now`. Unknown dates are kept. */
export function withinDays(date: string | null, days: number, now: Date = new Date()): boolean {
  if (!date) return true
  const then = Date.parse(date + "T00:00:00")
  if (Number.isNaN(then)) return true
  const today = Date.parse(isoFromDate(now) + "T00:00:00")
  return today - then <= days * 86400_000
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

/** Escape raw control characters that appear INSIDE JSON string literals only. */
export function escapeControlCharsInStrings(json: string): string {
  let out = ""
  let inString = false
  let escaped = false
  for (const ch of json) {
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === "\\") {
        escaped = true
      } else if (ch === '"') {
        inString = false
      } else if (ch < " ") {
        out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : ch === "\t" ? "\\t" : ""
        continue
      }
    } else if (ch === '"') {
      inString = true
    }
    out += ch
  }
  return out
}

/** Find the first schema.org JobPosting object in a page's ld+json blocks (also inside @graph). */
export function findJobPostingLd(html: string): Record<string, any> | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    let data: any
    try {
      data = JSON.parse(m[1])
    } catch {
      try {
        // Some portals (Chiletrabajos) emit raw CR/LF inside JSON strings.
        data = JSON.parse(escapeControlCharsInStrings(m[1]))
      } catch {
        continue
      }
    }
    const candidates: any[] = Array.isArray(data) ? data : data?.["@graph"] ? data["@graph"] : [data]
    for (const c of candidates) {
      if (c && typeof c === "object" && c["@type"] === "JobPosting") return c
    }
  }
  return null
}

/** Pull a monthly salary number out of a schema.org baseSalary (0 / missing -> null). */
export function ldSalary(ld: Record<string, any>): string | null {
  const v = ld?.baseSalary?.value
  const raw = v?.value ?? v?.Value ?? v?.minValue ?? null
  const n = typeof raw === "number" ? raw : Number(raw)
  if (!n || Number.isNaN(n) || n < 1000) return null
  const cur = ld?.baseSalary?.currency ?? ld?.salaryCurrency ?? "CLP"
  return `${cur} ${n.toLocaleString("es-CL")}${v?.unitText === "MONTH" ? " mensual" : ""}`
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  salary?: string | null
  snippet?: string | null
}

export interface JobDetail extends JobResult {
  description: string | null
  deadline: string | null
  employmentType: string | null
  category: string | null
}

function pad(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n)
}

export function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "Sin resultados."
  const header = [pad("ID", 12), pad("TÍTULO", 44), pad("EMPRESA", 26), pad("UBICACIÓN", 26), "FECHA"].join(" ")
  const lines = rows.map((r) =>
    [pad(r.id, 12), pad(r.title, 44), pad(r.company ?? "—", 26), pad(r.location ?? "—", 26), r.date ?? "—"].join(" "),
  )
  return [header, "-".repeat(header.length), ...lines].join("\n")
}

export function renderPlain(rows: JobResult[]): string {
  if (rows.length === 0) return "Sin resultados."
  return rows
    .map(
      (r) =>
        `${r.title}\n  ${r.company ?? "—"} · ${r.location ?? "—"} · ${r.date ?? "—"}${r.salary ? ` · ${r.salary}` : ""}\n  id: ${r.id}\n  ${r.url}`,
    )
    .join("\n\n")
}

export function emitSearch(rows: JobResult[], page: number, format: string, extraMeta: Record<string, unknown> = {}): void {
  if (format === "table") process.stdout.write(renderTable(rows) + "\n")
  else if (format === "plain") process.stdout.write(renderPlain(rows) + "\n")
  else
    process.stdout.write(
      JSON.stringify({ meta: { count: rows.length, page, ...extraMeta }, results: rows }, null, 2) + "\n",
    )
}

export function emitDetail(d: JobDetail, format: string): void {
  if (format === "plain") {
    const lines = [
      d.title,
      `${d.company ?? "—"} · ${d.location ?? "—"}`,
      `Publicado: ${d.date ?? "—"}   Cierre: ${d.deadline ?? "—"}`,
      d.employmentType ? `Jornada/contrato: ${d.employmentType}` : null,
      d.salary ? `Renta: ${d.salary}` : null,
      d.category ? `Área: ${d.category}` : null,
      d.url,
      "",
      d.description ?? "(sin descripción)",
    ].filter((l) => l !== null)
    process.stdout.write(lines.join("\n") + "\n")
  } else {
    process.stdout.write(JSON.stringify(d, null, 2) + "\n")
  }
}
