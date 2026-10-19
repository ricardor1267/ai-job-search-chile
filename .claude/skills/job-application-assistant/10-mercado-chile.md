---
framework_version: 1.0.1
---

# Mercado laboral chileno: convenciones y criterios

Referencia práctica de las convenciones del mercado laboral en Chile. El asistente la aplica al **evaluar ofertas** (`04-job-evaluation.md`), **redactar CV** (`05-cv-templates.md`), **cartas de presentación** (`06-cover-letter-templates.md`), **preparar entrevistas** (`07-interview-prep.md`) y **completar formularios de postulación** (`08-application-forms.md`).

Reglas generales:

- **Idioma:** toda respuesta al usuario y todo documento se escribe en español neutro, salvo que el perfil (`CV language` en `CLAUDE.md`) o la oferta indiquen otro idioma. Evitar modismos chilenos en documentos formales ("pega", "cachai", "al tiro") y también el tono excesivamente formal o rebuscado.
- **Datos legales que cambian:** lo marcado como **verificar vigencia** depende de leyes o valores que se actualizan. Antes de citarlo en un documento o usarlo para descartar una oferta, confirmar en una fuente oficial (dt.gob.cl, bcn.cl, chileatiende.gob.cl, spensiones.cl, sii.cl).
- **No inventar cifras:** no afirmar porcentajes de cotización, topes imponibles, valor del ingreso mínimo ni tasas de retención sin verificarlos en la fuente oficial vigente. Si la cifra importa para una decisión, indicarlo como dato a verificar.
- **Privacidad:** esta plantilla no contiene datos personales. Nunca agregar RUT, fecha de nacimiento ni datos sensibles del candidato a archivos versionados.

---

## 1. CV en Chile

| Aspecto | Convención |
|---|---|
| Extensión | 1 a 2 páginas en el mercado chileno. **Este framework genera siempre 2 páginas** (regla dura de `/apply` y `05-cv-templates.md`), lo que es adecuado para perfiles con trayectoria. `cv/main_example.tex` cabe en 1 página porque ilustra el estilo, no el largo. Para perfiles junior con poco material, no rellenar: ampliar logros reales, cursos y habilidades, o registrar una plantilla de 1 página con `/add-template`. |
| Orden | Cronológico inverso (lo más reciente primero) en experiencia y formación. |
| Idioma | Español por defecto. CV en inglés solo si la oferta está en inglés, la empresa es multinacional con proceso en inglés, o el perfil lo indica. |
| Foto | Opcional. Es común en Chile, pero no es requisito. Si se incluye: fondo neutro, tipo carnet o profesional. Si el usuario no la quiere, no insistir. |
| Datos personales | Nombre, teléfono, correo, LinkedIn y ubicación como **comuna y región** (ej. "Ñuñoa, Región Metropolitana"). |
| Datos que NO van | **RUT, edad o fecha de nacimiento, estado civil, nacionalidad (salvo que sea relevante para permiso de trabajo), dirección completa, número de hijos, religión, salud.** No son necesarios para postular, exponen al candidato a discriminación y a riesgos de suplantación. Si un formulario los exige, el usuario decide; el asistente no los agrega al CV por iniciativa propia. |

**Encabezados de sección habituales en español** (traducir todos los `\section{...}` del template, ver `05-cv-templates.md`):

- `Perfil profesional` (o "Resumen profesional")
- `Experiencia laboral` (preferido en Chile sobre "Experiencia profesional"; ambos son aceptables, usar uno solo de forma consistente)
- `Formación académica`
- `Cursos y certificaciones`
- `Competencias` o `Habilidades técnicas`
- `Idiomas`
- `Licencia de conducir` (cuando sea relevante)
- `Referencias` → "Disponibles a solicitud." (o listar referencias laborales si la oferta las pide)

**Formación y títulos:** distinguir correctamente entre título profesional (universidad), título técnico de nivel superior (CFT/IP) y grado académico (licenciatura, magíster). Indicar la institución y el año de titulación. Un título en curso se declara como "en curso" o "egresado/a, en proceso de titulación" según corresponda, nunca como titulado.

**Cursos y certificaciones:** en Chile se valoran los cursos dictados por **OTEC** (Organismos Técnicos de Capacitación), los cursos con **código SENCE** y las certificaciones de competencias laborales (**ChileValora**). Listar nombre del curso, institución u OTEC, horas y año. En rubros como minería, construcción, logística o salud, las certificaciones habilitantes (por ejemplo, operación de equipos, trabajo en altura, primeros auxilios, manejo de sustancias peligrosas) pueden ser requisito excluyente: ponerlas en un lugar visible.

**Licencia de conducir:** si la oferta la menciona o el cargo implica conducir, indicar la **clase**: por ejemplo, Clase B (vehículos particulares), Clase C (motocicletas), Clase D (maquinaria automotriz, como grúas horquilla o retroexcavadoras) o las clases profesionales A1 a A5 (transporte de pasajeros o de carga). No basta con escribir "licencia de conducir": la clase es lo que filtra.

**Logros cuantificados:** el mercado chileno responde bien a logros concretos (reducción de costos, cumplimiento de metas, indicadores de seguridad, tamaño de equipos o contratos). Mantener las reglas de veracidad de `05-cv-templates.md`: no inventar cifras.

---

## 2. Pretensión de renta

Es la pregunta más frecuente en formularios y entrevistas en Chile, y la que más errores genera.

**Siempre aclarar si es líquida o bruta:**

- **Renta líquida:** lo que efectivamente se recibe en la cuenta cada mes, después de descuentos legales (cotización previsional en AFP, salud en Fonasa o Isapre, seguro de cesantía e impuesto, cuando corresponde).
- **Renta bruta:** el total imponible antes de esos descuentos (más haberes no imponibles, si los hay).
- La diferencia entre ambas es significativa. Un candidato que responde un monto líquido cuando el formulario pide bruto (o al revés) puede quedar fuera de rango sin saberlo.

**Reglas para el asistente:**

1. Expresar la pretensión en **pesos chilenos (CLP), monto mensual**, indicando explícitamente "líquido" o "bruto". En cargos ejecutivos o de alta dirección, algunas ofertas usan **UF**; en ese caso, respetar la unidad de la oferta.
2. Tomar como base la pretensión registrada en el perfil del usuario (`CLAUDE.md`). Si no existe, preguntar antes de inventar un número.
3. Si el formulario **exige un número** (campo numérico obligatorio, sin opción de rango): ingresar el monto dentro del rango del usuario coherente con el cargo, e indicar en un campo de texto libre o en la entrevista si es líquido o bruto. Si el campo no especifica, asumir que el reclutador probablemente piensa en **líquido** (es lo más común en Chile), pero advertir al usuario de la ambigüedad.
4. Si se permite texto: preferir un **rango acotado** ("entre $X y $Y líquidos mensuales") o "según rango de mercado para el cargo, conversable en función del paquete total".
5. Considerar el **paquete total**, no solo el sueldo base: gratificación, bonos (desempeño, metas, turno, zona), asignaciones de colación y movilización, seguro complementario de salud, días adicionales de vacaciones, modalidad híbrida.
6. Para comparar ofertas, normalizar todas a la misma base (líquido mensual o bruto mensual) antes de opinar.
7. Para estimar el líquido a partir del bruto (o al revés), usar una calculadora oficial o de referencia actualizada y declarar que es una estimación. **No** aplicar porcentajes de memoria. *(verificar vigencia de tasas y tramos)*

---

## 3. Tipos de contrato y relación laboral

| Modalidad | Qué implica | Qué revisar en una oferta |
|---|---|---|
| **Contrato indefinido** | Relación laboral sin fecha de término. Da acceso pleno a indemnizaciones por años de servicio según la ley. | Es la opción más estable; si la oferta lo menciona, es un punto a favor. |
| **Contrato a plazo fijo** | Tiene fecha de término. La ley limita su duración y las renovaciones; cumplidos ciertos supuestos se transforma en indefinido. En la práctica, muchas empresas lo usan como período de prueba antes de pasar a indefinido. *(verificar vigencia de plazos máximos)* | Preguntar si existe intención de pasar a indefinido y en qué plazo. |
| **Contrato por obra o faena** | Dura lo que dura una obra o proyecto específico. Común en construcción, minería, montaje y proyectos. | Duración estimada del proyecto y posibilidad de continuidad en otra obra. |
| **Honorarios (boleta de honorarios)** | No es contrato de trabajo: es prestación de servicios. El trabajador emite boleta y tiene retención de impuesto; no hay vacaciones pagadas, gratificación ni indemnización por despido en los mismos términos que un contrato laboral, y la cobertura previsional funciona distinto. *(verificar vigencia de tasa de retención y reglas de cotización)* | Comparar el monto bruto de honorarios contra un sueldo con contrato considerando lo que se pierde. Si las funciones son de subordinación y dependencia (horario, jefatura, lugar fijo), el usuario debe saber que podría tratarse de una relación laboral encubierta. |
| **Part-time / jornada parcial** | Jornada inferior a la ordinaria, con derechos proporcionales. | Horario exacto y si es compatible con estudios u otro trabajo. |

Al evaluar una oferta, registrar el tipo de contrato como dato explícito. Si el perfil del usuario declara que solo acepta contrato indefinido (o que no acepta honorarios), tratarlo como **restricción excluyente**.

---

## 4. Jornada laboral y turnos

**Ley 21.561 ("Ley 40 horas")** *(verificar vigencia)*: reduce gradualmente la jornada ordinaria máxima. Según el calendario fijado por esa ley:

- Desde abril de 2024: 44 horas semanales.
- **Desde abril de 2026: 42 horas semanales** (jornada vigente a la fecha de esta guía).
- Desde abril de 2028: 40 horas semanales.

Uso práctico: si una oferta indica una jornada ordinaria superior al máximo legal vigente, marcarlo como **señal de alerta** (puede tratarse de un aviso desactualizado o de horas extra encubiertas) y sugerir al usuario preguntar. No afirmar ilegalidad sin revisar el caso: existen jornadas excepcionales y sistemas especiales autorizados.

**Sistemas de turnos frecuentes:**

| Sistema | Descripción | Rubros típicos |
|---|---|---|
| **5x2** | 5 días de trabajo, 2 de descanso (lunes a viernes o rotando). | Oficina, servicios, industria. |
| **4x3** | 4 días de trabajo, 3 de descanso, con jornadas diarias más largas. | Industria, servicios, salud, algunas oficinas tras la Ley 40 horas. |
| **6x1** | 6 días de trabajo, 1 de descanso. | Retail, comercio, servicios. |
| **Turnos rotativos** | Turnos que alternan mañana, tarde y noche. | Producción, seguridad, salud, logística, call centers. |
| **Horario mall / retail** | Turnos que cubren horario de centros comerciales, incluyendo fines de semana y festivos con descansos compensatorios. | Retail, gastronomía. |
| **Jornadas excepcionales (ej. 7x7, 4x4, 14x14)** | Bloques de días de trabajo seguidos de descanso equivalente, a menudo con alojamiento en faena. Requieren autorización de la Dirección del Trabajo. | Minería, energía, faenas remotas. |

Al evaluar: comparar el sistema de turnos con las restricciones del perfil (`[YOUR_SCHEDULE_CONSTRAINTS]` en `04-job-evaluation.md`). Un turno nocturno, rotativo o de faena puede ser excluyente para el usuario aunque el resto de la oferta encaje.

---

## 5. Previsión, salud y beneficios legales (nivel conceptual)

No citar porcentajes ni topes sin verificarlos en la fuente oficial vigente.

- **AFP (Administradoras de Fondos de Pensiones):** cotización obligatoria para pensiones, descontada de la remuneración imponible. El trabajador elige AFP. *(verificar vigencia: el sistema previsional ha tenido reformas recientes que modifican cotizaciones del empleador)*
- **Salud: Fonasa o Isapre.** Fonasa es el sistema público; las Isapres son privadas. La cotización obligatoria se descuenta del sueldo; un plan de Isapre puede costar más que la cotización legal, lo que reduce el líquido.
- **Seguro de cesantía (AFC):** obligatorio para contratos regidos por el Código del Trabajo, con aportes del trabajador y del empleador que varían según el tipo de contrato.
- **Gratificación legal:** participación en utilidades establecida en el Código del Trabajo, con dos modalidades legales. En la práctica, muchas empresas la pagan mensualizada con tope anual. Preguntar si el sueldo ofrecido ya la incluye ("sueldo base + gratificación") para no comparar montos distintos. *(verificar vigencia de tope)*
- **Asignaciones de colación y movilización:** habitualmente no imponibles, por lo que aumentan el líquido sin afectar la base de cotización. Deben ser razonables y no reemplazar el sueldo. Son parte del paquete a considerar.
- **Otros beneficios comunes (no legales):** seguro complementario de salud, aguinaldos de Fiestas Patrias y Navidad, bonos por desempeño, días administrativos, trabajo híbrido, sala cuna (legal en ciertos casos; *verificar vigencia*).

---

## 6. Ley de Inclusión Laboral (Ley 21.015)

- Exige a las empresas de **100 o más trabajadores** contratar al menos un **1%** de personas con discapacidad o asignatarias de pensión de invalidez, o cumplir mediante medidas alternativas. *(verificar vigencia)*
- Muchas ofertas indican "proceso inclusivo" o "cargo compatible con la Ley 21.015".
- Declarar una discapacidad es **siempre decisión del usuario**. El asistente no lo menciona en el CV ni en la carta salvo instrucción expresa. Si el usuario quiere postular por esta vía, puede requerirse estar inscrito en el Registro Nacional de Discapacidad o contar con la calificación correspondiente.

---

## 7. Traslados y realismo del commute (Santiago y regiones)

- En Chile la ubicación se expresa por **comuna** (y región). Evaluar distancia por comuna de origen vs. comuna del lugar de trabajo, no solo por "Santiago".
- **Santiago:** la ciudad es extensa y el tiempo de traslado varía mucho según el eje. Los polos de oficinas se concentran en el sector oriente y centro (Santiago Centro, Providencia, Las Condes, Vitacura) y los polos industriales y logísticos en la periferia (por ejemplo, Quilicura, Pudahuel, Lampa, San Bernardo, Maipú). Un trayecto entre extremos de la ciudad puede superar con holgura una hora por sentido en hora punta.
- **Transporte público:** Metro de Santiago y buses de la **Red** (sistema de transporte público metropolitano). Verificar si el lugar de trabajo está cerca de una estación de Metro o de recorridos troncales. Polos industriales en la periferia suelen ofrecer **bus de acercamiento** o asignación de movilización: revisar la oferta.
- **Regiones:** en zonas mineras (Antofagasta, Atacama, Tarapacá, entre otras) es común el trabajo por turnos en faena con traslado incluido desde una ciudad base; el commute diario no aplica igual, pero sí la distancia a la ciudad de embarque.
- **Modalidad:** distinguir presencial, híbrido (cuántos días) y remoto. "Remoto" a veces significa "remoto dentro de Chile" o "remoto con visitas a terreno".

Al evaluar, estimar el tiempo de traslado puerta a puerta en transporte público y en auto según el perfil, y compararlo con las restricciones declaradas por el usuario. Si no se puede estimar con confianza, decirlo en lugar de inventar minutos.

---

## 8. Etapas habituales de un proceso de selección

1. **Filtro curricular** (muchas veces por ATS del portal o de la empresa, o por una consultora de selección).
2. **Entrevista telefónica o por videollamada** con reclutador: verifica pretensión de renta, disponibilidad y motivación.
3. **Evaluación psicolaboral:** muy común en Chile, a cargo de un psicólogo laboral (interno o de consultora). Puede incluir tests proyectivos y psicométricos, cuestionarios de personalidad, pruebas de razonamiento y una entrevista en profundidad. El resultado suele ser una clasificación tipo "recomendable / recomendable con observaciones / no recomendable".
4. **Entrevista por competencias:** preguntas conductuales ("cuénteme de una situación en que...") alineadas con las competencias del cargo. Se prepara con el formato STAR de `07-interview-prep.md`.
5. **Pruebas técnicas:** ejercicios prácticos, casos, pruebas de conocimiento o desafíos de código (frecuentes en tecnología).
6. **Entrevista con jefatura directa** y, a veces, con gerencia.
7. **Referencias laborales:** se suele pedir contacto de jefaturas anteriores. Recomendar al usuario avisar antes a sus referencias.
8. **Documentación previa a la contratación:** según el cargo, pueden pedir certificado de título, certificado de antecedentes, exámenes preocupacionales (salud, altura geográfica, drogas y alcohol en faenas), certificados de cotizaciones o finiquito anterior. El **certificado de antecedentes** se solicita en algunos procesos, sobre todo en cargos de seguridad, manejo de valores, trato con menores o sector público.

---

## 9. Portales de empleo

| Portal | Uso típico |
|---|---|
| **LinkedIn** | Cargos profesionales, ejecutivos y tecnología; también consultoras de selección. |
| **Chiletrabajos** (chiletrabajos.cl) | Amplio rango de cargos, muchos operativos, administrativos y técnicos. |
| **Computrabajo** (cl.computrabajo.com) | Generalista, alto volumen, mucho retail, servicios y ventas. |
| **Trabajando.com** | Generalista; muchas empresas grandes y portales de empleo corporativos lo usan como ATS. |
| **Laborum** (laborum.cl) | Generalista, profesionales y administrativos. |
| **Get on Board** (getonbrd.com) | Tecnología, startups y trabajo remoto; suele publicar rango salarial. |
| **Bolsa Nacional de Empleo** (bne.cl) | Portal público del Estado, con ofertas de empresas privadas y vínculo con oficinas municipales de intermediación laboral (OMIL). |
| **Empleos Públicos** (empleospublicos.cl) | Concursos y cargos del Estado, administrados por el Servicio Civil. Tienen bases formales, requisitos obligatorios y plazos estrictos. |
| **Indeed Chile** (cl.indeed.com) | Agregador de avisos de varios portales. |

En concursos de **Empleos Públicos**, leer las bases completas: los requisitos legales y la documentación exigida son excluyentes, y la renta suele publicarse como bruta según grado y estamento.

---

## 10. Registro y estilo en cartas de presentación y mensajes

- **Saludo:** "Estimado/a [Nombre Apellido]:" si se conoce a la persona; si no, **"Estimado equipo de selección:"** o "Estimados/as:". Evitar "A quien corresponda" salvo que no haya alternativa.
- **Tono:** profesional, directo y concreto. Frases cortas. Evitar el lenguaje florido o grandilocuente ("me dirijo a ustedes con el mayor de los respetos para manifestar mi profundo interés...") y las fórmulas vacías ("soy proactivo, responsable y con ganas de aprender") sin evidencia.
- **Tratamiento:** elegir un registro y mantenerlo. En documentos formales, preferir construcciones impersonales o la primera persona del candidato; no tutear al reclutador en una carta formal.
- **Extensión:** la carta de presentación es más breve en Chile que en otros mercados; muchas postulaciones por portal solo permiten un mensaje corto. Mantener el límite de una página de `06-cover-letter-templates.md` y preparar además una versión corta (aprox. 80-120 palabras) para campos de "mensaje al reclutador".
- **Cierre:** "Saludos cordiales," o "Atentamente," seguido del nombre completo y teléfono.
- **Fecha:** formato local, ej. "Santiago, 19 de octubre de 2026".
- **Reglas de estilo:** siguen vigentes todas las de `03-writing-style.md` (sin guiones largos, sin clichés, cada afirmación con evidencia).

---

## 11. Disponibilidad y aviso al empleador actual

- Los formularios y entrevistas preguntan con frecuencia por **"disponibilidad"**: inmediata, o con un plazo (por ejemplo, el aviso que el usuario debe dar a su empleador actual).
- La renuncia voluntaria en Chile contempla un aviso previo al empleador establecido en el Código del Trabajo. *(verificar vigencia)* Usar la disponibilidad que el usuario haya declarado en su perfil; si no la declaró, preguntarle.
- Para cargos con turnos o faena, la disponibilidad también incluye disposición a turnos, a trabajar en regiones o a viajar: responder según las restricciones del perfil, sin comprometer al usuario a algo que no declaró.
