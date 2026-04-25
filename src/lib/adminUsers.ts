/**
 * Comptes « admin » côté client : bypass des garde-fous crédits (UI + useCredit).
 * Configurez `VITE_ADMIN_EMAILS` en prod (liste séparée par des virgules).
 * Si la variable n'est pas définie, aucun bypass n'est activé.
 */

function normalizedAdminEmails(): string[] {
    const raw = import.meta.env.VITE_ADMIN_EMAILS;
    if (raw === undefined) {
        return [];
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
