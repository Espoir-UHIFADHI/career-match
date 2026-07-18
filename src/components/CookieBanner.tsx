import { useState, useEffect } from "react";
import { Cookie, ChevronDown, ChevronUp, Shield, BarChart2, Target } from "lucide-react";
import { hasDecided, acceptAll, rejectAll, acceptAnalyticsOnly } from "../utils/consent";

export function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [analyticsChecked, setAnalyticsChecked] = useState(true);
    const [adsChecked, setAdsChecked] = useState(true);

    useEffect(() => {
        // N'afficher que si l'utilisateur n'a pas encore décidé
        if (!hasDecided()) {
            // Léger délai pour ne pas bloquer le rendu initial
            const t = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(t);
        }
    }, []);

    if (!visible) return null;

    const handleAcceptAll = () => {
        acceptAll();
        setVisible(false);
    };

    const handleRejectAll = () => {
        rejectAll();
        setVisible(false);
    };

    const handleSaveCustom = () => {
        if (analyticsChecked && adsChecked) {
            acceptAll();
        } else if (analyticsChecked && !adsChecked) {
            acceptAnalyticsOnly();
        } else {
            rejectAll();
        }
        setVisible(false);
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-slide-up"
            role="dialog"
            aria-label="Préférences de cookies"
            aria-modal="true"
        >
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">

                {/* Bandeau principal */}
                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <Cookie className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-slate-900 mb-1">
                                Vos préférences de cookies
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Nous utilisons des cookies pour mesurer l'audience et améliorer nos publicités.
                                Les cookies essentiels (authentification, sécurité) sont toujours actifs.{" "}
                                <a href="/privacy" className="text-indigo-600 hover:underline">
                                    En savoir plus
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Zone personnalisation expandable */}
                    {expanded && (
                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">

                            {/* Cookies essentiels — toujours actifs */}
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Cookies essentiels</span>
                                        <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Toujours actifs</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Authentification (Clerk), sécurité de session. Nécessaires au fonctionnement du site.
                                    </p>
                                </div>
                            </div>

                            {/* Cookies analytiques */}
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
                                <BarChart2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Cookies analytiques</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={analyticsChecked}
                                                onChange={(e) => setAnalyticsChecked(e.target.checked)}
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Google Analytics, Microsoft Clarity. Nous aident à comprendre comment le site est utilisé.
                                    </p>
                                </div>
                            </div>

                            {/* Cookies publicitaires */}
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
                                <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Cookies publicitaires</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={adsChecked}
                                                onChange={(e) => setAdsChecked(e.target.checked)}
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Google Ads. Permettent de mesurer l'efficacité de nos campagnes publicitaires.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-5">
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
                        >
                            Tout accepter
                        </button>
                        {expanded ? (
                            <button
                                onClick={handleSaveCustom}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                Enregistrer mes choix
                            </button>
                        ) : (
                            <button
                                onClick={handleRejectAll}
                                className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Tout refuser
                            </button>
                        )}
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
                        >
                            Personnaliser
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
