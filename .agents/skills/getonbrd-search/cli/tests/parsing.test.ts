import { describe, expect, test } from "bun:test"
import { join } from "path"
import { buildSearchUrl, companySlugFromPage, detailIdFrom, matchesLocation, parseSearch, toDetail } from "../src/helpers.ts"

const fx = (f: string) => Bun.file(join(import.meta.dir, "fixtures", f)).text()

describe("parseSearch (API shape captured 2026-10-19)", () => {
  test("maps jobs and drops empty ones", async () => {
    const rows = parseSearch(JSON.parse(await fx("search.json")))
    expect(rows.map((r) => r.id)).toEqual(["semi-senior-java-developer-etl-23people-remote-ebb4", "analista-de-datos-acme-santiago"])
    expect(rows[0]).toMatchObject({
      title: "Semi Senior Java Developer / ETL",
      company: "23people",
      location: "Remoto",
      salary: "USD 2.000 - 2.200 mensual",
      remote: true,
      url: "https://www.getonbrd.com/jobs/semi-senior-java-developer-etl-23people-remote-ebb4",
    })
    expect(rows[0].date).toMatch(/^2026-10-1[89]$/)
    expect(rows[1]).toMatchObject({ location: "Chile", salary: null, remote: false })
  })
  test("location filter matches countries and remote", async () => {
    const rows = parseSearch(JSON.parse(await fx("search.json")))
    expect(rows.filter((r) => matchesLocation(r, "chile")).map((r) => r.id)).toEqual(["analista-de-datos-acme-santiago"])
    expect(rows.filter((r) => matchesLocation(r, "Remoto")).map((r) => r.id)).toEqual(["semi-senior-java-developer-etl-23people-remote-ebb4"])
  })
})

describe("detail", () => {
  test("company slug comes from the public page microdata", async () => {
    expect(companySlugFromPage(await fx("job-page.html"))).toBe("23people-cl")
    expect(companySlugFromPage("<html></html>")).toBeNull()
  })
  test("toDetail joins the sections into readable text", async () => {
    const job = JSON.parse(await fx("search.json")).data[0]
    const d = toDetail(job, null)!
    expect(d.description).toContain("Funciones del cargo:\nEl Semi Senior Developer")
    expect(d.description).toContain("Skills Excluyentes:\n• Experiencia excluyente trabajando con Java.")
    expect(d.description).toContain("• Seguro complementario: Seguro de salud")
    expect(d.employmentType).toBe("remote local")
  })
  test("ids from slugs and URLs", () => {
    expect(detailIdFrom("semi-senior-java-developer-etl-23people-remote-ebb4")).toBe("semi-senior-java-developer-etl-23people-remote-ebb4")
    expect(detailIdFrom("https://www.getonbrd.com/empleos/data-science-analytics/semi-senior-java-developer-etl-23people-remote-ebb4")).toBe("semi-senior-java-developer-etl-23people-remote-ebb4")
    expect(detailIdFrom("https://www.getonbrd.com/jobs/analista-de-datos-acme-santiago")).toBe("analista-de-datos-acme-santiago")
    expect(detailIdFrom("https://example.com/jobs/x-y")).toBeNull()
    expect(detailIdFrom("1234")).toBeNull()
  })
  test("search URL expands company", () => {
    const u = new URL(buildSearchUrl({ query: "data", page: 2 }, 50))
    expect(Object.fromEntries(u.searchParams)).toEqual({ query: "data", per_page: "50", page: "2", expand: '["company"]' })
  })
})
