# Adenda GO-PRY-001-2026 · Captura DataMatrix e indicadores

**Estado:** propuesta implementada (v1 demo) · **Fecha:** 2026-10-30
**Alcance:** mejora de control de limpieza con captura DataMatrix, medición de
tiempos e indicadores, minimizando la carga del personal operativo.
**Relación con el brief:** modifica §3.2 y amplía §8.6; respeta íntegras las
reglas §9.

---

## 1. Resumen ejecutivo

Para llevar un mejor control de la limpieza se incorporan tres capacidades, de
modo que **la medición sea un subproducto del trabajo y no una carga**:

1. **Captura DataMatrix** en cada entrada a habitación (y escaneo de salida),
   sustituyendo el QR del §3.2.
2. **Medición automática de tiempos** derivada de los escaneos y confirmaciones
   que el operador ya realiza.
3. **Indicadores agregados (§8.6)** para supervisión y gerencia, anclados a JCI
   PCI.04.00 ME#4 y al Marco Lean (§16).

Principio rector: **el operador solo escanea y confirma; todo lo demás se
calcula.** Los tableros son para supervisor/gerencia, no para el operador.

## 2. Cambio §3.2 — De QR a GS1 DataMatrix

| Antes (§3.2) | Ahora |
| --- | --- |
| QR en puerta, un escaneo al iniciar | **GS1 DataMatrix** en puerta |
| — | **Escaneo de entrada y de salida** (bracket de tiempo en habitación) |
| Insumos por selección manual | **Insumos por escaneo** del envase `(01)GTIN(10)lote` |

Justificación: DataMatrix es más pequeño y robusto (lee aunque se desgaste o se
limpie a diario), y encaja con el marco GS1 ya adoptado en §3.3. El anclaje
físico sigue siendo condición para abrir el flujo (evidencia *in situ*).

Lectura: lector físico tipo *keyboard-wedge* (entrada de texto) o cámara; en el
demo hay botón "Simular escaneo". Parser GS1 con Application Identifiers
(`01` GTIN, `10` lote, `17` caducidad, `414` GLN de ubicación).

## 3. Tiempos medidos (sin captura adicional)

Derivados de `scan_in`/`scan_out`, confirmaciones de paso y registros:

- **Tiempo en habitación** (entrada → salida) y **ejecución efectiva**.
- **Duración por paso** (detecta pasos exprés/saltados).
- **Tiempo vs. estimado** del PNT (benchmark por protocolo).
- **Ventana de verificación** y **% tardías** (la tardanza marca, no invalida — §5).
- **Ciclo / turnaround** de habitación (lo que importa a Admisiones).
- **Retrabajo** (% devueltas) y **adherencia** (ciclos completos).

## 4. Indicadores (§8.6 ampliado)

| Indicador | Meta | Audiencia | Ancla |
| --- | --- | --- | --- |
| % adherencia | ≥ 95 % | Supervisor/Gerencia | ME#4 |
| Conformidad promedio | ≥ 95 % | Supervisor | §8.4 |
| % verificaciones tardías | ≤ 10 % | Supervisor | §5 |
| Retrabajo | ↓ tendencia | PCI/Supervisor | §16 |
| Tiempo en habitación / ciclo | baseline | Gerencia | Lean OTD |
| Tiempo por PNT vs. estimado | ±15 % | Supervisor | §8.6 |
| Hallazgos críticos abiertos | 0 | PCI/Gerencia | §9.6 |

Alimentan el **Diálogo Mensual de Desempeño** (§16): es el "los datos se usan
para introducir cambios" que exige el ME#4.

## 5. Sin agobiar al personal (principios)

1. El operador solo **escanea** (entrada/pasos/salida) y **confirma**; cero
   captura manual de tiempos o insumos.
2. Se muestra tiempo **transcurrido**, nunca cuenta regresiva que presione.
3. Métrica de **proceso, no de persona**: a nivel operador se usa para coaching,
   no sanción; en reportes externos va **anonimizada** (§8.6).
4. **Offline-first**: escaneos y tiempos se guardan local y sincronizan (§11.3).
5. Los **tableros son para supervisor/gerencia**, fuera de la pantalla operativa.

## 6. Estado de implementación (v1 demo)

Implementado en la rama `feature/scaffold-next-cloudflare`:

- Parser GS1 (`src/lib/gs1.ts`, probado), eventos `scan_in`/`scan_out`.
- Escaneo de entrada/salida y de insumos en el flujo de ejecución.
- Columnas `enteredAt`/`exitedAt` en `ExecutionRecord` (migración D1
  `prisma/d1-migrations/0002-scan-times.sql`, pendiente de aplicar al desplegar).
- Módulo de métricas puro (`src/lib/metrics.ts`, probado) + pantalla **Reportes**
  (§8.6) + `GET /api/reportes`.
- UI **responsive** (operativo en teléfono; dashboard y reportes en
  tablet/escritorio para supervisión).

Pendiente: aplicar la migración D1, lectura por cámara (zxing) opcional,
agregados por turno/fecha y export PDF de indicadores.

---

*Adenda preparada por el equipo de desarrollo para revisión de PCI
(Dr. Josué Flores) y validación de stack (Edwin Martínez).*
