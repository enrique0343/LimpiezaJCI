# Sistema de Limpieza con Trazabilidad JCI

**Código del proyecto:** `GO-PRY-001-2026` *(tentativo, sujeto a confirmación)*
**Versión:** 0.1 (Brief de desarrollo)
**Estado:** Borrador para desarrollo · sujeto a aprobación PCI antes de despliegue
**Promotor:** Gerencia de Operaciones · Abraham Medina
**Marco normativo:** JCI 8ª edición · PCI.04.00, PCI.04.01, MCI · ISO 9001:2015 · GS1 Healthcare · Marco Lean Avante (GO-MEM-001-2026)
**Institución:** Avante Complejo Hospitalario · Inversiones Avante S.A. de C.V.

-----

## 1. Propósito del sistema

Construir la capacidad operacional que vuelve **auditable cada evento de limpieza** en habitaciones y áreas clínicas de Avante, encadenando un **Registro de Ejecución** (quien limpió) con un **Registro de Verificación** (quien validó independientemente), hasta una **Liberación** explícita de la habitación para próxima admisión. Esta capacidad responde directamente al Elemento Medible #4 de la norma JCI PCI.04.00, 8ª edición, que exige que el hospital supervise los procesos de limpieza y desinfección ambiental, y use los datos para introducir cambios cuando procede.

Sin este sistema, Avante no tiene evidencia trazable de que la limpieza ocurrió, contra qué protocolo, por quién, ni cómo se verificó. El sistema es una **pre-condición de defensibilidad para la próxima auditoría JCI**.

-----

## 2. Anclaje JCI explícito

### 2.1 Norma PCI.04.00 — Limpieza medioambiental

El programa de prevención y control de infecciones supervisa la limpieza y desinfección del entorno.

**Elementos Medibles:**

1. Directrices basadas en pruebas para limpieza y desinfección en todo el hospital.
1. Directrices basadas en evidencia para zonas de alto riesgo (Quirófanos, Departamento Central de Suministros Estériles, UCI neonatal, unidades de combustión, áreas de aislamiento infeccioso).
1. Directrices basadas en evidencia para limpieza y desinfección en áreas donde se atienden pacientes con enfermedades infecciosas, **incluso después del alta del paciente**.
1. El hospital **supervisa los procesos** y **los datos se utilizan para introducir cambios** cuando procede.

Métodos de supervisión que JCI reconoce explícitamente: comentarios de pacientes y familiares, marcadores fluorescentes y bioluminiscencia ATP, observación directa. El sistema construido por este proyecto agrega un **cuarto método: evidencia digital trazable**, que se vuelve la columna vertebral que torna auditables a los otros tres.

### 2.2 Limpieza rutinaria vs. limpieza terminal

JCI 8ª edición distingue dos procesos con políticas distintas:

- **Limpieza rutinaria**: diaria, en unidades de enfermería, habitaciones, áreas de diagnóstico y tratamiento, servicios generales de apoyo, zonas de espera, espacios de trabajo y cocinas.
- **Limpieza terminal**: proceso más exhaustivo, definido por el hospital, post-alta o post-traslado. Puede incluir lavado de cortinas, retirada y limpieza de todos los objetos desmontables, desinfección con múltiples agentes, y uso de herramientas especializadas. Política y procedimientos **varían por zona** (un quirófano no se limpia igual que una habitación de aislamiento por enfermedad infecciosa).

El sistema soporta como mínimo cuatro protocolos diferenciados (sección 6).

### 2.3 Otras normas tocadas

- **PCI.04.01**: lencería, ropa de cama y ropa de quirófano. El sistema captura “lencería retirada y enviada” como paso de protocolo.
- **PCI.05.00**: gestión de residuos, segregación correcta. Paso obligatorio en protocolo.
- **MCI (Management of Communication and Information)**: cada evento queda atado a una identidad. No se permiten eventos anónimos.
- **GLD (Governance, Leadership, Direction)**: responsabilidad de liderazgo sobre cultura de seguridad. El reporte agregado del sistema alimenta al Comité Gerencial y Junta.

-----

## 3. Arquitectura conceptual

### 3.1 Doble registro encadenado

Toda habitación que requiere limpieza atraviesa **tres eslabones obligatorios** antes de poder admitir un nuevo paciente:

```
[Solicitud de limpieza]
        ↓
[Registro de Ejecución]   ← Operador de Servicios Generales
        ↓
[Registro de Verificación] ← Supervisor o PCI (independiente del operador)
        ↓
[Liberación]               ← Habitación disponible para admisión
```

**Regla crítica:** no existe atajo entre la solicitud y la liberación. Cada eslabón requiere identidad autenticada, marca de tiempo no editable y datos firmados.

### 3.2 Anclaje físico por QR

Cada habitación lleva un **código QR físico** en el marco de la puerta, vinculado al ID de habitación en base de datos. El operador escanea el QR para iniciar el registro de ejecución. El escaneo es **condición necesaria** para arrancar el cronómetro y desbloquear el flujo. Esto convierte el registro en evidencia *in situ*, en lugar de declaración remota.

### 3.3 Trazabilidad de insumos estilo GS1

Cada insumo (desinfectante, limpiador) en el sistema lleva GTIN, lote y dilución. El operador selecciona qué insumos utilizó antes de iniciar el cronómetro. Cada evento de limpieza queda atado a esos GTIN + lote específicos. Beneficio operacional: ante un brote o sospecha de contaminación, retroceder a todas las habitaciones limpiadas con un lote específico es una consulta directa, no una investigación manual.

### 3.4 Bitácora append-only

Todo evento (login, escaneo QR, paso confirmado, foto, incidente, cierre, verificación, liberación) se escribe en una **bitácora append-only**. No hay ediciones que sobrescriban. Una corrección genera un nuevo evento que referencia al anterior. Esta es la propiedad que vuelve la bitácora defensible ante auditoría.

-----

## 4. Roles y autenticación

|Rol                     |Permisos                                                                                                                                           |Ejemplo                                                  |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
|**Operador**            |Ver habitaciones pendientes de limpieza. Iniciar y completar Registro de Ejecución. Reportar incidentes. Ver bitácora de habitaciones que él operó.|Personal de Servicios Generales                          |
|**Supervisor**          |Todo lo del Operador, más: Iniciar Registro de Verificación. Liberar habitación o devolver para corrección. Ver todas las habitaciones y bitácoras.|Jefa de Servicios Generales (Arely Montaño)              |
|**Verificador PCI**     |Equivalente al Supervisor para áreas de alto riesgo (UCI, quirófano, aislamiento). Liberación de estas áreas requiere obligatoriamente este rol.   |Comité de Infecciones                                    |
|**Gerencia / Auditoría**|Solo lectura. Acceso a reportes agregados, bitácoras completas, exportes para auditoría JCI.                                                       |Gerencia de Operaciones, Gerencia Médica, auditor externo|

**Autenticación:** PIN de 4-6 dígitos o credencial corporativa. No SSO público. Sesión expira a 30 min de inactividad. Login obligatorio antes de cualquier acción operativa.

**Política de identidad:** un operador no puede registrar verificación de su propio trabajo. La separación de roles es estructural, no opcional. El sistema rechaza ese intento explícitamente.

-----

## 5. Máquina de estados de la habitación

Cada habitación se encuentra en uno de cinco estados, con transiciones controladas:

```
┌─────────────┐  iniciar     ┌──────────────┐  finalizar   ┌──────────────────┐
│ pendiente   │ ───────────→ │ en_limpieza  │ ───────────→ │ pend_verificacion│
└─────────────┘  ejecución   └──────────────┘  ejecución   └──────────────────┘
       ↑                                                            │
       │ alta paciente /                                             │ verificar
       │ solicitud nueva                                             ↓
       │                                                  ┌──────────────────┐
       │                                                  │ (conformidad)    │
       │                                                  │ ┌──────────────┐ │
       │                                                  │ │   liberada   │ │  ← admisión OK
       │                                                  │ └──────────────┘ │
       │                                                  │ ┌──────────────┐ │
       │  reverificar y                                   │ │con_hallazgos │ │
       └──────────────────────────────────────────────────┤ └──────────────┘ │
          corregir → ejecutar otra vez → verificar otra v │                  │
                                                          └──────────────────┘
```

**Estados:**

- `pendiente`: requiere limpieza. Motivo registrado (alta de paciente, rutina diaria, evento extraordinario).
- `en_limpieza`: un operador identificado tiene un Registro de Ejecución abierto. Solo ese operador puede continuarlo; no se permite operador concurrente sobre la misma habitación.
- `pend_verificacion`: Ejecución cerrada. Esperando supervisor o PCI.
- `con_hallazgos`: Verificación marcó hallazgos. No se libera. Vuelve a `pendiente` cuando el operador inicia corrección, y de ahí sigue el flujo completo de nuevo.
- `liberada`: ambos registros completos y conformidad aceptable. Lista para admisión. Pasa a `pendiente` cuando ocurra el próximo alta o ciclo de rutina diaria.

**Ventana de verificación:** debe iniciarse en máximo 30 minutos tras cierre de ejecución para protocolos terminales, 2 horas para rutina. Si se excede, el sistema marca la verificación como **tardía** sin invalidarla, y la marca aparece en el reporte agregado. Configurable por administrador.

-----

## 6. Protocolos (PNT) soportados

Cada protocolo está identificado por código (`PNT-LIM-NNN`) y versión. **La versión exacta del PNT al momento de ejecución queda capturada en el registro.** Si el PNT se actualiza mañana, los registros anteriores conservan la versión contra la que se trabajó.

### 6.1 `PNT-LIM-001` — Limpieza Rutinaria Diaria

- **Versión inicial:** v2.1
- **Aplicación:** habitación ocupada, una vez por turno.
- **Norma:** JCI PCI.04.00 ME #1
- **Tiempo estimado:** 15 minutos
- **Fotos requeridas:** no
- **Pasos:**
1. EPP correctamente colocado (guantes y mascarilla).
1. Retirar desechos comunes y reponer bolsa con segregación correcta.
1. Limpiar y reponer dispensadores (jabón, papel, alcohol gel).
1. Desinfectar superficies de alto contacto (manijas, interruptores, barandas, mesas).
1. Limpiar y desinfectar inodoro y lavamanos.
1. Limpiar piso del baño.
1. Limpiar piso de la habitación.
1. Verificar acabado y reportar hallazgos visibles.

### 6.2 `PNT-LIM-002` — Limpieza Terminal Post-Alta

- **Versión inicial:** v1.3
- **Aplicación:** habitación desocupada tras alta de paciente sin aislamiento.
- **Norma:** JCI PCI.04.00 ME #1 y #3
- **Tiempo estimado:** 45 minutos
- **Fotos requeridas:** sí (Baño, Cama y mobiliario, Área general)
- **Pasos:**
1. EPP completo (guantes, mascarilla, gabacha).
1. Verificar habitación desocupada y cama vacía.
1. Retirar lencería y ropa de cama; enviar a lavandería.
1. Retirar desechos con segregación correcta (común / bioinfeccioso).
1. Retirar y reemplazar cortina de privacidad.
1. Limpiar y desinfectar mobiliario completo (cama, mesa, sillón, sobre-cama).
1. Desinfectar superficies de alto contacto con producto seleccionado.
1. Limpiar baño completo (inodoro, lavamanos, ducha, espejo, accesorios).
1. Limpiar tomas de O₂/succión externamente y rejillas HVAC accesibles.
1. Limpiar y desinfectar pisos (habitación y baño).
1. Reponer insumos (jabón, papel, gel, bolsas).
1. Vestir cama con lencería limpia y verificar acabado.

### 6.3 `PNT-LIM-003` — Limpieza Terminal · Aislamiento Infeccioso

- **Versión inicial:** v1.0
- **Aplicación:** post-alta de paciente en aislamiento por enfermedad infecciosa.
- **Norma:** JCI PCI.04.00 ME #2 y #3
- **Tiempo estimado:** 75 minutos
- **Fotos requeridas:** sí (Baño, Cama y mobiliario, Cortinas retiradas, Área general)
- **Pasos:**
1. EPP reforzado según tipo de aislamiento (incluye respirador N95 si gotitas/aérea).
1. Tiempo de aireación cumplido antes de ingresar.
1. Retirar TODO objeto desmontable y bolsear por separado.
1. Retirar cortinas y almohadas no impermeables; enviar a lavandería marcada.
1. Aplicar desinfectante con tiempo de contacto extendido.
1. Doble desinfección de superficies de alto contacto (dos agentes diferentes).
1. Limpiar baño con desinfectante reforzado.
1. Limpiar pisos con doble pasada.
1. Reponer insumos.
1. Cierre con verificación de superficies (ATP o marcador fluorescente recomendado).

**Restricción:** liberación de habitación bajo este protocolo requiere obligatoriamente rol Verificador PCI, no Supervisor.

### 6.4 `PNT-LIM-004` — Limpieza Alto Riesgo (UCI / Quirófano)

- **Versión inicial:** v1.2
- **Aplicación:** áreas críticas (UCI, quirófanos, CSSP, UCI neonatal, unidades de combustión).
- **Norma:** JCI PCI.04.00 ME #2
- **Tiempo estimado:** 60 minutos
- **Fotos requeridas:** sí (Equipos y monitores, Superficies críticas, Área general)
- **Pasos:**
1. EPP completo, validación con compañero.
1. Pre-limpieza: retirar contaminantes visibles.
1. Desinfección de superficies según matriz de Spaulding.
1. Limpieza de tomas, monitores y equipos según fabricante.
1. Desinfección de pisos con producto autorizado.
1. Verificación con marcador fluorescente o ATP.
1. Cierre y sellado para próximo uso.

**Restricción:** misma que aislamiento — liberación requiere Verificador PCI.

### 6.5 Sugerencia automática de protocolo

El motivo registrado al solicitar limpieza determina el protocolo sugerido por defecto:

|Motivo                                          |Protocolo sugerido|
|------------------------------------------------|------------------|
|Limpieza rutinaria diaria                       |`PNT-LIM-001`     |
|Alta de paciente                                |`PNT-LIM-002`     |
|Post-alta aislamiento infeccioso                |`PNT-LIM-003`     |
|Habitación de UCI / Quirófano (cualquier motivo)|`PNT-LIM-004`     |

El operador puede cambiar el protocolo, pero el sistema registra el cambio como evento en bitácora con justificación obligatoria.

-----

## 7. Modelo de datos

### 7.1 Entidades principales (TypeScript)

```typescript
type UserRole = 'operador' | 'supervisor' | 'pci' | 'gerencia';

interface User {
  id: string;
  fullName: string;
  initials: string;
  code: string;            // SG-014, PCI-003, etc.
  role: UserRole;
  area: string;
  pin: string;             // hashed
  active: boolean;
  createdAt: Date;
}

type RoomState =
  | 'pendiente'
  | 'en_limpieza'
  | 'pend_verificacion'
  | 'con_hallazgos'
  | 'liberada';

interface Room {
  id: string;              // '201', 'UCI-1', etc.
  tipo: string;            // 'Hospitalización', 'Suite', 'Cuidados Intensivos'
  piso: string;
  qrCode: string;          // valor codificado en el QR físico
  highRisk: boolean;       // UCI, quirófano, etc. → requiere PCI para liberar
  state: RoomState;
  motivo?: string;
  motivoSetAt?: Date;
  suggestedProtocolKey?: ProtocolKey;
  activeExecutionId?: string;
  lastExecutionId?: string;
  lastVerificationId?: string;
  lastReleaseAt?: Date;
}

type ProtocolKey = 'rutina' | 'terminal' | 'aislamiento' | 'altoriesgo';

interface Protocol {
  key: ProtocolKey;
  code: string;            // 'PNT-LIM-001'
  version: string;         // 'v2.1'
  name: string;
  norm: string;            // 'JCI PCI.04.00 ME #1'
  estimatedMinutes: number;
  photoRequired: boolean;
  photoSlots: string[];    // ['Baño', 'Cama y mobiliario', ...]
  steps: { idx: number; label: string; }[];
  requiresPciToRelease: boolean;
  active: boolean;
  effectiveFrom: Date;     // las ejecuciones registran qué versión estaba vigente
}

interface Insumo {
  gtin: string;            // GS1
  name: string;
  tipo: 'desinfectante' | 'limpiador' | 'epp' | 'otro';
  lot: string;
  dilution?: string;
  active: boolean;
  expiresAt?: Date;
}

interface ExecutionRecord {
  id: string;
  roomId: string;
  operatorId: string;
  protocolCode: string;
  protocolVersion: string;      // capturado al iniciar, inmutable
  motivo: string;
  qrScannedAt: Date;
  startedAt: Date;
  finishedAt?: Date;
  stepsConfirmed: { idx: number; at: Date; }[];
  insumos: { gtin: string; lot: string; }[];
  photos: { slotIdx: number; url: string; takenAt: Date; }[];
  incidents: { stepIdx: number; text: string; at: Date; }[];
  cancelled: boolean;
  cancelReason?: string;
}

type Severity = 'menor' | 'mayor' | 'critico';

interface VerificationRecord {
  id: string;
  roomId: string;
  executionRecordId: string;
  verifierId: string;
  startedAt: Date;
  finishedAt?: Date;
  results: {
    pointId: string;        // referencia a la plantilla de verificación
    estado: 'conforme' | 'no_conforme' | 'na';
    severity?: Severity;
    note?: string;
    at: Date;
  }[];
  conformidadPct: number;
  late: boolean;              // ventana de verificación excedida
  decision?: 'liberada' | 'devuelta';
  decisionAt?: Date;
}

interface AuditEvent {
  id: string;
  ts: Date;
  roomId?: string;
  actorId?: string;
  type: AuditEventType;
  detail: string;
  payload?: Record<string, unknown>;
  prevEventId?: string;       // para correcciones, referencia al evento corregido
}

type AuditEventType =
  | 'login' | 'logout'
  | 'exec_open' | 'qr_scan' | 'protocol_selected' | 'insumos_selected'
  | 'exec_start' | 'step_confirm' | 'incident' | 'photo' | 'exec_finish' | 'exec_cancel'
  | 'verif_open' | 'verif_finish'
  | 'release' | 'return_for_correction'
  | 'protocol_changed' | 'room_state_change';
```

### 7.2 Plantilla de verificación

La plantilla de verificación está versionada igual que los PNT. Estructura:

```typescript
interface VerificationTemplate {
  code: string;             // 'PVT-LIM-001'
  version: string;
  applicableProtocols: ProtocolKey[];
  areas: {
    name: string;
    items: {
      id: string;
      label: string;
      type: 'L' | 'M';       // Limpieza o Mantenimiento
    }[];
  }[];
}
```

Una plantilla puede aplicarse a varios protocolos (la rutina y terminal pueden compartir plantilla; alto riesgo tendrá una propia con verificación ATP).

### 7.3 Restricciones de base de datos

- Foreign keys con `ON DELETE RESTRICT`. Nada se borra en cascada. La bitácora retiene referencias incluso a entidades retiradas.
- Marcas de tiempo siempre en UTC, conversión a `America/El_Salvador` solo en presentación.
- Eventos de bitácora **inmutables** después de creados; el ORM debe rechazar updates explícitamente.
- Soft-delete para Room y User (`deletedAt` nullable). Nunca hard-delete.

-----

## 8. Flujos y pantallas

Mobile-first. Diseñado para uso con una sola mano. Tap targets ≥44px. Optimizado para uso con guantes. Cada pantalla debe ser usable en pantallas de 360×640px y debe verse correctamente hasta 480px de ancho.

### 8.1 Login

- Selector visual de perfil (en demo se muestra lista; en producción es escaneo de credencial o ingreso de código + PIN).
- Sin recordar sesión: cada vez que la app se abre, requiere autenticación. (JCI no acepta sesiones persistentes en dispositivos compartidos.)

### 8.2 Dashboard

- Strip superior con `Conectado como [nombre] · [rol]` + acción “Cambiar”.
- **Tarjeta de máquina de estados** con los cinco estados y contadores en vivo.
- Lista de habitaciones filtrada por rol:
  - Operador: ve `pendiente` + `con_hallazgos` + sus propias `en_limpieza`.
  - Supervisor / PCI: ve `pend_verificacion` + `con_hallazgos` + `liberada` (para consulta).
  - Gerencia: ve todo, solo lectura.
- Cada tarjeta de habitación: número, tipo, piso, motivo, protocolo sugerido, estado actual, CTA según rol.

### 8.3 Iniciar ejecución (Operador)

**Paso 1 — Anclaje físico (QR):**

- Pantalla con visor de cámara y marco de escaneo.
- Validación: el QR escaneado debe corresponder a una habitación en estado `pendiente` o `con_hallazgos`.
- Si el QR no coincide con la habitación seleccionada en dashboard, el sistema permite redirigir al flujo de la habitación correcta.
- En modo demo / desarrollo: botón “Simular escaneo”.

**Paso 2 — Selección de protocolo:**

- Tarjetas de los 4 protocolos. El sugerido por el motivo aparece marcado.
- Si el operador elige distinto al sugerido, debe ingresar justificación. Evento en bitácora: `protocol_changed`.
- Información visible: código, versión, norma JCI, tiempo estimado, número de pasos, fotos requeridas.

**Paso 3 — Selección de insumos:**

- Lista de insumos activos. Selección múltiple.
- Cada insumo muestra GTIN, lote y dilución.
- El sistema bloquea continuar si ningún insumo desinfectante está seleccionado.

**Paso 4 — Recorrido guiado (Ejecución):**

- Strip superior fijo con cronómetro y meta-información (código PNT, versión, paso actual de total).
- Lista de pasos en orden estricto. El paso siguiente se desbloquea al confirmar el actual.
- Cada paso tiene dos acciones: **Confirmar** (marca de tiempo + check) e **Incidente** (modal para describir).
- El cronómetro corre con `Date.now()`, no editable.

**Paso 5 — Captura fotográfica (si el protocolo lo exige):**

- Slots según el protocolo (3 para terminal, 4 para aislamiento, etc.).
- Cada slot abre la cámara directamente (en web: `<input type="file" capture="environment">`).
- En modo demo: botón para simular las capturas.
- Sin todas las fotos requeridas, el sistema no permite finalizar.

**Paso 6 — Cierre:**

- Pantalla de resumen con todos los metadatos firmados.
- Habitación pasa a `pend_verificacion`.
- Notificación al supervisor responsable.

### 8.4 Verificación (Supervisor / PCI)

**Paso 1 — Revisión read-only de la ejecución:**

- Resumen del Registro de Ejecución: operador, protocolo, tiempos, insumos, fotos, incidentes.
- El verificador puede ver las fotos en grande.

**Paso 2 — Recorrido de verificación:**

- Plantilla de verificación agrupada por áreas (Ingreso/Puerta, Baño, Cama, Higiene, etc.).
- Cada punto tiene tres opciones: **Conforme**, **No conforme**, **N/A**.
- No conforme expande severidad (Menor / Mayor / Crítico) y nota obligatoria.

**Paso 3 — Decisión:**

- Si conformidad ≥ umbral configurable (por defecto: 100% para alto riesgo, ≥95% para terminal, ≥90% para rutina) y sin hallazgos críticos: opción **Liberar habitación**.
- Si hay hallazgos: **Devolver para corrección**. Habitación pasa a `con_hallazgos`. Notificación al operador original y a su supervisor.

### 8.5 Bitácora (todos los roles, según permisos)

- Línea de tiempo de eventos asociados a una habitación, ordenada cronológicamente.
- Cada evento muestra timestamp, tipo, descripción, actor (nombre, rol, código).
- Filtros: por rango de fechas, por tipo de evento, por actor.
- Exportable a PDF con encabezado y pie institucional Avante para auditoría.

### 8.6 Reportes agregados (Gerencia / Supervisor)

Vista de tablero con indicadores:

- % adherencia diaria (habitaciones con ciclo completo / habitaciones que requirieron limpieza).
- Tiempo promedio por protocolo, con benchmark contra tiempo estimado.
- % verificaciones tardías.
- Top 10 hallazgos recurrentes (texto + frecuencia).
- Hallazgos críticos abiertos.
- Adherencia por operador (anonimizable para reportes externos).

Este módulo es la entrada al **Diálogo Mensual de Desempeño** del Marco Lean Avante.

-----

## 9. Reglas de negocio críticas

Son reglas de cumplimiento obligatorio. El código no debe permitir saltarlas, ni siquiera mediante flags de configuración.

1. **Ningún evento anónimo.** Toda escritura en la bitácora requiere `actorId` no nulo. Excepción: eventos del sistema (notificaciones, expiración de sesión) llevan `actorId = 'system'` con flag explícito.
1. **No edición de marcas de tiempo.** Todas las marcas de tiempo se generan en el servidor en el momento del evento. El cliente nunca dicta el timestamp.
1. **Separación de roles obligatoria.** El operador que cerró una ejecución no puede iniciar la verificación de esa misma ejecución. Verificación cruzada en el backend antes de abrir el flujo.
1. **No retroceder estados arbitrariamente.** Las transiciones de estado son las del diagrama de la sección 5. Cualquier transición fuera del diagrama requiere rol Gerencia y deja evento de bitácora con justificación.
1. **PNT versión congelada en el registro.** Cuando un operador inicia ejecución, el código y la versión del PNT al momento se copian al registro. Si el PNT se actualiza después, el registro mantiene la versión original.
1. **Liberación PCI obligatoria en alto riesgo.** Habitaciones con `highRisk = true` o protocolo `aislamiento` / `altoriesgo` solo se liberan con rol Verificador PCI. El supervisor de SG ve la habitación pero no tiene el botón de liberar.
1. **Bitácora append-only.** Updates a `AuditEvent` están prohibidos en el ORM y en la base de datos. Una corrección es un nuevo evento con `prevEventId` apuntando al original.
1. **Política de privacidad fotográfica.** Las fotos deben capturar solo superficies y equipamiento. No pacientes, no pertenencias personales, no documentos. Esta restricción se comunica en cada captura mediante texto visible. El sistema no implementa detección automática; depende del entrenamiento del personal y del muestreo del supervisor.

-----

## 10. Sistema visual Avante (obligatorio)

Tipografía y paleta no negociables. El sistema visual completo está documentado en el skill institucional `sistema-visual-avante` de Abraham; aquí se condensa lo necesario para la implementación.

### 10.1 Tipografía

```css
--font: 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Questrial', sans-serif;
```

Aplicada a todo el sistema. Si Century Gothic no carga, el stack baja a Questrial (Google Fonts disponible) y por último sans-serif del sistema.

### 10.2 Paleta institucional (design tokens)

```css
:root {
  /* Neutrales (dominan) */
  --negro: #1A1A1A;
  --gris: #4A4A4A;
  --gris-med: #6B7280;
  --gris-cl: #E5E5E5;
  --gris-bg: #FAFAFA;
  --gris-bg2: #F4F4F4;
  --blanco: #FFFFFF;

  /* Acentos institucionales */
  --azul-marino: #1A2B4A;
  --turquesa: #5B9BA8;
  --violeta: #7A6B8E;

  /* Semáforo funcional (uso operativo) */
  --verde: #1F5740;     /* conforme, cumple */
  --ambar: #B8862E;     /* severidad menor */
  --rojo: #A0322D;      /* crítico, no conforme */
  --rojo2: #B8443A;     /* severidad mayor */
}
```

### 10.3 Reglas de aplicación

- Los neutrales dominan toda la chrome (header, fondo, texto, bordes, separadores).
- Los acentos institucionales se reservan para series de datos en gráficos y elementos puntuales de jerarquía.
- El semáforo funcional se permite **solo** en botones de estado interactivos (Conforme / No conforme), severidades de hallazgos y chips de estado de habitación. **Justificación documentada:** son herramientas operativas donde el color cumple función *poka-yoke*. Esto es una desviación deliberada y registrada del principio institucional general de “estados sin fondo coloreado”, autorizada para herramientas operativas mobile (no aplica a documentos institucionales que vayan a Junta, JCI o reguladores).
- Sin gradientes, sin sombras pesadas, sin efectos 3D, sin bordes superiores de color en tarjetas.
- Iconografía exclusivamente lineal fina, monocromática (`#1A1A1A` o `#4A4A4A`), estilo Lucide.
- Radios de borde máximo 4px.
- Sin emojis en chrome ni mensajes operativos. Permitidos solo en mensajes informales del operador (notas), si el teclado los introduce.

### 10.4 Componentes base

El sistema requiere los siguientes componentes reutilizables, todos con la estética Avante:

- `Button` (variantes: primary, ghost, success, warn).
- `Card` (white, hairline border, radio 4px).
- `StatePill` (con color según estado).
- `Badge` (uppercase tracking, neutral).
- `StepBlock` (con estados pending / active / done y marca de tiempo).
- `PhotoSlot` (con captura de cámara y previsualización).
- `Stepper` (horizontal, con candado en pasos futuros).
- `Timer` (clock display monoespaciado).
- `Modal` (con header, body, acciones).
- `Toast` (notificación efímera al pie).

El prototipo HTML adjunto (`limpieza-trazabilidad-jci-v2.html`) implementa todos estos componentes y debe servir de referencia visual exacta.

-----

## 11. Stack técnico recomendado

> **Nota de actualización (decisión de plataforma):** esta sección fue revisada
> para **desplegar en Cloudflare** (decisión de stack §18.4). Sustituye la
> recomendación original de self-hosting + Docker. La justificación offline-first
> y mobile-first se conserva intacta. Ver la **salvedad de residencia de datos**
> en §11.1.

### 11.1 Arquitectura

**Recomendación:** Next.js 15 (App Router) + TypeScript + PostgreSQL, desplegada como **PWA** (Progressive Web App) con capacidad offline-first, **sobre Cloudflare Workers** mediante el adaptador **OpenNext** (`@opennextjs/cloudflare`).

Justificación:

- **PWA mobile-first** permite instalación en pantalla de inicio de iPhone/Android sin tienda, sin proceso de aprobación, con experiencia equivalente a app nativa.
- **Offline-first** es crítico porque las habitaciones de hospitalización en Avante tienen WiFi inconsistente. El operador debe poder completar el flujo offline y sincronizar al reconectarse.
- **TypeScript** alinea con el roadmap de desarrollo de Avante y con Claude Code.
- **PostgreSQL** es robusto, defensible para auditoría y soporta extensiones para auditoría JSON. Se mantiene como base de datos y se conecta desde Workers vía **Hyperdrive** (pooling/aceleración).
- **Cloudflare Workers + R2 + Hyperdrive** dan red global, despliegue sin servidores que administrar, y almacenamiento de objetos S3-compatible, conservando Postgres para la defensibilidad de auditoría.
- **API REST** (Next.js Route Handlers sobre Workers) permite que el sistema se exponga eventualmente como módulo del HIS futuro o se integre con Odoo.

> **⚠️ Salvedad de residencia de datos.** La versión original prefería
> self-hosting en infraestructura Avante "por consideraciones de datos clínicos".
> Cloudflare es nube pública sin región en El Salvador/LATAM cercana. Es
> defendible porque las fotos no contienen PII (solo superficies y equipamiento,
> §9.8), pero la decisión debe quedar firmada por Gerencia/PCI, documentando el
> uso del **Data Localization Suite** y restricciones de jurisdicción en R2.

### 11.2 Stack específico (Cloudflare)

> **Restricción de runtime:** Workers corre en `workerd`, **no en Node**. Habilitar
> `nodejs_compat` y un `compatibility_date` reciente en `wrangler.jsonc`. Dos
> piezas del stack original **no corren en Workers** y se reemplazan: `sharp`
> (binario nativo → Cloudflare Images o compresión en cliente) y `argon2` nativo
> (→ argon2id vía WASM `hash-wasm`, o PBKDF2 con Web Crypto).

```
Frontend / App:
  - Next.js 15 (App Router, Server Components donde aplique)
  - TypeScript estricto
  - Tailwind CSS + design tokens Avante
  - shadcn/ui (customizado a Avante)
  - lucide-react para iconografía
  - React Hook Form + Zod para validación
  - TanStack Query para estado server
  - Serwist para service worker / offline; IndexedDB para borradores offline

Plataforma / Backend (Cloudflare):
  - Cloudflare Workers como runtime (adaptador OpenNext @opennextjs/cloudflare)
  - Next.js Route Handlers (API en el mismo proyecto)
  - Prisma ORM con driver adapter @prisma/adapter-pg sobre Hyperdrive
  - PostgreSQL 16+ gestionado (Neon / Prisma Postgres / self-hosted), vía Hyperdrive
  - Auth.js / NextAuth (Credentials, PIN hasheado con argon2id vía hash-wasm)
  - Sesiones de corta duración en Workers KV (sin sesión persistente)

Funcionalidades específicas:
  - html5-qrcode o @zxing/browser para escaneo de QR (cliente)
  - qrcode para generación de QR de habitaciones
  - Cloudflare Images (o compresión en cliente) para procesamiento de fotos
  - Cloudflare R2 para almacenamiento de fotos (S3-compatible)
  - Cloudflare Queues para sincronización/conflictos y notificaciones
  - Cron Triggers para resúmenes diarios de KPIs

Observabilidad:
  - Workers Logs / observability habilitada en wrangler
  - Logging estructurado; OpenTelemetry para trazas (opcional v2)

Deployment / tooling:
  - Wrangler (config, bindings, deploy). Bindings: HYPERDRIVE, R2, KV, Queues
  - `wrangler dev` / `opennextjs-cloudflare preview` para preview fiel a workerd
  - `next dev` para iteración rápida en desarrollo
```

### 11.3 Capacidad offline-first (crítico)

El operador debe poder:

- Iniciar sesión offline si la app fue abierta al menos una vez con red.
- Escanear QR offline.
- Ejecutar el flujo completo offline.
- Tomar fotos offline (almacenadas en IndexedDB temporalmente).
- Cerrar la ejecución offline.

Al recuperar conexión:

- Sincronización automática con el servidor.
- Los timestamps se conservan (el cliente los registra localmente, el servidor los acepta como fact dada la huella criptográfica del dispositivo autenticado).
- Resolución de conflictos: last-write-wins por roomId+timestamp; en caso de colisión, evento de bitácora `sync_conflict` para revisión humana.

La verificación puede exigir conectividad (es una acción crítica de validación). Decisión confirmar con PCI.

### 11.4 Generación de QR de habitaciones

Endpoint administrativo (rol Gerencia) que genera un PDF imprimible para cada habitación con:

- QR de tamaño 8×8 cm.
- Número de habitación en grande debajo.
- Pie con `Avante Complejo Hospitalario` y código de proyecto.

QR codifica un URL profundo:

```
https://[app-domain]/r/[roomId]?t=[shortAuthToken]
```

El token se valida en el backend para evitar QR falsificados. Rotación opcional anual.

-----

## 12. Integraciones

### 12.1 Odoo (mediano plazo)

- Webhook `room_release` que publica en Odoo cuando una habitación se libera, para que el módulo de admisión sepa cuál habitación está disponible.
- Endpoint `cleaning_request` para que Odoo (o el HIS futuro) cree solicitudes de limpieza automáticas al registrar alta de paciente.

### 12.2 HIS futuro (HAS Solutions u otro)

- API documentada con OpenAPI 3.1.
- Endpoint para consumir registros de limpieza por habitación.
- Endpoint para consumir reportes agregados.
- Compatibilidad con HL7 FHIR R4 (recurso `Encounter` y `Location`) como roadmap v2.

### 12.3 n8n (workflows operacionales)

- Notificación push a operador cuando habitación se devuelve para corrección.
- Notificación push a supervisor cuando ejecución se cierra (ventana de verificación activa).
- Resumen diario al supervisor con KPIs del turno.
- Alerta a Gerencia cuando `% adherencia diaria < 80%` o cuando hay hallazgos críticos sin cerrar.

-----

## 13. Alcance v1 vs futuro

### 13.1 En alcance v1

Todo lo descrito en este documento salvo lo explícitamente excluido.

### 13.2 Fuera de alcance v1

- Detección automática de patrones de fraude (ej. tiempos imposibles de protocolo).
- Integración ATP / marcadores fluorescentes con lectura automática del dispositivo.
- Módulo de gestión de inventario de insumos (consumo automático al usar).
- Sincronización con HIS (queda como API expuesta, sin cliente).
- Reportes hacia GS1 Healthcare exteriores.
- Versión web para escritorio del operador (la app es mobile-first; escritorio solo para gerencia y bitácora).
- Soporte multi-hospital (Avante es un solo tenant en v1).
- Internacionalización (solo español de El Salvador en v1).

### 13.3 v2 prevista (3-6 meses post v1)

- Integración con sensores ATP de cierre.
- Módulo de consumo de insumos atado a Odoo.
- Reportes hacia HIS / FHIR.
- Dashboard de Gerencia accesible desde escritorio.

-----

## 14. Criterios de aceptación

El sistema se considera entregable cuando:

1. Un operador puede completar el flujo de Limpieza Terminal post-alta (`PNT-LIM-002`) desde login hasta cierre de ejecución, en una habitación piloto, con cronómetro real corriendo, captura de 3 fotografías reales y selección de al menos 2 insumos. Tiempo de ejecución de la app (sin contar la limpieza) ≤ 90 segundos de interacciones.
1. Un supervisor distinto al operador puede completar la verificación, ver el registro de ejecución read-only, y liberar la habitación. El sistema rechaza el intento del mismo operador de verificar su propia ejecución.
1. La bitácora muestra al menos 15 eventos para ese ciclo completo, todos con timestamp, tipo, descripción y actor.
1. El flujo funciona offline completo (avión activado) durante toda la ejecución, y sincroniza correctamente al reconectarse.
1. El QR escaneado fuera del set válido es rechazado con mensaje claro.
1. Una habitación de UCI (`highRisk = true`) no puede ser liberada por un supervisor de SG; el botón aparece deshabilitado con explicación. Solo Verificador PCI la libera.
1. La bitácora es exportable a PDF con encabezado y pie institucional Avante.
1. La aplicación es instalable como PWA en iPhone y Android. Carga primer pantalla en ≤2 segundos en una red 3G simulada.
1. Cobertura de pruebas automatizadas ≥80% en el dominio (state machine, business rules, audit log inmutabilidad).
1. Lighthouse PWA score ≥90.

-----

## 15. Datos semilla para desarrollo

Para que Claude Code pueda demostrar el sistema funcionando, sembrar:

- 4 usuarios (1 supervisor SG, 2 operadores SG, 1 PCI).
- 6 habitaciones de demo en distintos estados (`pendiente`, `pend_verificacion`, `liberada`, una `con_hallazgos`, una de UCI alto riesgo, una Suite).
- 5 insumos con GTIN y lote.
- Los 4 protocolos completos.
- 1 plantilla de verificación.
- Bitácora con 1 ciclo completo de Hab. 301 ya cerrado, para demostrar la línea de tiempo.

-----

## 16. Articulación con Marco Lean Avante

- **Principio activado:** *Sin estándar no hay mejora* (el PNT vive en la app). *Detenerse ante el defecto* (habitación no se libera con hallazgos críticos sin corregir). *Lo correcto en el momento correcto* (protocolo correcto contra el motivo). *Quien hace el proceso lo mejora* (incidentes del operador alimentan revisión de PNT).
- **Desperdicios atacados:** defectos (infecciones intrahospitalarias prevenibles), retrabajo, esperas en admisiones por habitación no liberada, talento subutilizado (sin visibilidad del trabajo bien hecho).
- **Cliente afectado:** paciente (recibe), médico (elige) — ambos atendidos por el aseguramiento de un ambiente limpio y trazable.
- **Indicadores Lean impactados:** OTD (habitación entregada a tiempo a admisión), tiempo de respuesta, mejoras implementadas (PNT actualizado), 5S (estándar visible).
- **Rutina que lo sostiene:** Diálogo mensual de desempeño con Servicios Generales sobre los reportes agregados del sistema. Revisión trimestral con Comité de Infecciones.

-----

## 17. Valor Generado

|Dimensión               |Año 1                                                              |Año 2                                                           |Año 3                                                        |
|------------------------|-------------------------------------------------------------------|----------------------------------------------------------------|-------------------------------------------------------------|
|**Impacto económico**   |Capacidad construida hacia auditoría JCI 8 (no monetizable directo)|Reducción estimada de HAI prevenibles a cuantificar con baseline|Posicionamiento ante reaseguradoras y referentes corporativos|
|**Eficiencia operativa**|Tiempo de respuesta habitación-a-admisión medible y visible        |Adherencia 100% con evidencia trazable                          |Tiempos promedio optimizados por protocolo                   |
|**Impacto en personas** |Servicios Generales con visibilidad de su trabajo bien hecho       |Reducción de fricción con Admisiones                            |Profesionalización del rol de operador de limpieza           |
|**Riesgo mitigado**     |Riesgo de no-conformidad JCI PCI.04.00 ME #4                       |Riesgo de brote intrahospitalario sin trazabilidad de causa     |Riesgo reputacional y regulatorio                            |

-----

## 18. Dependencias y precondiciones

Antes de codificar la primera línea, las siguientes condiciones deben estar resueltas:

1. **Co-liderazgo formal con Dr. Josué Flores y Comité de Infecciones.** El sistema digitaliza un estándar; el estándar es responsabilidad de PCI. Sin esa conversación, el proyecto carece de cuerpo normativo.
1. **PNT base auditados.** Estado actual de `PNT-LIM-001`, `PNT-LIM-002`, `PNT-LIM-003`, `PNT-LIM-004` confirmado con Arely Montaño. Si alguno no existe o no está vigente, se redacta primero antes de digitalizar.
1. **Confirmación de Lic. Byron Rodríguez** sobre presupuesto y prioridad relativa frente a otros frentes activos (HIS, GS1 farmacia, restructuración Compras).
1. **Confirmación de Edwin Martínez** sobre stack técnico y capacidad de soporte interno.
1. **Reglamento interno actualizado** comunicando al personal el uso de identidad autenticada y captura de fotografías como herramienta de trabajo (Código de Trabajo de El Salvador).

-----

## 19. Glosario

- **HAI**: Healthcare-Associated Infection. Infección adquirida en el ambiente hospitalario.
- **PCI**: Prevención y Control de Infecciones (capítulo JCI).
- **PNT**: Procedimiento Normalizado de Trabajo.
- **EPP**: Equipo de Protección Personal.
- **GTIN**: Global Trade Item Number (identificador de producto GS1).
- **EPCIS**: Electronic Product Code Information Services (estándar GS1 de eventos de trazabilidad).
- **ATP**: Adenosín Trifosfato. Marcador de carga orgánica residual usado para verificar limpieza.
- **PWA**: Progressive Web App.
- **MCI**: Management of Communication and Information (capítulo JCI).

-----

## 20. Anexos referenciables

- Prototipo HTML interactivo: `limpieza-trazabilidad-jci-v2.html` (referencia visual y de flujo).
- Skill institucional `sistema-visual-avante` (sistema visual completo Avante).
- GO-MEM-001-2026 (Marco Lean Avante).
- JCI Accreditation Standards for Hospitals, 8th edition, capítulo PCI.

-----

*Documento elaborado por la Gerencia de Operaciones para entrega a equipo de desarrollo. Sujeto a revisión por Dr. Josué Flores (Gerencia Médica / PCI) antes de inicio de codificación.*