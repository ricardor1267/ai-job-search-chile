import { describe, expect, test } from "bun:test"
import { join } from "path"
import { buildSearchUrl, detailId, parseDetail, parseSearch, regionId } from "../src/helpers.ts"

const fx = async (f: string) => JSON.parse(await Bun.file(join(import.meta.dir, "fixtures", f)).text())

describe("parseSearch (API shape captured 2026-10-19)", () => {
  test("maps offers to the contract and drops empty ones", async () => {
    const rows = parseSearch(await fx("search.json"))
    expect(rows.map((r) => r.id)).toEqual(["6137907", "6133832", "6129001"])
    expect(rows[0]).toMatchObject({
      title: "Jefe de Ventas Pt 18hrs - Quilicura Easton",
      company: "abc",
      location: "Quilicura, Metropolitana de Santiago",
      date: "2026-10-19",
      url: "https://www.trabajando.cl/trabajo/6137907",
      workday: "Part Time",
      featured: false,
    })
    expect(rows[2].snippet).toBe("Levi Strauss & Co, está en búsqueda...")
  })
  test("null / empty API payloads give no rows", () => {
    expect(parseSearch(null)).toEqual([])
    expect(parseSearch({})).toEqual([])
  })
})

describe("parseDetail", () => {
  test("builds readable text from description + requirements", async () => {
    const d = parseDetail(await fx("detail.json"), "6137907")!
    expect(d).toMatchObject({
      title: "Jefe de Ventas Pt 18hrs - Quilicura Easton",
      company: "abc",
      location: "Quilicura, Metropolitana de Santiago",
      date: "2026-10-19",
      deadline: "2026-12-18",
      salary: null,
      employmentType: "Part Time",
      url: "https://www.trabajando.cl/trabajo/6137907-jefe-de-ventas-pt-18hrs-quilicura-easton",
    })
    expect(d.description).toContain("Requisitos mínimos:")
    expect(d.description).toContain("• Experiencia previa en retail (excluyente)")
    expect(d.description).toContain("Experiencia: Desde 1 año(s)")
  })
  test("confidential offers hide the company; shown salary is formatted", async () => {
    const raw = { ...(await fx("detail.json")), ofertaConfidencial: true, mostrarSueldo: true, sueldo: 950000 }
    const d = parseDetail(raw, "6137907")!
    expect(d.company).toBe("Confidencial")
    expect(d.salary).toBe("CLP 950.000")
  })
  test("missing payload -> null", () => {
    expect(parseDetail(null, "1")).toBeNull()
    expect(parseDetail({}, "1")).toBeNull()
  })
})

describe("URL building", () => {
  test("region aliases resolve to API facet ids", () => {
    expect(regionId("RM")).toBe("1")
    expect(regionId("Región Metropolitana de Santiago")).toBe("1")
    expect(regionId("R. Valparaíso")).toBe("6")
    expect(regionId("Ñuble")).toBe("556")
    expect(regionId("Región del Biobío")).toBe("9")
    expect(regionId("Puente Alto")).toBeNull()
  })
  test("search sorts newest first", () => {
    const u = new URL(buildSearchUrl({ query: "jefe de tienda", location: "Santiago", page: 2 }))
    expect(u.pathname).toBe("/api/searchjob")
    expect(Object.fromEntries(u.searchParams)).toEqual({
      palabraClave: "jefe de tienda", pagina: "2", region: "1", orden: "FECHA_PUBLICACION", tipoOrden: "DESC",
    })
  })
  test("detail ids", () => {
    expect(detailId("6137907")).toBe("6137907")
    expect(detailId("https://www.trabajando.cl/trabajo/6137907-jefe-de-ventas")).toBe("6137907")
    expect(detailId("https://www.trabajando.cl/trabajo-empleo/jefe/trabajo/6132174-jefe-de-tienda")).toBe("6132174")
    expect(detailId("https://example.com/trabajo/6137907")).toBeNull()
  })
})
