# Protocolo de revisión independiente

## Fase A: clave oculta

Preparar el lote mediante la herramienta local. El revisor abre solo `revision-ciega.json` y `index.html`. No abrir el JSON candidato original ni `sobre-respuestas.json` hasta registrar la resolución propia.

Para cada candidato debe dejar: resultado calculado, opciones que considera válidas, restricciones usadas y dudas. Se resuelve también cada distractor. La clave, la solución del generador y sus explicaciones de error no aparecen en el paquete ciego. Esto reduce una fuente de orientación por la clave; no se presenta como un estudio doble ciego ni como ausencia total de sesgo.

## Fase B: contraste

Con la resolución registrada, abrir el sobre y comparar. Revisar por separado:

- Exactitud matemática, suficiencia y unicidad de respuesta.
- Correspondencia entre figura, datos, enunciado y opciones.
- Unidad, contexto y supuestos que cambian el resultado.
- Justificación correcta y explicación de todos los distractores.
- OA y nivel con fuente oficial comprobada.
- Duplicados y variantes demasiado cercanas a otros ítems.
- Diseño, tamaño CSS y muestra A4 cuando haya figura.

Un ítem pendiente por falta de evidencia no cuenta como aprobado. La revisión se hace por ítem, no por muestra del lote. Un cambio posterior invalida el dictamen anterior para la nueva versión.

## Dictamen

Usar `REQUIERE_AJUSTES`, `RECHAZADO` o `APTO_EN_REVISION_TECNICA`. No usar «certificado SIMCE» ni «100 % libre de errores».

Cada registro debe contener:

```json
{
  "codigoLocal": "DS4B-PILOTO-001",
  "versionCandidata": 1,
  "sha256Candidato": "HASH_DE_64_CARACTERES",
  "revisor": "identidad y configuración informadas, sin inventarlas",
  "fecha": "fecha real de revisión",
  "resolucionPropia": "resultado y procedimiento registrados antes del contraste",
  "opcionesValidas": ["C"],
  "estado": "REQUIERE_AJUSTES",
  "criterios": {
    "matematica": "pendiente",
    "unicidad": "pendiente",
    "curriculum": "pendiente",
    "distractores": "pendiente",
    "figura": "pendiente",
    "tamano": "pendiente"
  },
  "hallazgos": [],
  "evidencias": [],
  "alcance": "Revisión técnica y de contenido; sin validación psicométrica ni publicación"
}
```

La plantilla anterior no es un dictamen emitido. Todos los criterios aplicables deben estar comprobados para declarar aptitud; `no_aplica` requiere motivo. Pasar el validador automático no rellena estos criterios.

## Incertidumbre y arbitraje

Si no hay una lectura única, una fuente verificable o acuerdo en la solución, el candidato queda pendiente. Un docente especialista puede resolver dudas curriculares o didácticas antes de una aceptación. No se fuerza una justificación para conservar una clave.

## Publicación

Está fuera de esta carpeta. Requiere un encargo explícito del usuario y revisión del importador, su manejo de estados, los recursos compartidos y el histórico. No existe aquí un comando para publicar.
