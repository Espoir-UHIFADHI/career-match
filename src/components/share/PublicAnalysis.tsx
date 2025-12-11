
import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Button } from "../ui/Button"; // Adjusted path
import { ArrowRight, Sparkles, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { PrintableCV } from "../results/PrintableCV";

// Initialize Supabase Client for Public Read
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export function PublicAnalysis() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            const { data, error } = await supabase
                .from('public_analyses')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error("Error fetching analysis:", error);
                setError(true);
            } else {
                setData(data.content);
            }
            setLoading(false);
        }
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Analyse introuvable</h1>
                <p className="text-slate-600 mb-6">Ce lien semble avoir expiré ou est invalide.</p>
                <Link to="/">
                    <Button>Retour à l'accueil</Button>
                </Link>
            </div>
        );
    }

    // REVIEW MODE: Display CV if mode is 'cv' and CV exists
    if (mode === 'cv' && data.optimizedCV) {
        return (
            <>
                <Helmet>
                    <title>CV Optimisé | Career Match</title>
                    <meta name="description" content="Découvrez le CV optimisé par Career Match AI." />
                </Helmet>

                <div className="min-h-screen bg-slate-100 py-12 px-4">
                    {/* Floating Header */}
                    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur shadow-lg rounded-full px-6 py-2 flex items-center gap-4 border border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">CM</div>
                            <span className="font-bold text-slate-800 text-sm">CV Optimisé</span>
                        </div>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <Link to="/app">
                            <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full text-xs h-8">
                                <Sparkles className="w-3 h-3 mr-1.5" />
                                Créer mon CV
                            </Button>
                        </Link>
                    </div>

                    <div className="max-w-[210mm] mx-auto mt-12 mb-12 shadow-2xl rounded-sm overflow-hidden bg-white">
                        <PrintableCV data={data.optimizedCV} language={data.analysisLanguage || "French"} />
                    </div>
                </div>
            </>
        );
    }

    // Verify data structure (MatchResult)
    const score = data.score || 0;
    const strengths = data.analysis?.strengths || [];
    const weaknesses = data.analysis?.weaknesses || [];
    const improvements = data.analysis?.missingKeywords?.length > 0
        ? data.analysis.missingKeywords
        : (data.analysis?.weaknesses || []);

    return (
        <>
            <Helmet>
                <title>Analyse de CV Partagée | Career Match</title>
                <meta name="description" content="Découvrez cette analyse de CV générée par Career Match AI." />
            </Helmet>

            <div className="min-h-screen bg-slate-50">

                <div className="container mx-auto px-4 py-12 max-w-6xl">
                    {/* Score Card */}
                    <div className="bg-white rounded-3xl p-10 shadow-xl shadow-indigo-100 mb-12 text-center relative overflow-hidden border border-slate-100">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                        <p className="text-xl font-bold text-slate-800 uppercase tracking-widest mb-8">Career Match Results</p>

                        <div className="relative inline-flex items-center justify-center mb-6">
                            {/* SVG Circular Progress */}
                            <svg className="h-48 w-48 transform -rotate-90" viewBox="0 0 192 192">
                                <circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="80"
                                    stroke={score >= 80 ? "#10b981" : score >= 60 ? "#4f46e5" : score >= 45 ? "#d97706" : "#dc2626"}
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    strokeDasharray={502.65}
                                    strokeDashoffset={502.65 - (502.65 * score) / 100}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text - 6xl font - black tracking - tighter ${score >= 80 ? "text-emerald-600" :
                                        score >= 60 ? "text-indigo-600" :
                                            score >= 45 ? "text-amber-600" : "text-red-600"
                                    } `}>
                                    {score}%
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-medium text-sm shadow-md">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                Généré par Career Match
                            </div>
                        </div>
                    </div>

                    {/* Analysis Details (Rich View) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-3xl p-8 shadow-lg shadow-indigo-100 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <CheckCircle className="text-emerald-600 w-5 h-5" />
                                </div>
                                Points Forts
                            </h3>
                            <ul className="space-y-4">
                                {strengths.map((s: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                        <span className="text-sm font-medium leading-relaxed">{s}</span>
                                    </li>
                                )) || <p className="text-slate-400 italic">Aucune donnée disponible.</p>}
                            </ul>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-lg shadow-indigo-100 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <AlertTriangle className="text-amber-600 w-5 h-5" />
                                </div>
                                Axes d'amélioration
                            </h3>
                            <ul className="space-y-4">
                                {improvements.map((s: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-transparent hover:border-amber-100 transition-colors">
                                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5 shrink-0 text-amber-600 font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium leading-relaxed">{s}</span>
                                    </li>
                                )) || <p className="text-slate-400 italic">Aucune donnée disponible.</p>}
                            </ul>
                        </div>
                    </div>

                    {/* Large Footer CTA */}
                    <div className="mt-20 text-center relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/50 to-indigo-50/20 -z-10 rounded-full blur-3xl transform scale-150" />
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            Et vous, quel est votre score ?
                        </h2>
                        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Ne laissez pas passer votre job de rêve. Comparez votre CV aux meilleures offres du marché et obtenez une version optimisée instantanément.
                        </p>
                        <Link to="/app">
                            <Button className="h-16 px-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                                Analyser mon profil maintenant
                                <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </>
    );
}
