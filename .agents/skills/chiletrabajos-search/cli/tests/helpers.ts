import { join } from "path"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"

const CLI_PATH = join(import.meta.dir, "../src/cli.ts")

export interface CLIResult {
  stdout: string
  stderr: string
  exitCode: number
}

export async function runCLI(args: string[], preload?: string): Promise<CLIResult> {
  const proc = Bun.spawn(["bun", "run", ...(preload ? ["--preload", preload] : []), CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

/**
 * Run the real CLI offline: every fetch is answered from a saved fixture instead of
 * the network. `routes` maps a URL substring to a fixture file in tests/fixtures/
 * (first match wins). Returns the requested URLs so tests can assert on them.
 */
export async function runCLIOffline(
  args: string[],
  routes: Record<string, string>,
): Promise<{ result: CLIResult; requests: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), "cl-portal-test-"))
  const log = join(dir, "requests.log")
  const preload = join(dir, "fetch.ts")
  const fixtures = Object.fromEntries(
    Object.entries(routes).map(([k, f]) => [k, join(import.meta.dir, "fixtures", f)]),
  )
  writeFileSync(
    preload,
    `
    import { appendFileSync, readFileSync } from "node:fs"
    const routes = ${JSON.stringify(fixtures)}
    globalThis.fetch = async (input) => {
      const url = input instanceof Request ? input.url : String(input)
      appendFileSync(${JSON.stringify(log)}, url + "\\n")
      for (const [needle, file] of Object.entries(routes)) {
        if (url.includes(needle)) return new Response(readFileSync(file, "utf8"), { status: 200 })
      }
      return new Response("not found", { status: 404 })
    }
  `,
  )
  try {
    const result = await runCLI(args, preload)
    let requests: string[] = []
    try {
      requests = (await Bun.file(log).text()).trim().split("\n").filter(Boolean)
    } catch {}
    return { result, requests }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function parseJSON<T = unknown>(result: CLIResult): T {
  if (result.exitCode !== 0) throw new Error(`CLI exited ${result.exitCode}. stderr: ${result.stderr}`)
  return JSON.parse(result.stdout) as T
}

export function parseError(result: CLIResult): { error: string; code: string } {
  return JSON.parse(result.stderr.split("\n").pop() as string)
}
