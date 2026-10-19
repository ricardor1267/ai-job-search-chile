# Get on Board — referencia de API

Revisado en vivo el 2026-10-19. robots.txt sin reglas `Disallow`.

## Búsqueda (pública)

```
GET https://www.getonbrd.com/api/v0/search/jobs?query=<q>&per_page=<n>&page=<n>&expand=["company"]
```

Respuesta: `{ data: [ { id (slug), type: "job", attributes: {...}, links: { public_url } } ], meta: { page, per_page, total_pages } }`.

Atributos usados: `title`, `countries` (`["Chile"]`, `["Remoto"]`), `remote`, `remote_modality`,
`published_at` (unix, segundos), `min_salary` / `max_salary` (USD mensual), `category_name`,
`projects`, `functions(_headline)`, `description(_headline)`, `desirable(_headline)`,
`benefits(_headline)` (HTML), `company.data.attributes.name` (con `expand=["company"]`).

`country_code` no filtra; la ubicación se filtra en el cliente sobre `countries`.

## Detalle

`GET /api/v0/jobs/<id>` responde **401** sin token. El CLI:

1. Lee la página pública `https://www.getonbrd.com/jobs/<id>` (redirige a `/empleos/<categoría>/<id>`).
2. Extrae el slug de la empresa del microdato `<span itemprop="url" class="hide">https://www.getonbrd.com/companies/<slug></span>`.
3. Consulta `GET /api/v0/companies/<slug>/jobs?per_page=100&page=<n>` (público, hasta 3 páginas) y toma la oferta con ese `id`.

La página pública no tiene JSON-LD; usa microdatos schema.org (`itemprop="title"`, `datePosted`, `description`, `skills`).
