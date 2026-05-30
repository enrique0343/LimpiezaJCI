// Seed data for demos (spec §15). Mirrors the prototype's DATA block.
import type { ProtocolKey } from "@/domain/types";
import type {
  AppUser,
  Insumo,
  Protocol,
  Room,
  VerifArea,
} from "./types";

export const USERS: AppUser[] = [
  { id: "u1", fullName: "María López", initials: "ML", code: "SG-014", role: "operador", area: "Servicios Generales" },
  { id: "u2", fullName: "José Ramírez", initials: "JR", code: "SG-022", role: "operador", area: "Servicios Generales" },
  { id: "u3", fullName: "Arely Montaño", initials: "AM", code: "SG-001", role: "supervisor", area: "Servicios Generales" },
  { id: "u4", fullName: "Dra. Sandra Cruz", initials: "SC", code: "PCI-003", role: "pci", area: "Comité PCI / Infecciones" },
];

export const ROLE_LABEL: Record<string, string> = {
  operador: "Operador",
  supervisor: "Supervisor",
  pci: "Verificador PCI",
  gerencia: "Gerencia",
};

// Demo PINs (in production these are argon2id hashes — never plaintext, §4).
export const DEMO_PINS: Record<string, string> = {
  u1: "1234",
  u2: "2345",
  u3: "3456",
  u4: "4567",
};

export const PROTOCOLS: Record<ProtocolKey, Protocol> = {
  rutina: {
    key: "rutina",
    name: "Limpieza Rutinaria Diaria",
    code: "PNT-LIM-001",
    version: "v2.1",
    norm: "JCI PCI.04.00 · ME #1",
    desc: "Limpieza diaria de habitación ocupada. Superficies de alto contacto, baño, pisos, dispensadores.",
    estTime: "~15 min",
    photoReq: false,
    photoSlots: [],
    steps: [
      "EPP correctamente colocado (guantes y mascarilla)",
      "Retirar desechos comunes y reponer bolsa con segregación",
      "Limpiar y reponer dispensadores (jabón, papel, alcohol gel)",
      "Desinfectar superficies de alto contacto (manijas, interruptores, barandas, mesas)",
      "Limpiar y desinfectar inodoro y lavamanos",
      "Limpiar piso del baño",
      "Limpiar piso de la habitación",
      "Verificar acabado y reportar hallazgos visibles",
    ],
  },
  terminal: {
    key: "terminal",
    name: "Limpieza Terminal Post-Alta",
    code: "PNT-LIM-002",
    version: "v1.3",
    norm: "JCI PCI.04.00 · ME #1, #3",
    desc: "Limpieza exhaustiva tras alta del paciente. Habitación desocupada, retiro total, desinfección profunda.",
    estTime: "~45 min",
    photoReq: true,
    photoSlots: ["Baño", "Cama y mobiliario", "Área general"],
    steps: [
      "EPP completo (guantes, mascarilla, gabacha)",
      "Verificar habitación desocupada y cama vacía",
      "Retirar lencería y ropa de cama; enviar a lavandería",
      "Retirar desechos con segregación correcta (común / bioinfeccioso)",
      "Retirar y reemplazar cortina de privacidad",
      "Limpiar y desinfectar mobiliario completo (cama, mesa, sillón, sobre-cama)",
      "Desinfectar superficies de alto contacto con producto seleccionado",
      "Limpiar baño completo (inodoro, lavamanos, ducha, espejo, accesorios)",
      "Limpiar tomas de O₂/succión externamente y rejillas HVAC accesibles",
      "Limpiar y desinfectar pisos (habitación y baño)",
      "Reponer insumos (jabón, papel, gel, bolsas)",
      "Vestir cama con lencería limpia y verificar acabado",
    ],
  },
  aislamiento: {
    key: "aislamiento",
    name: "Limpieza Terminal · Aislamiento Infeccioso",
    code: "PNT-LIM-003",
    version: "v1.0",
    norm: "JCI PCI.04.00 · ME #2, #3",
    desc: "Post-alta de paciente en aislamiento por enfermedad infecciosa. Protocolo reforzado con doble agente.",
    estTime: "~75 min",
    photoReq: true,
    photoSlots: ["Baño", "Cama y mobiliario", "Cortinas retiradas", "Área general"],
    steps: [
      "EPP reforzado según tipo de aislamiento (incluye respirador N95 si aplica)",
      "Tiempo de aireación cumplido antes de ingresar",
      "Retirar TODO objeto desmontable y bolsear por separado",
      "Retirar cortinas, almohadas no impermeables y enviar a lavandería marcada",
      "Aplicar desinfectante con tiempo de contacto extendido",
      "Doble desinfección de superficies de alto contacto (dos agentes diferentes)",
      "Limpiar baño con desinfectante reforzado",
      "Limpiar pisos con doble pasada",
      "Reponer insumos",
      "Cierre: verificación de superficies (recomendado ATP o fluorescente)",
    ],
  },
  altoriesgo: {
    key: "altoriesgo",
    name: "Limpieza Alto Riesgo (UCI / Quirófano)",
    code: "PNT-LIM-004",
    version: "v1.2",
    norm: "JCI PCI.04.00 · ME #2",
    desc: "Áreas críticas. Cumple matriz de Spaulding y verificación con marcador o ATP.",
    estTime: "~60 min",
    photoReq: true,
    photoSlots: ["Equipos y monitores", "Superficies críticas", "Área general"],
    steps: [
      "EPP completo, validación con compañero",
      "Pre-limpieza: retirar contaminantes visibles",
      "Desinfección de superficies según matriz de Spaulding",
      "Limpieza de tomas, monitores y equipos según fabricante",
      "Desinfección de pisos con producto autorizado",
      "Verificación con marcador fluorescente o ATP",
      "Cierre y sellado para próximo uso",
    ],
  },
};

export const INSUMOS: Insumo[] = [
  { gtin: "07501234567890", name: "Hipoclorito de sodio 5.25%", lot: "A2026-114", dil: "1:10 (5,000 ppm)", tipo: "desinfectante" },
  { gtin: "07501234567906", name: "Peróxido de hidrógeno 1.4%", lot: "B2026-088", dil: "Listo para usar", tipo: "desinfectante" },
  { gtin: "07501234567913", name: "Cuaternario de amonio 5G", lot: "C2026-201", dil: "1:128", tipo: "desinfectante" },
  { gtin: "07501234567920", name: "Alcohol isopropílico 70%", lot: "D2026-045", dil: "Listo para usar", tipo: "desinfectante" },
  { gtin: "07501234567937", name: "Detergente neutro hospitalario", lot: "E2026-022", dil: "1:64", tipo: "limpiador" },
];

export const VERIF_TEMPLATE: VerifArea[] = [
  {
    area: "Ingreso y Puerta",
    items: [
      { id: "i1", t: "M", l: "Puerta abre y cierra sin obstrucción" },
      { id: "i2", t: "L", l: "Hoja de puerta sin suciedad ni marcas" },
      { id: "i3", t: "M", l: "Número de habitación y señalética legibles" },
    ],
  },
  {
    area: "Baño",
    items: [
      { id: "b1", t: "L", l: "Sin suciedad en contornos, esquinas y zócalos" },
      { id: "b2", t: "L", l: "Inodoro limpio y desinfectado" },
      { id: "b3", t: "M", l: "Tapa del inodoro firme, sin holgura" },
      { id: "b4", t: "M", l: "Llave del lavamanos sin fuga" },
      { id: "b5", t: "L", l: "Espejo limpio y bien fijado" },
      { id: "b6", t: "L", l: "Sin moho ni humedad en juntas" },
    ],
  },
  {
    area: "Área de cama y paciente",
    items: [
      { id: "c1", t: "L", l: "Cama limpia y desinfectada, lencería correcta" },
      { id: "c2", t: "M", l: "Barandas y mando de cama operativos" },
      { id: "c3", t: "M", l: "Tomas de O₂/succión sin daño visible" },
    ],
  },
  {
    area: "Higiene y dispensadores",
    items: [
      { id: "h1", t: "L", l: "Dispensador de alcohol gel con carga" },
      { id: "h2", t: "L", l: "Insumos de higiene completos" },
      { id: "h3", t: "L", l: "Bote de desechos limpio y segregación correcta" },
    ],
  },
];

const now = Date.now();
const HOUR = 3600e3;

// 6 demo rooms in varied states (spec §15). QR codes anchor the physical scan.
export function seedRooms(): Room[] {
  return [
    { id: "201", tipo: "Hospitalización", piso: "Piso 2", state: "pendiente", motivo: "Alta de paciente", suggestedProto: "terminal", highRisk: false, qrCode: "LJCI-201" },
    { id: "202", tipo: "Hospitalización", piso: "Piso 2", state: "pendiente", motivo: "Limpieza rutinaria diaria", suggestedProto: "rutina", highRisk: false, qrCode: "LJCI-202" },
    {
      id: "203",
      tipo: "Hospitalización",
      piso: "Piso 2",
      state: "pend_verificacion",
      motivo: "Alta de paciente",
      suggestedProto: "terminal",
      highRisk: false,
      qrCode: "LJCI-203",
      execRecord: {
        id: "exec-203",
        operatorId: "u2",
        protoKey: "terminal",
        protocolCode: "PNT-LIM-002",
        protocolVersion: "v1.3",
        motivo: "Alta de paciente",
        qrScannedAt: now - 2 * HOUR,
        startedAt: now - 2 * HOUR,
        finishedAt: now - 0.25 * HOUR,
        stepsConfirmed: Array.from({ length: 12 }, (_, i) => ({ idx: i, at: now - 2 * HOUR + (i + 1) * 200e3 })),
        insumos: ["07501234567906", "07501234567920"],
        photos: { 0: "demo", 1: "demo", 2: "demo" },
        incidents: [],
      },
    },
    {
      id: "301",
      tipo: "Suite",
      piso: "Piso 3",
      state: "liberada",
      motivo: "Alta de paciente",
      suggestedProto: "terminal",
      highRisk: false,
      qrCode: "LJCI-301",
      execRecord: {
        id: "exec-301",
        operatorId: "u1",
        protoKey: "terminal",
        protocolCode: "PNT-LIM-002",
        protocolVersion: "v1.3",
        motivo: "Alta de paciente",
        qrScannedAt: now - 24 * HOUR,
        startedAt: now - 24 * HOUR,
        finishedAt: now - 23.2 * HOUR,
        stepsConfirmed: Array.from({ length: 12 }, (_, i) => ({ idx: i, at: now - 24 * HOUR + (i + 1) * 230e3 })),
        insumos: ["07501234567906", "07501234567920"],
        photos: { 0: "demo", 1: "demo", 2: "demo" },
        incidents: [],
      },
      verifRecord: {
        id: "verif-301",
        verifierId: "u3",
        startedAt: now - 23 * HOUR,
        finishedAt: now - 22.8 * HOUR,
        results: {},
        conformidad: 100,
        late: false,
        decision: "liberada",
      },
      releasedAt: now - 22.8 * HOUR,
    },
    { id: "302", tipo: "Suite", piso: "Piso 3", state: "pendiente", motivo: "Alta de paciente", suggestedProto: "terminal", highRisk: false, qrCode: "LJCI-302" },
    { id: "UCI-1", tipo: "Cuidados Intensivos", piso: "Piso 1", state: "pendiente", motivo: "Post-alta aislamiento infeccioso", suggestedProto: "aislamiento", highRisk: true, qrCode: "LJCI-UCI-1" },
  ];
}
