// Consent Mode v2 — Utilitaire de gestion du consentement RGPD
// Conforme à la EU User Consent Policy de Google (obligatoire pour Google Ads en EEE)

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: Record<string, any>[];
    }
}

const STORAGE_KEY = 'cm_consent';

export interface ConsentState {
    ads: 'granted' | 'denied';
    analytics: 'granted' | 'denied';
    // true = l'utilisateur a interagi avec la bannière (accepté ou refusé)
    decided: boolean;
}

export function getStoredConsent(): ConsentState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ConsentState;
    } catch {
        return null;
    }
}

export function hasDecided(): boolean {
    return getStoredConsent()?.decided === true;
}

function pushGtag(...args: any[]) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
}

export function applyConsent(state: ConsentState) {
    // Mettre à jour Consent Mode v2 via gtag
    if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
            ad_storage:         state.ads,
            analytics_storage:  state.analytics,
            ad_user_data:       state.ads,
            ad_personalization: state.ads,
        });
    } else {
        // Fallback si gtag pas encore chargé
        pushGtag('consent', 'update', {
            ad_storage:         state.ads,
            analytics_storage:  state.analytics,
            ad_user_data:       state.ads,
            ad_personalization: state.ads,
        });
    }

    // Persister dans localStorage pour que index.html puisse le lire au prochain chargement
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function acceptAll() {
    applyConsent({ ads: 'granted', analytics: 'granted', decided: true });
}

export function rejectAll() {
    applyConsent({ ads: 'denied', analytics: 'denied', decided: true });
}

export function acceptAnalyticsOnly() {
    applyConsent({ ads: 'denied', analytics: 'granted', decided: true });
}
