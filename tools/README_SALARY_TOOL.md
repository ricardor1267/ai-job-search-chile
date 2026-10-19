# Salary Benchmark Tool

## What is this?

The salary lookup tool (`salary_lookup.py`) lets you benchmark company salaries against a baseline from your own data. It's used during the `/apply` workflow to show how a company's compensation compares to market rates.

**This tool is optional.** If you don't have salary data, the salary step is simply skipped during `/apply`.

## How it works

The tool reads a `salary_data.json` file in the repo root containing company salary benchmarks. It uses fuzzy matching to find companies by name, handling Danish/Nordic characters, legal suffixes (A/S, ApS), and common spelling variations.

The data format supports any index-based or absolute salary data. For example:
- Index 100 = median salary, higher is better
- Absolute salary values in your currency
- Any custom metric you want to track

## Data format

The tool expects `salary_data.json` with this structure:

```json
{
  "metadata": {
    "source": "My Union Statistics 2025",
    "index_baseline": 100,
    "index_label": "Index",
    "baseline_description": "Index 100 = median salary for private sector"
  },
  "companies": [
    {
      "company": "Novo Nordisk A/S",
      "city": "Bagsværd",
      "categories": {
        "all_employees": { "count": 500, "index": 108.5 },
        "engineering": { "count": 120, "index": 112.3 }
      }
    },
    {
      "company": "Ørsted A/S",
      "city": "Fredericia",
      "categories": {
        "all_employees": { "count": 200, "index": 105.2 }
      }
    }
  ]
}
```

### Fields

- **metadata.source**: Where the data comes from (for reference)
- **metadata.index_baseline**: The baseline value (e.g., 100 for index-based data)
- **metadata.index_label**: Label for the index column in output
- **metadata.baseline_description**: Human-readable explanation of the baseline
- **companies[].company**: Company name (required)
- **companies[].city**: City/location (optional, used for filtering)
- **companies[].categories**: Named salary categories, each with `count` and/or `index`

## Setup options

### Option A: Create salary_data.json manually

Create the file by hand with data from any source: union statistics, Glassdoor, salary surveys, networking, or personal research.

### Option B: Convert from Excel

If you have salary data in an Excel file:

```bash
pip install openpyxl
python3 tools/convert_salary_excel.py path/to/salary-data.xlsx \
  --source "My Salary Data 2025" \
  --baseline 100 \
  --baseline-desc "Index 100 = median salary"
```

On Windows, use `py` if that is how Python is exposed on your PATH. If your system uses `python` instead of `python3`, substitute that in the examples.

The converter auto-detects the Excel layout:
- Looks for a "Company"/"Firma" column and an optional "City"/"By" column
- Treats remaining columns as salary data (auto-pairs count/index columns)

### Option C: Build from research

Start with an empty template and add companies as you research them:

```json
{
  "metadata": {
    "source": "Personal research",
    "index_baseline": 0,
    "index_label": "Monthly salary (DKK)",
    "baseline_description": "Approximate monthly salary before tax"
  },
  "companies": [
    {
      "company": "Example Corp",
      "city": "Copenhagen",
      "categories": {
        "entry_level": { "index": 42000 },
        "senior": { "index": 55000 }
      }
    }
  ]
}
```

## Usage

```bash
python3 salary_lookup.py "Novo Nordisk"
python3 salary_lookup.py "Ørsted" --city "Fredericia"
python3 salary_lookup.py "COWI" --json
python3 salary_lookup.py --list-all
python3 salary_lookup.py --validate      # pre-flight check your salary_data.json
```

## Important notes

- The data file (`salary_data.json`) is **excluded from git** (see `.gitignore`). Your salary data may be proprietary or confidential.
- If the data file is missing, `salary_lookup.py` exits with a helpful error message and the `/apply` workflow skips the salary benchmark step.
- The fuzzy matcher handles Danish company name variations: legal suffixes, Nordic characters, anglicized spellings, and partial matches.
- It also handles Chilean names: trailing legal forms (S.A., S.A.C., SpA, S.p.A., Ltda., Limitada, EIRL, "y Cía."), a standalone "Chile" (but not "Banco de Chile"), and Spanish accents/ñ for ASCII-typed queries. See "Uso en Chile" below.
- `--validate` checks your data file for malformed category values and duplicate company names and prints a report, without performing a lookup.

## Uso en Chile

Esta sección explica cómo armar `salary_data.json` para el mercado chileno. La herramienta **no descarga datos de ninguna fuente**: tú recopilas las cifras, las anotas y el archivo queda solo en tu máquina (está en `.gitignore`).

### Fuentes que puedes usar

Recopila tú mismo las cifras desde fuentes a las que tengas acceso legítimo, y respeta los términos de uso de cada sitio:

- **Avisos con sueldo publicado** en portales como Chiletrabajos, Computrabajo, Trabajando.com o Get on Board (este último suele publicar rangos en avisos de tecnología). Anota empresa, cargo, ciudad, rango y fecha del aviso.
- **Informes o estudios de remuneraciones** que publican portales de empleo (por ejemplo, los informes de renta de Trabajando.com) y consultoras de selección o de compensaciones. Muchos son gratuitos a cambio de un registro; otros son pagados.
- **Glassdoor Chile** u otros sitios de sueldos reportados por empleados. Son datos autodeclarados y con muestras pequeñas: úsalos como referencia, no como verdad.
- **Mi Futuro / Futuro Laboral (Mineduc)**: ingresos promedio por carrera e institución en los primeros años de egreso. Sirve para estimar el rango de una profesión, no el de una empresa en particular.
- Tu propia red: ofertas que hayas recibido, conversaciones con colegas, sueldos de tu sindicato o colegio profesional si los publica.

No se incluyen enlaces ni cifras de referencia a propósito: cambian seguido y no queremos fijar valores que podrían estar desactualizados.

### Reglas para que los datos sean comparables

- **Registra siempre si la cifra es líquida o bruta.** En Chile los avisos mezclan ambas. El sueldo líquido es lo que recibes después de descontar AFP, salud (Fonasa/Isapre), seguro de cesantía e impuesto; el bruto es antes de esos descuentos. Nunca mezcles ambos en la misma categoría.
- **Usa pesos chilenos (CLP) mensuales.** Si una fuente da cifras anuales, en UF o en USD, conviértelas y anota en `metadata.baseline_description` cómo y con qué fecha lo hiciste.
- Anota la **fecha** y la **fuente** de cada dato (en `metadata.source` o en el nombre de la categoría) para saber cuándo actualizarlo.
- Indica si el monto incluye bonos, gratificación legal o asignaciones (colación, movilización), que en Chile pueden pesar bastante en el total.

### Ejemplo

Con `index_baseline` en `0` la herramienta muestra los montos sin compararlos contra una línea base:

```json
{
  "metadata": {
    "source": "Avisos y estudios recopilados a mano, 2026",
    "index_baseline": 0,
    "index_label": "CLP/mes",
    "baseline_description": "Sueldo mensual en CLP. liquido_* = liquido, bruto_* = bruto. Sin bonos."
  },
  "companies": [
    {
      "company": "Empresa Ejemplo SpA",
      "city": "Santiago",
      "categories": {
        "liquido_analista": { "index": 1200000 },
        "bruto_analista": { "index": 1500000 }
      }
    },
    {
      "company": "Compañía Minera Ejemplo S.A.",
      "city": "Antofagasta",
      "categories": {
        "bruto_ingeniero_senior": { "count": 3, "index": 4000000 }
      }
    }
  ]
}
```

Las cifras del ejemplo son ilustrativas, no datos reales de mercado.

### Búsquedas

```bash
python3 salary_lookup.py "Empresa Ejemplo"                       # encuentra "Empresa Ejemplo SpA"
python3 salary_lookup.py "Compania Minera" --city "Antofagasta"  # sin tildes también funciona
python3 salary_lookup.py "Empresa Ejemplo" --city "Santiago" --json
python3 salary_lookup.py --validate
```

El buscador ignora los sufijos legales al final del nombre (S.A., SA, S.A.C., SpA, S.p.A., Ltda., Limitada, EIRL, E.I.R.L., "y Cía.") y la palabra "Chile" cuando va suelta ("Walmart Chile" se busca como "Walmart"), pero la conserva cuando es parte del nombre ("Banco de Chile", "Universidad de Chile"). Las tildes y la ñ se pliegan, así que puedes escribir sin acentos.
