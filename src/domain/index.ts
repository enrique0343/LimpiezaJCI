// Pure, framework-free domain core. The §9 business rules live here so they can
// be enforced consistently (API, sync, UI) and covered by tests (spec §14).
export * from "./types";
export * from "./state-machine";
export * from "./protocols";
export * from "./rules";
export * from "./audit";
