import { describe, expect, test } from "bun:test"
import { parseError, parseJSON, runCLI, runCLIOffline } from "./helpers.ts"

describe("flag validation", () => {
  test("unknown flag exits 1 with JSON error on stderr", async () => {
    const r = await runCLI(["search", "-q", "bodega", "--bogus", "x"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("UNKNOWN_FLAG")
    expect(r.stdout).toBe("")
  })
  test("unknown location is rejected, not silently dropped", async () => {
    const r = await runCLI(["search", "-q", "bodega", "-l", "Narnia"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("BAD_LOCATION")
  })
  test.each([["--jobage", "0"], ["--page", "1.5"], ["--limit", "abc"], ["--format", "xml"]])("%s %s -> BAD_ARG", async (flag, val) => {
    const r = await runCLI(["search", "-q", "bodega", flag, val])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("BAD_ARG")
  })
  test("detail without id", async () => {
    const r = await runCLI(["detail"])
    expect(r.exitCode).toBe(1)
    expect(parseError(r).code).toBe("NO_ID")
  })
})

describe("offline end-to-end", () => {
  test("search emits the contract JSON shape and builds the expected request", async () => {
    const { result, requests } = await runCLIOffline(
      ["search", "-q", "jefe de tienda", "-l", "Santiago", "--limit", "2"],
      { "/encuentra-un-empleo": "search.html" },
    )
    const out = parseJSON<{ meta: { count: number; page: number }; results: any[] }>(result)
    expect(out.meta).toEqual({ count: 2, page: 1 })
    for (const r of out.results) {
      for (const k of ["id", "title", "company", "location", "date", "url"]) expect(r).toHaveProperty(k)
    }
    expect(requests).toHaveLength(1)
    expect(new URL(requests[0]).searchParams.get("13")).toBe("1022")
  })
  test("detail --format plain prints readable text", async () => {
    const { result, requests } = await runCLIOffline(["detail", "3888534", "--format", "plain"], { "/trabajo/x-3888534": "detail.html" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toStartWith("SUBJEFE DE TIENDA - QUILIN")
    expect(result.stdout).toContain("Cierre: 2026-12-21")
    expect(requests[0]).toBe("https://www.chiletrabajos.cl/trabajo/x-3888534")
  })
  test("a 404 detail exits 1 with NOT_FOUND", async () => {
    const { result } = await runCLIOffline(["detail", "1234567"], {})
    expect(result.exitCode).toBe(1)
    expect(parseError(result).code).toBe("NOT_FOUND")
  })
})

// Live smoke test against the real portal. Off by default (CI must not hit portals);
// run locally with:  LIVE=1 bun test tests/live.test.ts
