import { describe, expect, test } from "bun:test"
import { join } from "path"
import { buildSearchUrl, detailUrl, parseDetail, parseSearch, placeSlug, slugify } from "../src/helpers.ts"

const fx = (f: string) => Bun.file(join(import.meta.dir, "fixtures", f)).text()
const NOW = new Date("2026-10-19T10:40:00")

describe("parseSearch (real markup captured 2026-10-19)", () => {
  test("parses well-formed cards, skips the broken one", async () => {
    const rows = parseSearch(await fx("search.html"), NOW)
    expect(rows.map((r) => r.id)).toEqual([
      "475B780BDEBBFF2B61373E686DCF3405",
      "F3EB77D92D1ED0DF61373E686DCF3405",
      "98F7CE74FE3DCE1E61373E686DCF3405",
    ])
  })
  test("location is not confused with the company rating", async () => {
    const r = parseSearch(await fx("search.html"), NOW)[0]
    expect(r).toMatchObject({
      title: "Sub Jefe (a) de Tienda Full Time 42 Hrs Semanales",
      company: "Bix S.A.",
      location: "Santiago - Maipú, R.Metropolitana",
      date: "2026-10-19",
      featured: true,
    })
    expect(r.url).toBe("https://cl.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-sub-jefe-a-de-tienda-full-time-42-hrs-semanales-espacio-urbano-maipu-en-santiago-maipu-475B780BDEBBFF2B61373E686DCF3405")
  })
  test("salary is captured when published; relative dates resolve", async () => {
    const r = parseSearch(await fx("search.html"), NOW)[1]
    expect(r.salary).toBe("$ 1.500.000,00 (Mensual)")
    expect(r.date).toBe("2026-10-18")
    expect(r.featured).toBe(false)
  })
  test("blind offer: no company, vague date stays null", async () => {
    const r = parseSearch(await fx("search.html"), NOW)[2]
    expect(r.company).toBeNull()
    expect(r.location).toBe("Puente Alto, R.Metropolitana")
    expect(r.date).toBeNull()
  })
})

describe("parseDetail", () => {
  test("reads the JobPosting from the ld+json @graph (\\u-escaped like the live page)", async () => {
    const d = parseDetail(await fx("detail.html"), "F3EB77D92D1ED0DF61373E686DCF3405")!
    expect(d).toMatchObject({
      title: "Jefe de Tienda / Rubro Alimentario",
      company: "Grafton Latam",
      location: "Santiago - Las condes, R.Metropolitana",
      date: "2026-08-31",
      deadline: "2026-10-30",
      salary: "CLP 1.500.000 mensual",
      employmentType: null,
      category: "RRHH / Personal",
    })
    expect(d.description).toContain("¿Tienes experiencia liderando tiendas")
    expect(d.description).toContain("Requerimientos:\nEducación mínima: Universitaria / I.P. / C.F.T.\n3 años de experiencia")
  })
})

describe("URL building (never sends robots-disallowed filter params)", () => {
  test("slugs and region aliases", () => {
    expect(slugify("Jefe de Tienda / Bodega")).toBe("jefe-de-tienda-bodega")
    expect(placeSlug("Región Metropolitana")).toBe("rmetropolitana")
    expect(placeSlug("RM")).toBe("rmetropolitana")
    expect(placeSlug("Puente Alto")).toBe("puente-alto")
    expect(placeSlug("Maipú")).toBe("maipu")
  })
  test("page uses ?p= only", () => {
    expect(buildSearchUrl({ query: "jefe de tienda", location: "Santiago", page: 1 })).toBe("https://cl.computrabajo.com/trabajo-de-jefe-de-tienda-en-rmetropolitana")
    const u = new URL(buildSearchUrl({ query: "bodega", location: "Puente Alto", page: 3 }))
    expect(u.pathname).toBe("/trabajo-de-bodega-en-puente-alto")
    expect([...u.searchParams.keys()]).toEqual(["p"])
  })
  test("detail accepts hex ids and portal URLs only", () => {
    const want = "https://cl.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-x-F3EB77D92D1ED0DF61373E686DCF3405"
    expect(detailUrl("F3EB77D92D1ED0DF61373E686DCF3405")).toBe(want)
    expect(detailUrl("https://cl.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-jefe-de-tienda-F3EB77D92D1ED0DF61373E686DCF3405#lc=x")).toBe(want)
    expect(detailUrl("https://example.com/oferta-F3EB77D92D1ED0DF61373E686DCF3405")).toBeNull()
    expect(detailUrl("123")).toBeNull()
  })
})
