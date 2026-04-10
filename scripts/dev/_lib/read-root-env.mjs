import fs from "fs";
import path from "path";

/**
 * Lit une variable depuis le fichier `.env` à la racine du dépôt.
 * Exécuter les scripts depuis la racine : `node scripts/dev/...`
 */
export function readRootEnvVar(name) {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^\\s*${escaped}\\s*=\\s*"?([^"\\r\\n]+)"?`, "m");
  const m = raw.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}
