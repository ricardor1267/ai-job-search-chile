import { describe, expect, test } from "bun:test"
import { join } from "path"
import { buildSearchUrl, cityId, detailUrl, fechaCode, parseDetail, parseSearch } from "../src/helpers.ts"

const fx = (f: string) => Bun.file(join(import.meta.dir, "fixtures", f)).text()
const NOW = new Date("2026-10-19T10:40:00")

describe("parseSearch (real markup captured 2026-10-19)", () => {
  test("parses every well-formed card and skips the broken one", async () => {
    const rows = parseSearch(await fx("search.html"), NOW)
    expect(rows.map((r) => r.id)).toEqual(["3915813", "3888534", "3903250"])
  })
  test("extracts title, company, location, date, url, snippet", async () => {
    const r = parseSearch(await fx("search.html"), NOW)[1]
    expect(r).toMatchObject({
      title: "SUBJEFE DE TIENDA - QUILIN",
      company: "Confidencial",
      location: "Santiago",
      date: "2026-10-07",
      url: "https://www.chiletrabajos.cl/trabajo/subjefe-de-tienda-quilin-3888534",
      featured: true,
    })
    expect(r.snippet).toStartWith("Empresa del retail busca")
    expect(r.snippet).not.toContain("Ver más")
  })
  test("decodes entities and flags non-featured cards", async () => {
    const r = parseSearch(await fx("search.html"), NOW)[2]
    expect(r.title).toBe("Jefe de Tienda Coquinaria - Mall…")
    expect(r.company).toBe("Kitchen center spa")
    expect(r.featured).toBe(false)
  })
})

describe("parseDetail", () => {
  test("reads the JobPosting ld+json plus the info table", async () => {
    const d = parseDetail(await fx("detail.html"), "3888534")!
    expect(d).toMatchObject({
      id: "3888534",
      title: "SUBJEFE DE TIENDA - QUILIN",
      company: "Confidencial",
      location: "Santiago, RM",
      date: "2026-10-07",
      deadline: "2026-12-21",
      employmentType: "Full-time · Plazo fijo, luego indefinido",
      category: "Ventas / Comercial",
      salary: null,
      url: "https://www.chiletrabajos.cl/trabajo/x-3888534",
    })
    expect(d.description).toContain("Liderar equipos en pro de los objetivos propuestos.")
    expect(d.description).toContain("\n")
  })
  test("returns null for a page without a posting", () => {
    expect(parseDetail("<html><body>nada</body></html>", "1")).toBeNull()
  })
})

describe("URL building", () => {
  test("query, city, age code and offset pagination", () => {
    const u = new URL(buildSearchUrl({ query: "jefe de tienda", location: "Puente Alto", jobage: 14, page: 2 }))
    expect(u.pathname).toBe("/encuentra-un-empleo/30")
    expect(u.searchParams.get("2")).toBe("jefe de tienda")
    expect(u.searchParams.get("13")).toBe("1024")
    expect(u.searchParams.get("fecha")).toBe("6")
  })
  test("city lookup is accent/case-insensitive and accepts raw ids", () => {
    expect(cityId("CONCEPCIÓN")).toBe("1035")
    expect(cityId("1022")).toBe("1022")
    expect(cityId("Narnia")).toBeNull()
  })
  test("age codes follow the portal select", () => {
    expect([1, 2, 3, 5, 7, 14, 60].map(fechaCode)).toEqual(["1", "2", "3", "4", "5", "6", null])
  })
  test("detail accepts ids and portal URLs only", () => {
    expect(detailUrl("3888534")).toBe("https://www.chiletrabajos.cl/trabajo/x-3888534")
    expect(detailUrl("https://www.chiletrabajos.cl/trabajo/subjefe-de-tienda-quilin-3888534")).toBe("https://www.chiletrabajos.cl/trabajo/x-3888534")
    expect(detailUrl("https://evil.example.com/trabajo/x-3888534")).toBeNull()
    expect(detailUrl("abc")).toBeNull()
  })
})
