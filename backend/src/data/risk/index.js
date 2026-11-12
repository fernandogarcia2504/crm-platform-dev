// Carga de catálogos JSON en ESM (sin depender de "import ... with { type: 'json' }").
import { readFileSync } from "fs";

const load = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf-8"));

export const methodology = load("methodology.json");
export const annexA = load("iso27001-2022-annexA.json");
export const threats = load("threats.json");
export const vulnerabilities = load("vulnerabilities.json");
export const riskSources = load("risk-sources.json");
