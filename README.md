<p align="center">
  <img src="assets/mascot/pip_flight_loop.gif" alt="Pip, el pájaro mensajero" width="200">
</p>

# AI Job Search Chile

*La búsqueda de empleo que corre en tu propio equipo, adaptada al mercado laboral chileno.*

**ai-job-search-chile** es un fork y adaptación para Chile de [**MadsLorentzen/ai-job-search**](https://github.com/MadsLorentzen/ai-job-search), creado por Mads Lorentzen y publicado bajo licencia MIT. Todo el diseño del flujo de trabajo (perfilamiento, evaluación de ajuste, flujo redactor-revisor, verificación de PDF y ATS) es obra del proyecto original; esta copia solo agrega portales, guías y ejemplos para Chile. Si te sirve, considera darle una estrella y apoyar al [proyecto original](https://github.com/MadsLorentzen/ai-job-search).

Es un framework construido sobre [Claude Code](https://claude.com/claude-code): completas tu perfil y Claude evalúa avisos, adapta tu CV, redacta cartas de presentación y te prepara para entrevistas.

> Nota: este es un proyecto open source independiente. **No está afiliado, respaldado, patrocinado ni mantenido por Anthropic**, ni por los portales de empleo que menciona. Anthropic y Claude Code se nombran solo para describir las herramientas que usa el flujo.
>
> Este proyecto (al igual que el original) **no tiene ninguna criptomoneda, token ni programa de patrocinio pagado** asociado. Cualquier cosa que diga lo contrario no está autorizada y debe tratarse como una estafa.

## Qué cambia en esta versión para Chile

| Área | Cambio |
|------|--------|
| Portales | CLI nuevos: `chiletrabajos-search`, `computrabajo-search`, `trabajando-search` y `getonbrd-search` (empleos de tecnología). Se mantienen los originales independientes del país: `linkedin-search` (por ejemplo `-l "Santiago, Chile"`) y `freehire-search`. |
| Portales daneses | `jobindex`, `jobnet`, `jobbank` y `jobdanmark` siguen en el repo pero desactivados con `enabled: false` en su `SKILL.md`, para que las actualizaciones del upstream se fusionen sin conflictos. |
| Guía de mercado | `.claude/skills/job-application-assistant/10-mercado-chile.md`: formato de CV chileno, pretensiones de renta (líquido vs. bruto), tipos de contrato, cultura de postulación y más. |
| Documentos | Ejemplos de CV y carta de presentación en español; el español es el idioma por defecto (inglés cuando el aviso lo pide). |
| Sueldos | `salary_lookup.py` reconoce nombres chilenos (S.A., SpA, Ltda., EIRL, tildes y ñ) y `tools/README_SALARY_TOOL.md` explica cómo armar tus datos con fuentes chilenas. |

```
/setup          /scrape              /apply <url>
  |                |                     |
  v                v                     v
Completa       Busca en los         Evalúa el ajuste
tu perfil      portales             y recomienda
  |                |                     |
  v                v                     v
Perfil         Muestra avisos       Redacta CV + carta
listo          con puntaje          (LaTeX, a medida)
                   |                     |
                   v                     v
               Eliges uno           Un agente revisor critica
               -> /apply            -> Revisión -> Versión final
```

## Requisitos

- [Claude Code](https://claude.com/claude-code) (CLI). No tiene plan gratuito: necesitas una suscripción Claude Pro/Max/Team o créditos de la API de Anthropic (pago por uso). ¿Usas otro agente (Codex, Gemini CLI)? Parte por [`AGENTS.md`](AGENTS.md).
- Python 3.10 o superior.
- [Bun](https://bun.sh) para los CLI de portales (instalación en Windows, macOS y Linux en [SETUP.md](SETUP.md#notas-para-chile)).
- Una distribución LaTeX con `lualatex` (CV) y `xelatex` (carta): [TeX Live](https://tug.org/texlive/), [MacTeX](https://tug.org/mactex/), [TinyTeX](https://yihui.org/tinytex/) o [MiKTeX](https://miktex.org/). Para documentos en español necesitas `babel` con soporte de español; en instalaciones mínimas revisa los paquetes extra en [SETUP.md](SETUP.md#minimal-tex-install-tinytexbasictex).
- Opcional: `pip install pypdf` para la verificación ATS del CV en `/apply` (si falta, se hace una revisión visual de palabras clave).

## Inicio rápido

### 1. Fork and clone

Para tu **búsqueda personal**, clona este repo y publícalo (si quieres respaldo remoto) en un **repositorio privado**, como explica la advertencia de abajo:

```bash
git clone https://github.com/<usuario>/ai-job-search-chile.git
cd ai-job-search-chile
```

Solo si quieres **contribuir** cambios de vuelta, haz un fork:

```bash
gh repo fork <usuario>/ai-job-search-chile --clone
```

> [!IMPORTANT]
> **Un fork de este repo siempre es público** (*forks of public repos are public*):
> GitHub no permite forks privados de repositorios públicos, y `/setup` (paso 3) escribe
> tus datos personales (*personal data*: nombre, contacto, historial laboral, pretensiones
> de renta) en archivos **versionados** por git. Si haces push de esos commits a un fork,
> quedan publicados. Para tu propia búsqueda usa un **repositorio privado** con este repo
> como `upstream`; la receta está en
> [SETUP.md, sección 8 (section 8)](SETUP.md#8-pulling-upstream-updates-into-your-fork).
> Haz fork solo para contribuir.

### 2. Instala los CLI de portales

```bash
python3 tools/install_portal_clis.py   # Windows: python tools\install_portal_clis.py
```

Ejecuta `bun install` en cada CLI bajo `.agents/skills/*/cli/` (se descubren solos, incluidos los que agregues con `/add-portal`). `--dry-run` muestra lo que instalaría.

### 3. Configura tu perfil

```bash
claude
# Dentro de Claude Code:
/setup
```

`/setup` ofrece tres caminos: leer tu carpeta `documents/` (CV, exportación de LinkedIn, títulos, cartas de recomendación), importar un único CV pegado en el chat o responder una entrevista guiada.

### 4. Busca avisos

```
/scrape
```

Busca en los portales activos, elimina duplicados y presenta los avisos ordenados por ajuste. Si llegan muchos, usa `/rank` para puntuarlos todos y obtener una lista corta.

### 5. Postula

```
/apply <url-del-aviso>
```

Si el portal bloquea la descarga del aviso, pega el texto completo: `/apply <texto del aviso>`. El flujo evalúa el ajuste, redacta CV y carta, los revisa con un segundo agente, compila los PDF y presenta la versión final. Los avisos se tratan como contenido no confiable (no se siguen instrucciones incluidas en ellos), pero revisa lo generado antes de enviar. Detalles en [SECURITY.md](SECURITY.md).

## Uso de los portales: solo uso personal

Los CLI de portales existen para que **una persona** busque empleo para sí misma, no para extraer datos de forma masiva.

- Mantén un **volumen bajo** de consultas; no los ejecutes en bucles ni con programaciones intensivas.
- Respeta el `robots.txt` y los términos de uso de cada portal. Si un portal los cambia, el CLI debe ajustarse o desactivarse (`enabled: false`).
- El `robots.txt` de Computrabajo no permite parámetros de filtro en la URL, por eso `computrabajo-search` pide el listado general y **filtra las fechas en tu equipo**.
- Los términos de LinkedIn prohíben el acceso automatizado; `linkedin-search` usa solo los listados públicos y debe usarse con moderación.
- Ningún CLI inicia sesión ni postula por ti: tú decides y envías cada postulación.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `/setup` | Crea o actualiza tu perfil (documentos, CV o entrevista); `--section search` reconfigura solo la búsqueda. |
| `/scrape` | Busca avisos en los portales activos y los ordena por ajuste a tu perfil. |
| `/rank` | Puntúa en lote los avisos encontrados y entrega una lista corta priorizada. |
| `/apply` | Evalúa un aviso y genera CV y carta a medida, revisados y compilados en PDF. |
| `/interview` | Prepara una entrevista: investigación, preguntas probables, ejemplos STAR y simulación. |
| `/outcome` | Registra el resultado de una postulación, archiva los documentos y sugiere seguimientos. |
| `/upskill` | Analiza brechas de habilidades frente a los avisos y propone un plan de aprendizaje. |
| `/html-report` | Genera un panel HTML offline con el estado de tus postulaciones. |
| `/add-portal` | Genera un CLI de búsqueda para otro portal de empleo. |
| `/add-template` | Registra tu propia plantilla de CV o carta (LaTeX, Typst u otra). |
| `/expand` | Enriquece tu perfil con fuentes públicas que ya enlazaste (GitHub, portafolio, cursos). |
| `/gmail-sync` | Lee Gmail para detectar respuestas de empresas y propone cambios al seguimiento. |
| `/notion-sync` | Publica una vista de solo lectura de tu proceso en una base de datos de Notion. |
| `/reset` | Borra tu perfil y/o tus documentos para empezar de cero (pide confirmación). |

## Sueldos

La herramienta de sueldos funciona con datos que tú recopilas (avisos con renta publicada, estudios de remuneraciones, Glassdoor, Mi Futuro). Anota siempre si cada cifra es **líquida o bruta** y en **CLP mensuales**. Ver la sección "Uso en Chile" de [`tools/README_SALARY_TOOL.md`](tools/README_SALARY_TOOL.md). Sin datos, `/apply` simplemente omite este paso.

## Mantenerse actualizado

Para traer a tu copia privada las actualizaciones de esta adaptación:

```bash
git remote add upstream https://github.com/<usuario>/ai-job-search-chile.git   # solo la primera vez
git fetch upstream --tags
python3 tools/check_upstream_updates.py          # qué archivos personalizados cambian
python3 tools/upstream_triage.py --remote upstream
git merge upstream/master
```

Quien mantiene este fork usa `https://github.com/MadsLorentzen/ai-job-search.git` como `upstream` para incorporar las mejoras del original. Como los portales daneses solo se desactivan (no se borran), esas fusiones suelen ser limpias. Guía completa en [SETUP.md, sección 8](SETUP.md#8-pulling-upstream-updates-into-your-fork).

## Más información

- [SETUP.md](SETUP.md): guía de instalación paso a paso (incluye "Notas para Chile").
- [CONTRIBUTING.md](CONTRIBUTING.md) y [SECURITY.md](SECURITY.md).
- README original (en inglés), con la explicación completa de `/apply`, plantillas y puntos de extensión: [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search#readme).

## Créditos

- [Mads Lorentzen](https://github.com/MadsLorentzen), autor de [ai-job-search](https://github.com/MadsLorentzen/ai-job-search), el proyecto en que se basa esta adaptación.
- [Mikkel Krogholm](https://github.com/mikkelkrogsholm) ([skills repo](https://github.com/mikkelkrogsholm/skills)), por los CLI de búsqueda de empleo originales.
- Construido con [Claude Code](https://claude.com/claude-code) de [Anthropic](https://anthropic.com).

## Licencia

MIT, igual que el proyecto original. Se conservan el aviso de copyright y la licencia de Mads Lorentzen; ver [LICENSE](LICENSE).
