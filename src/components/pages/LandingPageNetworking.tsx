import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../ui/Button";
import { trackCTAClicked, trackEvent } from "../../utils/analytics";
import { useAppStore } from "../../store/useAppStore";
import {
    ArrowRight, CheckCircle, ShieldCheck, Users, Search,
    Clock, MapPin, Briefcase, Building2, Star
} from "lucide-react";
import { CoachAvatar } from "../CoachAvatar";

const BENEFITS = [
    {
        icon: Building2,
        title: "Identifiez les bons contacts",
        desc: "Recruteurs, managers, directeurs techniques — Career Match trouve les personnes clés dans votre entreprise cible.",
    },
    {
        icon: Users,
        title: "Bypass les portails RH anonymes",
        desc: "Contournez les formulaires sans réponse. Contactez directement ceux qui décident.",
    },
    {
        icon: Search,
        title: "Recherche par rôle et localisation",
        desc: "Filtrez par poste (Recruteur, DRH, Tech Lead) et par ville. Résultats ciblés en quelques secondes.",
    },
    {
        icon: Star,
        title: "Sauvegardez vos contacts",
        desc: "Gardez une liste de vos contacts suivis, accessible à tout moment, quelle que soit l'entreprise recherchée.",
    },
];

function NetworkingDemo() {
    return (
        <section className="py-20 bg-slate-900 relative overflow-hidden rounded-[2.5rem] mx-2 md:mx-4 my-8" id="networking-demo">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[80px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* ── Colonne gauche ── */}
                    <div className="space-y-10">
                        <div>
                            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">Réseautage intelligent</p>
                            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1]">
                                Trouvez qui contacter<br />
                                <span className="text-indigo-400">dans n'importe quelle entreprise</span>
                            </h2>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-0 divide-x divide-slate-700/60">
                            <div className="pr-6">
                                <p className="text-4xl font-black text-white">80%</p>
                                <p className="text-slate-400 text-xs mt-1.5 leading-snug">des postes pourvus<br />par réseau</p>
                            </div>
                            <div className="px-6">
                                <p className="text-4xl font-black text-white">3×</p>
                                <p className="text-slate-400 text-xs mt-1.5 leading-snug">plus de réponses<br />par contact direct</p>
                            </div>
                            <div className="pl-6">
                                <p className="text-4xl font-black text-white">30 s</p>
                                <p className="text-slate-400 text-xs mt-1.5 leading-snug">pour trouver<br />les bons contacts</p>
                            </div>
                        </div>

                        {/* Témoignage */}
                        <div className="relative pl-5 border-l-2 border-indigo-500/60">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                "J'ai trouvé le responsable recrutement chez Capgemini en quelques secondes. Je l'ai contacté directement — il m'a répondu en 24h alors que ma candidature en ligne n'avait eu aucun retour."
                            </p>
                            <div className="mt-3 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-500/25 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">T</div>
                                <div>
                                    <p className="text-white text-xs font-semibold">Thomas M.</p>
                                    <p className="text-slate-500 text-xs">Développeur Fullstack — Bordeaux</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Colonne droite - démo Networking ── */}
                    <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">

                        <div className="absolute translate-x-2 -translate-y-2 rotate-2 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md tracking-wide z-10 hidden md:block">
                            CONTACTEZ DIRECT
                        </div>

                        {/* Header */}
                        <div className="px-7 pt-7 pb-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Critères de Recherche</h3>
                            <p className="text-slate-400 text-sm mt-0.5">Trouvez les contacts clés dans votre entreprise cible</p>
                        </div>

                        <div className="px-7 py-6 space-y-4">
                            {/* Entreprise */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Entreprise Cible</label>
                                <div className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center gap-3 text-slate-400 text-sm">
                                    <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
                                    Capgemini
                                </div>
                            </div>

                            {/* Rôle */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Rôle Cible / Mot-clé</label>
                                <div className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center gap-3 text-slate-400 text-sm">
                                    <Briefcase className="w-4 h-4 shrink-0 text-slate-400" />
                                    Recruteur, Directeur Technique
                                </div>
                            </div>

                            {/* Localisation */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Localisation</label>
                                <div className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center gap-3 text-slate-400 text-sm">
                                    <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                                    Paris, Télétravail
                                </div>
                            </div>

                            {/* Résultats simulés */}
                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Contacts trouvés</p>
                                {[
                                    { initials: "ML", name: "Marie Laurent", role: "Responsable Recrutement", tag: "Recruteur" },
                                    { initials: "PD", name: "Pierre Dubois", role: "Directeur Technique", tag: "Manager" },
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">{c.initials}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{c.role}</p>
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">{c.tag}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Données non conservées · 1 crédit par recherche
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function LandingPageNetworking() {
    const { isLoaded } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const utm = {
            utm_source:   searchParams.get("utm_source"),
            utm_medium:   searchParams.get("utm_medium"),
            utm_campaign: searchParams.get("utm_campaign"),
            utm_content:  searchParams.get("utm_content"),
            utm_term:     searchParams.get("utm_term"),
            gclid:        searchParams.get("gclid"),
        };
        const hasUtm = Object.values(utm).some(Boolean);
        if (hasUtm) {
            trackEvent("ads_landing_view", Object.fromEntries(
                Object.entries(utm).filter(([, v]) => v !== null) as [string, string][]
            ));
            sessionStorage.setItem("career_match_utm", JSON.stringify(utm));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCTAClick = () => {
        setIsLoading(true);
        trackCTAClicked("networking_hero", "start_free");
        setTimeout(() => setIsLoading(false), 3000);
    };

    const handleSignedInCTA = () => {
        trackCTAClicked("networking_hero", "go_to_networking");
        useAppStore.getState().setStep(5); // NetworkingSearch = step 5
        navigate("/app");
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900">
            <Helmet>
                <title>Trouvez les bons contacts dans n'importe quelle entreprise — Career Match</title>
                <meta
                    name="description"
                    content="Identifiez recruteurs, managers et DRH dans votre entreprise cible. Career Match trouve les contacts clés en 30 secondes. 3 crédits gratuits, sans carte bancaire."
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
                                    onClick={() => trackCTAClicked("networking_nav", "sign_up")}
                                    className="h-8 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Commencer gratuit
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <button
                                onClick={() => { trackCTAClicked("networking_nav", "go_to_app"); useAppStore.getState().setStep(5); navigate("/app"); }}
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
                    <div className="flex items-end gap-4 sm:gap-8 lg:gap-12">

                        {/* Colonne gauche */}
                        <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4 sm:mb-6">
                                Trouvez qui contacter<br />
                                <span className="text-indigo-600">
                                    dans n'importe quelle entreprise
                                </span>
                            </h1>

                            <p className="text-base sm:text-xl text-slate-600 leading-relaxed mb-4 sm:mb-5 max-w-xl">
                                Entrez l'entreprise et le rôle recherché. <strong className="text-slate-800">Career Match</strong> identifie
                                les recruteurs, managers et décisionnaires clés — et vous aide à{" "}
                                <strong className="text-slate-800">les contacter directement</strong> sans passer par les portails RH.
                            </p>

                            {/* Badges */}
                            <div className="hidden sm:flex flex-wrap gap-2 mb-6">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    Recruteurs clés
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                    Par entreprise & rôle
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                                    Contacts sauvegardés
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
                                                    Trouver mes contacts gratuitement
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
                                                Accéder au Networking
                                                <ArrowRight className="w-5 h-5 shrink-0" />
                                            </span>
                                        </Button>
                                    </SignedIn>
                                </div>
                            )}

                            {/* Micro-commitments */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-500">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> 3 crédits gratuits</span>
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> Sans CB</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> 30 secondes</span>
                                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> Données privées</span>
                            </div>
                        </div>

                        {/* Colonne droite - coach */}
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
                        Pourquoi le contact direct change tout
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

            {/* ── Démo Networking interactive ── */}
            <section className="px-4 pb-4">
                <NetworkingDemo />
            </section>

            {/* ── CTA final ── */}
            <section className="relative overflow-hidden bg-indigo-600 py-20 px-6">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-40 pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-600 rounded-full blur-3xl opacity-30 pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                        Arrêtez de postuler<br />dans le vide.
                    </h2>
                    <p className="text-indigo-100 text-lg mb-10">
                        3 crédits gratuits. Aucune carte bancaire. Contacts trouvés en 30 secondes.
                    </p>

                    <SignedOut>
                        <SignUpButton mode="modal">
                            <Button
                                onClick={() => trackCTAClicked("networking_footer", "sign_up_free")}
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
                                Accéder au Networking
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
