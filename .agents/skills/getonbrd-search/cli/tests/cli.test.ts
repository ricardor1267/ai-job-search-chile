import { describe, expect, test } from "bun:test"
import { parseError, parseJSON, runCLI, runCLIOffline } from "./helpers.ts"

test("missing --query", async () => {
  const r = await runCLI(["search"])
  expect(r.exitCode).toBe(1)
  expect(parseError(r).code).toBe("NO_QUERY")
})

describe("offline end-to-end", () => {
  test("search with client-side location filter", async () => {
    const { result, requests } = await runCLIOffline(["search", "-q", "data", "-l", "Chile"], { "/api/v0/search/jobs": "search.json" })
    const out = parseJSON<{ meta: any; results: any[] }>(result)
    expect(out.results.map((r) => r.id)).toEqual(["analista-de-datos-acme-santiago"])
    for (const k of ["id", "title", "company", "location", "date", "url"]) expect(out.results[0]).toHaveProperty(k)
    expect(new URL(requests[0]).searchParams.get("per_page")).toBe("50")
  })
  test("detail goes page -> company jobs API", async () => {
    const id = "semi-senior-java-developer-etl-23people-remote-ebb4"
    const { result, requests } = await runCLIOffline(["detail", id, "--format", "plain"], {
      [`/jobs/${id}`]: "job-page.html",
      "/api/v0/companies/23people-cl/jobs": "company-jobs.json",
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toStartWith("Semi Senior Java Developer / ETL")
    expect(requests).toEqual([
      `https://www.getonbrd.com/jobs/${id}`,
      "https://www.getonbrd.com/api/v0/companies/23people-cl/jobs?per_page=100&page=1",
    ])
  })
  test("closed job -> NOT_FOUND", async () => {
    const { result } = await runCLIOffline(["detail", "cargo-cerrado-acme"], {})
    expect(result.exitCode).toBe(1)
    expect(parseError(result).code).toBe("NOT_FOUND")
  })
})
