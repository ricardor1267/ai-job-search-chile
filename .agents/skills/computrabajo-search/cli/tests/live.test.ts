import { expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers.ts"

const live = process.env.LIVE === "1" ? test : test.skip

live("live: search returns real postings and detail reads one", async () => {
  const s = parseJSON<{ results: any[] }>(await runCLI(["search", "-q", "jefe de tienda", "-l", "Región Metropolitana", "--limit", "5"]))
  expect(s.results.length).toBeGreaterThan(0)
  for (const r of s.results) {
    expect(r.id).toBeTruthy()
    expect(r.title).toBeTruthy()
    expect(r.url).toStartWith("https://cl.computrabajo.com/")
  }
  const d = parseJSON<{ title: string; description: string }>(await runCLI(["detail", s.results[0].id]))
  expect(d.title).toBeTruthy()
  expect(d.description?.length ?? 0).toBeGreaterThan(50)
})
