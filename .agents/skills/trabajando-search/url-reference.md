# Trabajando.com — referencia de API

Revisado en vivo el 2026-10-19. Es la misma API JSON que usa el buscador del sitio.

## robots.txt

`Allow: /` con exclusiones para `/recomendadas/`, `/ingresa-a-tu-cuenta/`, `/crea-tu-curriculum/` y
patrones de blog. `/api/` no está prohibido.

## Búsqueda

```
GET https://www.trabajando.cl/api/searchjob?palabraClave=<q>&pagina=<n>&region=<id>&orden=FECHA_PUBLICACION&tipoOrden=DESC
```

| Parámetro | Significado |
|-----------|-------------|
| `palabraClave` | Texto (opcional) |
| `pagina` | 1-indexada, 15 resultados por página |
| `region` | id de región (faceta `region`): RM `1`, Tarapacá `2`, Antofagasta `3`, Atacama `4`, Coquimbo `5`, Valparaíso `6`, O'Higgins `7`, Maule `8`, Biobío `9`, Araucanía `10`, Los Lagos `11`, Aysén `12`, Magallanes `13`, Extranjero `14`, Los Ríos `472`, Arica y Parinacota `473`, Ñuble `556` |
| `orden` / `tipoOrden` | `FECHA_PUBLICACION` + `DESC` = más nuevas primero (el sitio usa `RANKING` por defecto) |

Respuesta: `{ estado, ofertas[], cantidadRegistros, cantidadPaginas, paginaActual, registrosPorPagina, facetas{ sueldo, carrera, region, jornada } }`.
No hay faceta de comuna.

Cada `ofertas[i]`: `idOferta`, `nombreCargo`, `nombreEmpresa`, `ubicacion` ("Quilicura, Metropolitana de Santiago"),
`fechaPublicacion` ("2026-10-19 09:22"), `publicadoHace`, `descripcionOferta` (extracto), `nombreJornada`,
`ofertaDestacada`, `ofertaInclusiva`, `ofertaExclusiva`, `geolocalizacion`, `urlLogo`.

## Detalle

```
GET https://www.trabajando.cl/api/ofertas/<idOferta>
```

Campos usados: `nombreCargo`, `nombreEmpresaFantasia`, `ofertaConfidencial`, `descripcionOferta` (HTML),
`requisitosMinimos` (HTML), `aniosExperiencia` + `nombreOperadorExperiencia`, `nombreNivelAcademico`,
`nombreSituacionAcademica`, `cantidadVacantes`, `fechaPublicacionFormatoIngles`, `fechaExpiracionFormatoIngles`,
`nombreJornada`, `tiempoContrato`, `nombreArea`, `nombreTipoCargo`, `mostrarSueldo` + `sueldo`,
`linkPostulacionExterno`, `estadoOferta`, `slug`, `ubicacion{ nombreComuna, nombreRegion, direccion }`.

Página pública: `https://www.trabajando.cl/trabajo/<id>[-<slug>]` (basta el id).
