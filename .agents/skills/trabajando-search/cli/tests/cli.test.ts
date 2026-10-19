import { describe, expect, test } from "bun:test"
import { parseError, parseJSON, runCLI, runCLIOffline } from "./helpers.ts"

describe("flag validation", () => {
  test("comuna as --location is rejected with a hint", async () => {
    const r = await runCLI(["search", "-q", "bodega", "-l", "Puente Alto"])
    expect(r.exitCode).toBe(1)
    const e = parseError(r)
    expect(e.code).toBe("BAD_LOCATION")
    expect(e.error).toContain("--query")
  })
  test("unknown flag", async () => {
    const r = await runCLI(["search", "--salary", "1000000"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("UNKNOWN_FLAG")
  })
})

describe("offline end-to-end", () => {
  test("search JSON shape + meta totals", async () => {
    const { result, requests } = await runCLIOffline(["search", "-q", "jefe de tienda", "-l", "RM", "-n", "2"], {
      "/api/searchjob": "search.json",
    })
    const out = parseJSON<{ meta: any; results: any[] }>(result)
    expect(out.meta).toEqual({ count: 2, page: 1, total: 83, pages: 6 })
    for (const r of out.results) for (const k of ["id", "title", "company", "location", "date", "url"]) expect(r).toHaveProperty(k)
    expect(new URL(requests[0]).searchParams.get("region")).toBe("1")
  })
  test("detail plain", async () => {
    const { result, requests } = await runCLIOffline(["detail", "6137907", "--format", "plain"], { "/api/ofertas/6137907": "detail.json" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toStartWith("Jefe de Ventas Pt 18hrs - Quilicura Easton")
    expect(requests).toEqual(["https://www.trabajando.cl/api/ofertas/6137907"])
  })
  test("detail 404", async () => {
    const { result } = await runCLIOffline(["detail", "9999999"], {})
    expect(result.exitCode).toBe(1)
    expect(parseError(result).code).toBe("NOT_FOUND")
  })
})
