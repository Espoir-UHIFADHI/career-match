import { useState } from 'react';
import { Button } from './ui/Button';
import { SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, FileText, CheckCircle2, Lock, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { trackQuickScanStarted, trackQuickScanCompleted, trackCTAClicked } from '../utils/analytics';
import { useAppStore } from '../store/useAppStore';

interface Issue {
    type: 'critical' | 'warning';
    title: string;
    detail: string;
}

interface ScanResult {
    score: number;
    issues: Issue[];
    sectionsFound: string[];
    wordCount: number;
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getScoreStyle(score: number) {
    if (score >= 75) return { label: 'Bon', color: 'text-emerald-500', ring: 'stroke-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 55) return { label: 'Moyen', color: 'text-amber-500', ring: 'stroke-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { label: 'Critique', color: 'text-red-500', ring: 'stroke-red-500', bg: 'bg-red-50', border: 'border-red-200' };
}

export function QuickScan() {
    const [text, setText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const navigate = useNavigate();

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const isReady = text.length >= 50;

    const handleAnalyze = async () => {
        if (!isReady) return;
        setAnalyzing(true);
        setApiError(null);
        trackQuickScanStarted();
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-cv-quick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error();
            const data: ScanResult = await response.json();
            setResult(data);
            trackQuickScanCompleted(data.score);
        } catch {
            setApiError("Service temporairement indisponible. Réessayez dans quelques secondes.");
        } finally {
            setAnalyzing(false);
        }
    };

    const scoreStyle = result ? getScoreStyle(result.score) : null;
    const criticalIssues = result?.issues.filter(i => i.type === 'critical') ?? [];
    const warningIssues = result?.issues.filter(i => i.type === 'warning') ?? [];
    const totalIssues = criticalIssues.length + warningIssues.length;

    // Score ring SVG
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = result ? (result.score / 100) * circumference : 0;

    return (
        <section className="py-20 bg-slate-900 relative overflow-hidden rounded-[2.5rem] mx-2 md:mx-4 my-8" id="quick-scan">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[80px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* ── Colonne gauche ── */}
                    <div className="space-y-10">
                        {/* Titre */}
                        <div>
                            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">Test ATS gratuit</p>
                            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1]">
                                Votre CV est-il<br />
                                <span className="text-indigo-400">invisible aux recruteurs ?</span>
                            </h2>
                        </div>

                        {/* Stats - 3 chiffres forts */}
                        <div className="grid grid-cols-3 gap-0 divide-x divide-slate-700/60">
                            <div className="pr-6">
                                <p className="text-4xl font-black text-white">75%</p>
                                <p className="text-slate-400 text-xs mt-1.5 leading-snug">des CVs filtrés<br />avant un humain</p>
                            </div>
                            <div className="px-6">
                                <p className="text-4xl font-black text-white">6 s</p>
                                <p className="text-slate-400 text-xs mt-1.5 leading-snug">temps moyen<br />de lecture d'un CV</p>
                            </div>
                            <div className="pl-6">
                                <p className="text-4xl font-black text-white">3×</p>
                                <p className="text-slate-400 text-xs mt-1.5 leading-snug">plus de réponses<br />avec un CV optimisé</p>
                            </div>
                        </div>

                        {/* Témoignage */}
                        <div className="relative pl-5 border-l-2 border-indigo-500/60">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                "J'envoyais des CVs depuis 3 mois sans réponse. Après l'analyse, j'ai compris pourquoi - mon email n'était même pas détecté par l'ATS."
                            </p>
                            <div className="mt-3 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-500/25 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">S</div>
                                <div>
                                    <p className="text-white text-xs font-semibold">Sarah M.</p>
                                    <p className="text-slate-500 text-xs">Reconvertie en UX Design</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Colonne droite - carte ── */}
                    <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">

                        {!result ? (
                            <>
                                {/* Badge */}
                                <div className="absolute top-4 right-4 rotate-2 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md tracking-wide z-10">
                                    BOOSTEZ VOS CHANCES
                                </div>

                                {/* Header carte */}
                                <div className="px-7 pt-7 pb-5 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900">Testez votre CV maintenant</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">Collez le texte de votre CV ci-dessous</p>
                                </div>

                                <div className="px-7 py-6 space-y-4">
                                    {/* Textarea */}
                                    <div className="relative">
                                        <textarea
                                            className={`w-full h-44 p-4 rounded-xl text-sm outline-none resize-none transition-all font-mono leading-relaxed placeholder:text-slate-300
                                                ${!isReady && text.length > 0
                                                    ? 'bg-amber-50 border border-amber-200 focus:ring-2 focus:ring-amber-300'
                                                    : isReady
                                                        ? 'bg-emerald-50/50 border border-emerald-200 focus:ring-2 focus:ring-emerald-300'
                                                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-300'
                                                }`}
                                            placeholder={"Jean Dupont\njean.dupont@email.com\n+33 6 12 34 56 78\n\nExpérience :\n- Poste chez Entreprise (2021-2024)\n\nCompétences : ..."}
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                        />
                                        {/* Badges état */}
                                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                            {text.length > 0 && !isReady && (
                                                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                    Trop court
                                                </span>
                                            )}
                                            {isReady && (
                                                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Prêt
                                                </span>
                                            )}
                                            {text.length > 0 && (
                                                <span className="text-[10px] text-slate-400 tabular-nums">{wordCount} mots</span>
                                            )}
                                        </div>
                                    </div>

                                    {apiError && (
                                        <p className="text-red-500 text-xs flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {apiError}
                                        </p>
                                    )}

                                    {/* CTA */}
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={analyzing || !isReady}
                                        className={`w-full py-3.5 font-bold rounded-xl text-sm transition-all
                                            ${isReady
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99]'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {analyzing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analyse en cours…
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                {isReady ? 'Analyser mon CV' : 'Collez votre CV pour commencer'}
                                            </span>
                                        )}
                                    </Button>

                                    <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                                        <Lock className="w-3 h-3" />
                                        Données non conservées · Résultat en 5 secondes
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Header résultat */}
                                <div className={`px-7 pt-7 pb-6 ${scoreStyle!.bg} border-b ${scoreStyle!.border}`}>
                                    <div className="flex items-center gap-5">
                                        {/* Score ring SVG */}
                                        <div className="relative shrink-0">
                                            <svg width="80" height="80" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                                <circle
                                                    cx="50" cy="50" r={radius} fill="none"
                                                    className={scoreStyle!.ring}
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={circumference - progress}
                                                    transform="rotate(-90 50 50)"
                                                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-black ${scoreStyle!.color} leading-none`}>{result.score}</span>
                                                <span className="text-[9px] text-slate-400 font-bold">/100</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Score ATS</p>
                                            <p className={`text-2xl font-extrabold ${scoreStyle!.color} mt-0.5`}>
                                                {scoreStyle!.label}
                                            </p>
                                            <p className="text-slate-600 text-sm mt-1">
                                                {totalIssues > 0
                                                    ? <><strong>{totalIssues} problème{totalIssues > 1 ? 's' : ''}</strong> identifié{totalIssues > 1 ? 's' : ''}</>
                                                    : <span className="text-emerald-600 font-medium">Aucun problème bloquant</span>
                                                }
                                                {result.wordCount > 0 && <span className="text-slate-400"> · {result.wordCount} mots</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Issues */}
                                <div className="px-7 py-5 space-y-2.5 max-h-52 overflow-y-auto">
                                    {criticalIssues.map((issue, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-slate-900 font-semibold">{issue.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{issue.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {warningIssues.map((issue, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-slate-900 font-semibold">{issue.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{issue.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {totalIssues === 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <p className="text-sm text-slate-700 font-medium">Structure ATS correcte. Optimisez vos mots-clés pour aller plus loin.</p>
                                        </div>
                                    )}
                                </div>

                                {/* CTA résultat */}
                                <div className="px-7 pb-7 space-y-3">
                                    <SignedIn>
                                        <Button
                                            onClick={() => {
                                                trackCTAClicked('quickscan_result', 'go_to_app');
                                                useAppStore.getState().setStep(1);
                                                navigate('/app');
                                            }}
                                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                                        >
                                            Optimiser mon CV maintenant
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </SignedIn>
                                    <SignedOut>
                                        <SignUpButton mode="modal">
                                            <Button className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2">
                                                Obtenir l'analyse complète + CV optimisé
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </SignUpButton>
                                    </SignedOut>
                                    <button
                                        onClick={() => { setResult(null); setText(''); }}
                                        className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
                                    >
                                        Refaire un test
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
