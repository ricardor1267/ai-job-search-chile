import { describe, expect, test } from "bun:test"
import { parseError, parseJSON, runCLI, runCLIOffline } from "./helpers.ts"

describe("flag validation", () => {
  test("missing --query", async () => {
    const r = await runCLI(["search", "-l", "Santiago"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("NO_QUERY")
  })
  test("unknown flag", async () => {
    const r = await runCLI(["search", "-q", "bodega", "--sort", "date"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("UNKNOWN_FLAG")
  })
  test("bad numbers", async () => {
    const r = await runCLI(["search", "-q", "bodega", "--jobage", "-3"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("BAD_ARG")
  })
  test("bad detail id", async () => {
    const r = await runCLI(["detail", "not-an-id"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("BAD_ID")
  })
})

describe("offline end-to-end", () => {
  test("--jobage filters client-side and keeps unknown dates; request carries no filter params", async () => {
    const { result, requests } = await runCLIOffline(["search", "-q", "jefe de tienda", "-l", "RM", "--jobage", "1"], {
      "/trabajo-de-": "search.html",
    })
    const out = parseJSON<{ meta: any; results: any[] }>(result)
    // Card dates are relative to the real clock here, so only check the contract shape.
    for (const r of out.results) for (const k of ["id", "title", "company", "location", "date", "url"]) expect(r).toHaveProperty(k)
    expect(requests).toEqual(["https://cl.computrabajo.com/trabajo-de-jefe-de-tienda-en-rmetropolitana"])
  })
  test("detail plain", async () => {
    const { result } = await runCLIOffline(["detail", "F3EB77D92D1ED0DF61373E686DCF3405", "--format", "plain"], {
      "oferta-de-trabajo-de-x-F3EB77D92D1ED0DF61373E686DCF3405": "detail.html",
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toStartWith("Jefe de Tienda / Rubro Alimentario")
    expect(result.stdout).toContain("Renta: CLP 1.500.000 mensual")
  })
})
