import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../ui/Button";
import { QuickScan } from "../QuickScan";
import { trackCTAClicked, trackEvent } from "../../utils/analytics";
import { useAppStore } from "../../store/useAppStore";
import {
    ArrowRight, CheckCircle, ShieldCheck, Zap, FileText,
    AlertTriangle, Clock
} from "lucide-react";

const WHY_IT_WORKS = [
    {
        stat: "75%",
        label: "des CVs filtrés avant lecture humaine",
        desc: "Source : Jobscan, 2023. La plupart des candidatures n'atteignent jamais un recruteur.",
    },
    {
        stat: "< 5 min",
        label: "pour obtenir votre CV optimisé",
        desc: "Uploadez votre CV, collez l'offre, téléchargez le résultat.",
    },
    {
        stat: "4.99€",
        label: "pour commencer après les 7 crédits gratuits",
        desc: "Pas d'abonnement. Vous payez uniquement ce que vous utilisez.",
    },
];

const BENEFITS = [
    { icon: Zap, title: "Résultats en 30 secondes", desc: "L'IA analyse votre CV et l'offre d'emploi instantanément." },
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
            gclid: searchParams.get("gclid"), // Google Click ID — critique pour le tracking Google Ads
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
                <title>Optimiser son CV pour passer les filtres ATS — Career Match</title>
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
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        7 crédits offerts à l'inscription
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="bg-gradient-to-b from-slate-50 to-white pt-16 pb-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Urgency badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full text-red-700 text-sm font-semibold mb-8">
                        <AlertTriangle className="w-4 h-4" />
                        75% des CVs sont filtrés par un robot avant d'atteindre un humain
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                        Votre CV passe-t-il<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            les filtres ATS ?
                        </span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
                        Collez votre CV et l'offre d'emploi. Notre IA calcule votre score de compatibilité,
                        identifie les mots-clés manquants et génère un <strong>CV optimisé téléchargeable</strong> en 30 secondes.
                    </p>

                    {/* CTA principal */}
                    {isLoaded && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <Button
                                        isLoading={isLoading}
                                        onClick={handleCTAClick}
                                        className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 font-bold"
                                    >
                                        <span className="flex items-center gap-2">
                                            Obtenir mon score ATS gratuit
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                    </Button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button
                                        onClick={() => trackCTAClicked("ads_hero", "sign_up")}
                                        className="text-sm text-slate-500 underline underline-offset-2 hover:text-indigo-600 transition-colors"
                                    >
                                        Créer un compte gratuit
                                    </button>
                                </SignUpButton>
                            </SignedOut>
                            <SignedIn>
                                <Button
                                    onClick={handleSignedInCTA}
                                    className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 font-bold"
                                >
                                    <span className="flex items-center gap-2">
                                        Analyser mon CV maintenant
                                        <ArrowRight className="w-5 h-5" />
                                    </span>
                                </Button>
                            </SignedIn>
                        </div>
                    )}

                    {/* Micro-commitments */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Gratuit — 7 crédits offerts</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sans carte bancaire</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-500" /> Résultats en 30 secondes</span>
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Données non conservées</span>
                    </div>
                </div>
            </section>

            {/* ── QuickScan interactif ── */}
            <section className="px-4 pb-4">
                <QuickScan />
            </section>

            {/* ── Bénéfices ── */}
            <section className="py-20 px-6 bg-slate-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
                        Ce que vous obtenez en 30 secondes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {BENEFITS.map((b, i) => (
                            <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <b.icon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">{b.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pourquoi ça marche ── */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
                        Ce que vous devez savoir
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {WHY_IT_WORKS.map((item, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm flex flex-col gap-3">
                                <div className="text-4xl font-extrabold text-indigo-600">{item.stat}</div>
                                <p className="text-base font-bold text-slate-900">{item.label}</p>
                                <p className="text-sm text-slate-500 leading-relaxed flex-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA final ── */}
            <section className="py-20 px-6 bg-slate-900 text-white">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Arrêtez d'envoyer des CVs dans le vide
                    </h2>
                    <p className="text-slate-400 mb-8 text-lg">
                        7 crédits gratuits. Aucune carte bancaire. Résultats immédiats.
                    </p>
                    <SignedOut>
                        <SignUpButton mode="modal">
                            <Button
                                onClick={() => trackCTAClicked("ads_footer", "sign_up_free")}
                                className="h-14 px-10 text-lg bg-indigo-500 hover:bg-indigo-400 text-white shadow-xl shadow-indigo-500/30 rounded-2xl font-bold transition-all hover:scale-105"
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
                            className="h-14 px-10 text-lg bg-indigo-500 hover:bg-indigo-400 text-white shadow-xl rounded-2xl font-bold transition-all hover:scale-105"
                        >
                            <span className="flex items-center gap-2">
                                Analyser mon CV maintenant
                                <ArrowRight className="w-5 h-5" />
                            </span>
                        </Button>
                    </SignedIn>
                    <p className="mt-4 text-xs text-slate-500">
                        Satisfait ou remboursé sous 7 jours sur tous les plans payants
                    </p>
                </div>
            </section>

            {/* ── Footer minimal ── */}
            <footer className="bg-slate-950 text-slate-500 text-xs py-6 px-6 text-center">
                <p>© 2025 Career Match — <a href="/privacy" className="hover:text-white transition-colors">Confidentialité</a> · <a href="/terms" className="hover:text-white transition-colors">CGU</a></p>
            </footer>
        </div>
    );
}
