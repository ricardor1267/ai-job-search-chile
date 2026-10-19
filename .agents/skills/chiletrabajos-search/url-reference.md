# Chiletrabajos — referencia de URLs y parseo

Revisado en vivo el 2026-10-19.

## robots.txt

`User-agent: *` sólo prohíbe `/partners/` y `/ofertasmuchomas`; bloquea por completo a `Scrapy` y `proximic`.
Las rutas `/encuentra-un-empleo` y `/trabajo/` están permitidas.

## Búsqueda

```
https://www.chiletrabajos.cl/encuentra-un-empleo[/<offset>]?action=search&2=<consulta>&13=<id ciudad>&fecha=<código>
```

| Parámetro | Significado |
|-----------|-------------|
| `2` | Texto de búsqueda |
| `13` | Ciudad/provincia (select "Ciudad"; ids en `CITY_IDS`, `helpers.ts`). Ej.: Santiago `1022`, Puente Alto `1024`, San Bernardo `1025`, Concepción `1035`, Valparaíso `1014` |
| `fecha` | `1` hoy · `2` desde ayer · `3` menos de 3 días · `4` menos de 6 días · `5` una semana · `6` un mes |
| `categoria`, `14`, `inclusion` | Área, jornada (21 part-time, 22 full-time) e inclusión — no usados por el CLI |
| `<offset>` | Paginación por desplazamiento: página N → `(N-1)*30` |

Otros parámetros del formulario (`order_by`, `ord`, `within`, `filterSearch`) no son necesarios.

### Anclajes del listado (una tarjeta por aviso)

```html
<div class="job-item with-thumb destacado no-hover ">        ← "destacado" = aviso pagado (featured)
  <h2 class="title ..."><a href="https://www.chiletrabajos.cl/trabajo/<slug>-<id>">TÍTULO</a></h2>
  <h3 class="meta"> Empresa, <a href=".../ciudad/santiago.html">Santiago</a></h3>
  <h3 class="meta"><a ...><i class="far fa-calendar"></i> 16 de  Octubre de 2026</a></h3>
  <p class="description"> extracto… <a class="ver-mas-btn">Ver más</a></p>
  <a class="btn guardar" data-id="<id>">
</div>
```

El HTML se divide en `<div class="job-item` y cada tarjeta se parsea por separado.

## Detalle

```
https://www.chiletrabajos.cl/trabajo/<cualquier-slug>-<id>      (p. ej. /trabajo/x-3888534)
```

- `<script type="application/ld+json">` con `@type: JobPosting`: `title`, `hiringOrganization.name`,
  `jobLocation.address.{addressLocality,addressRegion}`, `datePosted` (`2026-10-07 16:25:37`),
  `validThrough` (cierre), `description` (texto con **CR/LF crudos dentro del string JSON** —
  `escapeControlCharsInStrings` en `core.ts` lo resuelve), `employmentType`, `industry`,
  `baseSalary.value.Value` (0 = no publicada).
- Tabla `<table class="table table-sm">` con filas `ID`, `Buscado` (empresa), `Fecha`, `Expira`,
  `Ubicación`, `Categoría`, `Salario`, `Duración` (tipo de contrato), `Tipo` (jornada).
