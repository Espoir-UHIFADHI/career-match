import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../ui/Button";
import { QuickScan } from "../QuickScan";
import { trackCTAClicked, trackEvent } from "../../utils/analytics";
import { useAppStore } from "../../store/useAppStore";
import {
    ArrowRight, CheckCircle, ShieldCheck, Zap, FileText, Clock
} from "lucide-react";
import { CoachAvatar } from "../CoachAvatar";


const BENEFITS = [
    { icon: Zap, title: "Résultats en 30 secondes", desc: "Career Match analyse votre CV et l'offre d'emploi instantanément." },
    { icon: FileText, title: "CV optimisé téléchargeable", desc: "Recevez un CV reformaté et enrichi en mots-clés ciblés." },
    { icon: CheckCircle, title: "Score de compatibilité précis", desc: "Comprenez exactement pourquoi vous passez ou non les filtres." },
    { icon: ShieldCheck, title: "Données privées & sécurisées", desc: "Aucun CV stocké. Vous gardez le contrôle total." },
];

export function LandingPageAds() {
    const { isLoaded } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    // Capture les paramètres UTM dès l'arrivée et les pousse dans dataLayer
    // GTM les associe automatiquement à toutes les conversions de la session
    useEffect(() => {
        const utm = {
            utm_source: searchParams.get("utm_source"),
            utm_medium: searchParams.get("utm_medium"),
            utm_campaign: searchParams.get("utm_campaign"),
            utm_content: searchParams.get("utm_content"),
            utm_term: searchParams.get("utm_term"),
            gclid: searchParams.get("gclid"), // Google Click ID - critique pour le tracking Google Ads
        };
        const hasUtm = Object.values(utm).some(Boolean);
        if (hasUtm) {
            trackEvent("ads_landing_view", Object.fromEntries(
                Object.entries(utm).filter(([, v]) => v !== null) as [string, string][]
            ));
            // Persister en sessionStorage pour les conversions ultérieures
            sessionStorage.setItem("career_match_utm", JSON.stringify(utm));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCTAClick = () => {
        setIsLoading(true);
        trackCTAClicked("ads_hero", "start_free");
        setTimeout(() => setIsLoading(false), 3000);
    };

    const handleSignedInCTA = () => {
        trackCTAClicked("ads_hero", "go_to_app");
        useAppStore.getState().setStep(1);
        navigate("/app");
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900">
            <Helmet>
                <title>Optimiser son CV pour passer les filtres ATS - Career Match</title>
                <meta
                    name="description"
                    content="Votre CV est rejeté avant d'être lu ? Notre IA analyse votre CV face à l'offre d'emploi et vous donne un score ATS + un CV optimisé en 30 secondes. Essai gratuit."
                />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* ── Navbar minimale ── */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/career-match.png" alt="Career Match" className="h-8 w-8 object-contain" />
                        <span className="text-lg font-bold text-slate-900">Career Match</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            3 crédits offerts
                        </div>
                        <SignedOut>
                            <SignUpButton mode="modal">
                                <button
                                    onClick={() => trackCTAClicked("ads_nav", "sign_up")}
                                    className="h-8 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Commencer gratuit
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <button
                                onClick={() => { trackCTAClicked("ads_nav", "go_to_app"); useAppStore.getState().setStep(1); navigate("/app"); }}
                                className="h-8 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                Mon espace
                            </button>
                        </SignedIn>
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="bg-gradient-to-b from-slate-50 to-white pt-10 pb-6 px-4 sm:px-6 overflow-hidden">
                <div className="max-w-6xl mx-auto">


                    {/* Layout : texte à gauche, coach à droite - sur TOUS les écrans */}
                    <div className="flex items-end gap-4 sm:gap-8 lg:gap-12">

                        {/* Colonne gauche - contenu */}
                        <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4 sm:mb-6">
                                Votre CV passe-t-il<br />
                                <span className="text-indigo-600">
                                    les filtres ATS ?
                                </span>
                            </h1>

                            <p className="text-base sm:text-xl text-slate-600 leading-relaxed mb-4 sm:mb-5 max-w-xl">
                                Collez votre CV et l'offre d'emploi. <strong className="text-slate-800">Career Match</strong> calcule
                                votre score de compatibilité, identifie les mots-clés manquants et génère un{" "}
                                <strong className="text-slate-800">CV optimisé téléchargeable</strong> en 30 secondes.
                            </p>

                            {/* Badges fonctionnalités - masqués sur xs, visibles dès sm */}
                            <div className="hidden sm:flex flex-wrap gap-2 mb-6">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                                    Score ATS
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    Recruteurs clés
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    Email Finder
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                    30 s
                                </span>
                            </div>

                            {/* CTA principal */}
                            {isLoaded && (
                                <div className="flex flex-col items-stretch sm:items-start gap-3 mb-5 w-full sm:w-auto">
                                    <SignedOut>
                                        <SignUpButton mode="modal">
                                            <Button
                                                isLoading={isLoading}
                                                onClick={handleCTAClick}
                                                className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 font-bold"
                                            >
                                                <span className="flex items-center justify-center gap-2">
                                                    Obtenir mon score ATS gratuit
                                                    <ArrowRight className="w-5 h-5 shrink-0" />
                                                </span>
                                            </Button>
                                        </SignUpButton>
                                    </SignedOut>
                                    <SignedIn>
                                        <Button
                                            onClick={handleSignedInCTA}
                                            className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 font-bold"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                Analyser mon CV maintenant
                                                <ArrowRight className="w-5 h-5 shrink-0" />
                                            </span>
                                        </Button>
                                    </SignedIn>
                                </div>
                            )}

                            {/* Micro-commitments - 2 colonnes sur mobile */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-500">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> 3 crédits gratuits</span>
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> Sans CB</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> 30 secondes</span>
                                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> Données privées</span>
                            </div>
                        </div>

                        {/* Colonne droite - coach, taille contrôlée sur tous les écrans */}
                        <div className="flex-shrink-0 self-end">
                            <CoachAvatar />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Bénéfices ── */}
            <section className="py-20 px-6 bg-slate-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
                        Ce que vous obtenez en 30 secondes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {BENEFITS.map((b, i) => (
                            <div key={i} className="flex items-start gap-5 p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <b.icon className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base mb-2">{b.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── QuickScan interactif ── */}
            <section className="px-4 pb-4">
                <QuickScan />
            </section>


            {/* ── CTA final ── */}
            <section className="relative overflow-hidden bg-indigo-600 py-20 px-6">
                {/* Motif de fond subtil */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-40 pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-600 rounded-full blur-3xl opacity-30 pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                        Arrêtez d'envoyer des CVs<br />dans le vide.
                    </h2>
                    <p className="text-indigo-100 text-lg mb-10">
                        3 crédits gratuits. Aucune carte bancaire. Résultats en 30 secondes.
                    </p>

                    <SignedOut>
                        <SignUpButton mode="modal">
                            <Button
                                onClick={() => trackCTAClicked("ads_footer", "sign_up_free")}
                                className="h-14 px-10 text-base bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-2xl shadow-2xl shadow-indigo-900/30 transition-all hover:scale-105"
                            >
                                <span className="flex items-center gap-2">
                                    Commencer gratuitement
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            </Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Button
                            onClick={handleSignedInCTA}
                            className="h-14 px-10 text-base bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-2xl shadow-2xl shadow-indigo-900/30 transition-all hover:scale-105"
                        >
                            <span className="flex items-center gap-2">
                                Analyser mon CV maintenant
                                <ArrowRight className="w-5 h-5" />
                            </span>
                        </Button>
                    </SignedIn>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-indigo-200">
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-100" /> Toujours satisfait</span>
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-100" /> Données non conservées</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-100" /> Sans engagement</span>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-slate-950 px-6 py-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <img src="/career-match.png" alt="Career Match" className="h-5 w-5 object-contain opacity-50" />
                        <span>© 2025 Career Match</span>
                    </div>
                    <div className="flex items-center gap-5">
                        <a href="/privacy" className="hover:text-white transition-colors">Confidentialité</a>
                        <a href="/terms" className="hover:text-white transition-colors">CGU</a>
                        <a href="/contact" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
