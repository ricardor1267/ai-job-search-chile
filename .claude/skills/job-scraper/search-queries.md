# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->
<!-- Fork chileno: portales y consultas adaptados al mercado laboral de Chile. Ver también
     .claude/skills/job-application-assistant/10-mercado-chile.md (sección 9: portales). -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. In this Chilean fork the portal CLIs are:

| CLI | Portal | Cobertura |
|-----|--------|-----------|
| `chiletrabajos-search` | chiletrabajos.cl | Generalista: operativos, administrativos, técnicos y profesionales |
| `computrabajo-search` | cl.computrabajo.com | Generalista de alto volumen: retail, servicios, ventas, operaciones |
| `trabajando-search` | trabajando.com | Generalista; muchas empresas grandes lo usan como ATS |
| `getonbrd-search` | getonbrd.com | Tecnología, startups y remoto (suele publicar rango salarial) |
| `linkedin-search` | linkedin.com/jobs | Profesionales, ejecutivos y tecnología (country-agnostic) |

Any other portal skill installed under `.agents/skills/` (including country-agnostic CLIs such as `freehire-search`, or one you add with `/add-portal`) is included the same way unless its frontmatter says `enabled: false`. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI (Laborum, Bolsa Nacional de Empleo, Empleos Públicos, Indeed Chile), company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). In Chile most postings are in **Spanish**, so Spanish queries come first; add English queries only if your Languages table includes English and you target multinationals or tech roles that post in English. A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language. Include common Chilean variants of the same title (e.g. "Analista", "Ejecutivo/a", "Encargado/a", "Jefe/a de", "Supervisor/a"), and both gendered forms where portals index them separately.

## Search Sites

Primary (Chilean job boards with a portal CLI; see the table above):
- **chiletrabajos.cl** - `chiletrabajos-search`
- **cl.computrabajo.com** - `computrabajo-search`
- **trabajando.com** - `trabajando-search`
- **getonbrd.com** - `getonbrd-search` (tech roles only)
- **linkedin.com/jobs** - LinkedIn job listings (filter: [YOUR_COUNTRY] / [YOUR_CITY]); also covered by `linkedin-search` CLI

WebSearch fallback (no CLI; use the `site:` queries below):
- **laborum.cl** - generalista, profesionales y administrativos
- **bne.cl** - Bolsa Nacional de Empleo (portal público del Estado)
- **empleospublicos.cl** - concursos y cargos del Estado (leer las bases completas: requisitos excluyentes y plazos estrictos)
- **cl.indeed.com** - agregador de avisos

Optional (your own additions - scaffold one with `/add-portal`):
- **[YOUR_JOB_BOARD]** - another board for your market
- **[YOUR_INDUSTRY_JOB_BOARD]** - a niche/industry board for your field (e.g. minería, salud, construcción)
- **[YOUR_ADDITIONAL_JOB_BOARD]** - another major board (optional)

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies (many large Chilean employers publish on their own "Trabaja con nosotros" page or on a Trabajando.com-hosted portal)

## Query Categories

Queries are grouped by priority. Write **each category in every language from your Languages table** (see Language scope above). Combine each query with your location terms (comuna, ciudad o región, e.g. "Santiago", "Región Metropolitana", "Antofagasta") where the site supports it.

**Organize by function, not job title.** The same underlying work carries different titles across companies and markets (a "Data Scientist" role at one employer may be posted as "Insights Analyst" or "Data Consultant" at another; in Chile an "Analista de Datos" may also appear as "Ingeniero/a de Datos" or "Analista BI"). Name each priority category after the function it covers, and list several plausible job titles as query variants within that category rather than betting an entire priority tier on one exact title string.

Illustrative Spanish titles (examples only, replace with your own): "Analista de Datos", "Ingeniero/a de Proyectos", "Jefe/a de Operaciones", "Asistente Administrativo/a", "Ejecutivo/a Comercial", "Técnico/a en Mantención", "Supervisor/a de Turno", "Desarrollador/a Full Stack".

### Priority 1: [YOUR_PRIMARY_ROLE_TYPE]

These match your strongest and most desired career direction.

```
site:laborum.cl "[YOUR_PRIMARY_JOB_TITLE_1]" [YOUR_CITY]
site:laborum.cl "[YOUR_PRIMARY_JOB_TITLE_2]" [YOUR_CITY]
site:cl.indeed.com "[YOUR_PRIMARY_JOB_TITLE_1]" [YOUR_CITY]
site:bne.cl "[YOUR_PRIMARY_JOB_TITLE_1]" [YOUR_REGION]
site:linkedin.com/jobs "[YOUR_PRIMARY_JOB_TITLE_1]" [YOUR_COUNTRY]
```

### Priority 2: [YOUR_DOMAIN_EXPERTISE]

These match your domain expertise.

```
site:laborum.cl [YOUR_DOMAIN_KEYWORD_1] [YOUR_CITY] OR [YOUR_REGION]
site:cl.indeed.com [YOUR_DOMAIN_KEYWORD_2] [YOUR_COUNTRY]
site:empleospublicos.cl [YOUR_DOMAIN_KEYWORD_1] [YOUR_REGION]
site:linkedin.com/jobs [YOUR_DOMAIN_KEYWORD_1] [YOUR_CITY] [YOUR_COUNTRY]
```

### Priority 3: [YOUR_ADJACENT_ROLE_TYPE]

Adjacent roles you could pivot into.

```
site:laborum.cl "[YOUR_ADJACENT_TITLE_1]" [YOUR_KEY_SKILL] [YOUR_CITY]
site:cl.indeed.com "[YOUR_ADJACENT_TITLE_2]" [YOUR_KEY_SKILL] [YOUR_CITY]
site:bne.cl "[YOUR_ADJACENT_TITLE_1]" [YOUR_REGION]
```

### Priority 4: Broader Technical / Consulting

Wider net for general technical roles.

```
site:laborum.cl "[YOUR_KEY_SKILL]" [YOUR_CITY]
site:cl.indeed.com "[YOUR_KEY_SKILL]" [YOUR_CITY]
site:empleospublicos.cl "[YOUR_KEY_SKILL]"
site:linkedin.com/jobs "[YOUR_KEY_SKILL]" [YOUR_CITY]
site:laborum.cl "consultor" [YOUR_DOMAIN] [YOUR_CITY]
```

For the CLI portals (`chiletrabajos-search`, `computrabajo-search`, `trabajando-search`, `getonbrd-search`, `linkedin-search`), translate the same titles, skills and location terms into each CLI's own flags as its `SKILL.md` specifies; do not pass `site:` strings to a CLI.

## Location Filter

When evaluating results, verify the job location is within reasonable commute distance from your home. In Chile, define areas by **comuna** (and region), and estimate door-to-door time by Metro/Red or car (see `10-mercado-chile.md`, section 7). Define acceptable areas:
- [YOUR_CITY] and surrounding areas
- [ACCEPTABLE_AREA_1]
- [ACCEPTABLE_AREA_2]
- [BORDERLINE_AREA] (borderline - ~X min by transit)
- [TOO_FAR_AREA] (too far)

Remote ("remoto") and hybrid ("híbrido") postings pass the location filter if the on-site days are compatible with the tiers above. Shift work at remote sites ("faena", e.g. 7x7, 4x4) is judged by the distance to the departure city and by the user's schedule constraints, not by daily commute.

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table. When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring a language you haven't declared at all is excluded; a posting requiring a higher level than you declared in a language you do work in is not excluded, flag it clearly instead (see `job-scraper/SKILL.md`'s Step 3 "Quick Fit Assessment" for how the flag surfaces in `/scrape` output). Postings simply *written* in a language you don't work in, that don't require it on the job, are fine. In Chile, "inglés intermedio" or "inglés avanzado" requirements are common; compare them against your declared English level.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown". Empleos Públicos concursos have a fixed closing date ("fecha de cierre"): exclude any concurso whose closing date has passed.

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape [focus_area]" -> relevant category queries + custom focus-specific queries
- "/scrape sector público" -> priority categories run against `site:empleospublicos.cl` and `site:bne.cl`
- "/scrape tecnología" or "/scrape remoto" -> favor `getonbrd-search` and `linkedin-search`
