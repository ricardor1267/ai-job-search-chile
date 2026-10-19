# Computrabajo Chile — referencia de URLs y parseo

Revisado en vivo el 2026-10-19.

## robots.txt (importante)

`User-agent: *` **prohíbe** en `/ofertas-de-trabajo/` los parámetros `dis=`, `cont=`, `pubdate=`, `sal=`,
`by=`, `emp=` (y variantes `em*`), además de `/Ajax/`, `/_services/`, `/go/`, `/hojas-de-vida/`,
`/curriculums/` y `Detail/Print.aspx`. Por eso el CLI **no** usa los filtros de fecha, orden ni sueldo
del portal; sólo pagina con `?p=`.

## Búsqueda

```
https://cl.computrabajo.com/trabajo-de-<consulta-slug>[-en-<lugar-slug>][?p=<página>]
```

- `<consulta-slug>`: minúsculas, sin tildes, separadores `-` (`jefe-de-tienda`).
- `<lugar-slug>`: región (`rmetropolitana`, `valparaiso`, `biobio`) o comuna (`puente-alto`, `maipu`).
  Un slug que no existe devuelve una página válida con 0 resultados.
- 20 resultados por página; el enlace "Siguiente" apunta a `?p=2`.

### Anclajes del listado

```html
<article class="box_offer sel outstanding" data-id="<ID HEX 32>">   ← "outstanding" / "Empleo destacado" = destacado
  <h2 ...><a class="js-o-link fc_base" href="/ofertas-de-trabajo/oferta-de-trabajo-de-...-<ID>#lc=...">TÍTULO</a></h2>
  <p class="dFlex vm_fx fs16 fc_base mt5">                         ← nota de la empresa + empresa
    <span class="fx_none mr10"><span class="fwB"> 4,0 </span>...</span>
    <a ... offer-grid-article-company-url=""> Empresa </a></p>      ← ausente en ofertas confidenciales
  <p class="fs16 fc_base mt5"><span class="mr10"> Santiago - Maipú, R.Metropolitana </span></p>
  <div class="fs13 mt15"><span class="dIB mr10"><span class="icon i_salary"></span> $ 1.500.000,00 (Mensual) </span></div>  ← opcional
  <p class="fs13 fc_aux mt15"> Hace  4  horas </p>                  ← fecha relativa: Hace N horas/días, Ayer, Hace más de 30 días
</article>
```

Atención: la `<p>` de la nota también contiene `fs16 fc_base mt5`; la ubicación se ancla en la clase
**exacta** `class="fs16 fc_base mt5"`.

## Detalle

```
https://cl.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-<cualquier-slug>-<ID HEX>
```

Un slug arbitrario (`oferta-de-trabajo-de-x-<ID>`) carga la misma oferta.

- `<script type="application/ld+json">` con `@graph`; el elemento `@type: JobPosting` trae `title`,
  `description` (escapado `\uXXXX`, con `<br/>` y el bloque `-Requerimientos-`), `datePosted` (fecha
  original; el listado muestra la última actualización), `validThrough`, `hiringOrganization.name`,
  `baseSalary.value.value`, `industry`, `employmentType` (`OTHER` frecuente).
- `jobLocation.address` tiene los campos **invertidos**: `addressRegion` = "Santiago - Las condes",
  `addressLocality` = "R.Metropolitana".
