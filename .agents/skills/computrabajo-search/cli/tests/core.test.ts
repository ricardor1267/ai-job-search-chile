import { describe, expect, test } from "bun:test"
import { decodeEntities, findJobPostingLd, htmlToText, parseFlags, parseSpanishDate, withinDays } from "../src/core.ts"

const NOW = new Date("2026-10-19T10:40:00")

describe("parseSpanishDate", () => {
  test.each([
    ["16 de  Octubre de 2026", "2026-10-16"],
    ["07 de septiembre de 2026", "2026-09-07"],
    ["2026-10-07 16:25:37", "2026-10-07"],
    ["19/10/2026", "2026-10-19"],
    ["Hace  4  horas", "2026-10-19"],
    ["Hace 14 horas", "2026-10-18"],
    ["Ayer", "2026-10-18"],
    ["Hace 2 días", "2026-10-17"],
    ["Hace 13 días", "2026-10-06"],
    ["Publicada hoy", "2026-10-19"],
    ["Hace 2 semanas", "2026-10-05"],
  ])("%s -> %s", (raw, want) => {
    expect(parseSpanishDate(raw, NOW)).toBe(want)
  })
  test("unknown or vague dates are null, never guessed", () => {
    expect(parseSpanishDate("Hace más de 30 días", NOW)).toBeNull()
    expect(parseSpanishDate("", NOW)).toBeNull()
    expect(parseSpanishDate(null, NOW)).toBeNull()
    expect(parseSpanishDate("Oferta destacada", NOW)).toBeNull()
  })
})

test("withinDays keeps unknown dates and drops old ones", () => {
  expect(withinDays(null, 7, NOW)).toBe(true)
  expect(withinDays("2026-10-15", 7, NOW)).toBe(true)
  expect(withinDays("2026-09-01", 7, NOW)).toBe(false)
})

test("decodeEntities handles Spanish named and numeric entities", () => {
  expect(decodeEntities("Jefe de Producci&oacute;n &amp; Log&#237;stica &iquest;S&iacute;? &#x00F1;")).toBe("Jefe de Producción & Logística ¿Sí? ñ")
})

test("htmlToText keeps list items and paragraph breaks", () => {
  expect(htmlToText("<p>Requisitos:</p><ul><li>Uno</li><li>Dos</li></ul>")).toBe("Requisitos:\n\n• Uno\n• Dos")
})

test("findJobPostingLd tolerates raw CR/LF inside JSON strings and @graph wrappers", () => {
  const raw = '<script type="application/ld+json">{"@type":"JobPosting","title":"A","description":"x\r\ny"}</script>'
  expect(findJobPostingLd(raw)?.description).toBe("x\r\ny")
  const graph = '<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"JobPosting","title":"B"}]}</script>'
  expect(findJobPostingLd(graph)?.title).toBe("B")
})

test("parseFlags resolves aliases and booleans", () => {
  const f = parseFlags(["search", "-q", "jefe de tienda", "-l", "Santiago", "--help"])
  expect(f._).toEqual(["search"])
  expect(f.query).toBe("jefe de tienda")
  expect(f.location).toBe("Santiago")
  expect(f.help).toBe(true)
})
