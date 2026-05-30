// Display formatting in es-SV. Timestamps are stored UTC (epoch ms) and
// converted to America/El_Salvador only here for display (spec §7.3).
const TZ = "America/El_Salvador";

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("es-SV", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function elapsed(start: number, end: number): string {
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
