declare global {
    interface Window {
        clarity: (command: string, ...args: any[]) => void;
        dataLayer: Record<string, any>[];
    }
}

function pushToDataLayer(eventName: string, details?: Record<string, any>) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: eventName,
        ...details,
    });
}

export function trackEvent(eventName: string, details?: Record<string, any>) {
    // GTM / Google Ads / GA4 - source de vérité pour les conversions
    pushToDataLayer(eventName, details);

    // Microsoft Clarity - heatmaps et session recording
    if (window.clarity) {
        window.clarity("event", eventName);
        if (details) {
            Object.entries(details).forEach(([key, value]) => {
                window.clarity("set", key, String(value));
            });
        }
    }

    if (import.meta.env.DEV) {
        console.log(`[Analytics] ${eventName}`, details);
    }
}

// ─── Événements funnel nommés ────────────────────────────────────────────────

export function trackSignUp(method: string) {
    trackEvent("sign_up", { method });
}

export function trackCVUploaded(fileType: string) {
    trackEvent("cv_uploaded", { file_type: fileType });
}

export function trackAnalysisStarted() {
    trackEvent("analysis_started");
}

export function trackAnalysisCompleted(matchScore: number) {
    trackEvent("analysis_completed", { match_score: matchScore });
}

export function trackPricingPageViewed() {
    trackEvent("pricing_page_viewed");
}

export function trackCheckoutStarted(plan: string, value: number) {
    trackEvent("begin_checkout", { plan, value, currency: "EUR" });
}

export function trackPurchaseCompleted(plan: string, value: number, transactionId?: string) {
    trackEvent("purchase", {
        plan,
        value,
        currency: "EUR",
        transaction_id: transactionId ?? `gumroad_${Date.now()}`,
    });
}

export function trackQuickScanStarted() {
    trackEvent("quick_scan_started");
}

export function trackQuickScanCompleted(score: number) {
    trackEvent("quick_scan_completed", { ats_score: score });
}

export function trackCTAClicked(location: string, label: string) {
    trackEvent("cta_clicked", { location, label });
}
