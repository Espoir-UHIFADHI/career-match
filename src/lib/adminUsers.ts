/**
 * Comptes « admin » côté client : bypass des garde-fous crédits (UI + useCredit).
 * Configurez `VITE_ADMIN_EMAILS` en prod (liste séparée par des virgules).
 * Si la variable n'est pas définie, un e-mail par défaut conserve le comportement historique.
 */
const DEFAULT_ADMIN_EMAILS = ["espoiradouwekonou20@gmail.com"] as const;

function normalizedAdminEmails(): string[] {
    const raw = import.meta.env.VITE_ADMIN_EMAILS;
    if (raw === undefined) {
        return [...DEFAULT_ADMIN_EMAILS];
    }
    return raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
    if (!email) return false;
    const list = normalizedAdminEmails();
    if (list.length === 0) return false;
    return list.includes(email.trim().toLowerCase());
}
