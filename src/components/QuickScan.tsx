import { useState } from 'react';
import { Button } from './ui/Button';
import { SignUpButton } from '@clerk/clerk-react';
import { AlertTriangle, Loader2, ArrowRight, FileText, CheckCircle2, Lock } from 'lucide-react';

export function QuickScan() {
    const [text, setText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<{ score: number; issues: number } | null>(null);

    const handleAnalyze = () => {
        if (!text.trim()) return;
        setAnalyzing(true);

        // Simulation of analysis
        setTimeout(() => {
            // Random score between 35 and 55 for "scary" effect
            const randomScore = Math.floor(Math.random() * (55 - 35 + 1)) + 35;
            setResult({
                score: randomScore,
                issues: 3
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <section className="py-24 bg-slate-900 relative overflow-hidden scroll-mt-20 rounded-[2.5rem] mx-2 md:mx-4 my-8" id="quick-scan">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

            <div className="container mx-auto px-6 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                    <div className="text-left space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Test de lisibilité ATS gratuit</span>
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.15]">
                            Votre CV finit-il à la poubelle <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">avant d'être lu ?</span>
                        </h2>

                        <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                            Les recruteurs n'ont pas le temps. Ils utilisent des logiciels (ATS) pour filtrer 75% des candidats. Si votre formatage est mauvais, vous êtes invisible.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">Simulation ATS Réaliste</h4>
                                    <p className="text-slate-500 text-sm">Voyez exactement ce que le robot extrait de votre PDF.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">Diagnostic Immédiat</h4>
                                    <p className="text-slate-500 text-sm">Score de lisibilité et identification des sections bloquantes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20 relative mx-auto w-full max-w-xl border border-slate-100/10">
                        {/* Card Badge */}
                        <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 rotate-12 bg-yellow-400 text-yellow-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg hidden md:block">
                            BOOSTEZ VOS CHANCES
                        </div>

                        {!result ? (
                            <div className="space-y-6">
                                <div className="text-center md:text-left">
                                    <label className="block text-lg font-bold text-slate-900 mb-1">
                                        Faites le test maintenant
                                    </label>
                                    <p className="text-slate-500 text-sm">Collez le contenu de votre CV</p>
                                </div>

                                <textarea
                                    className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 shadow-inner font-mono leading-relaxed"
                                    placeholder="Ex: 
Jean Dupont
Développeur Fullstack
Expérience : 
- Tech Lead chez StartUp (2020-2024)..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />

                                <Button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || text.length < 50}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    {analyzing ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Analyse en cours...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5" />
                                            <span>Vérifier mon CV Gratuitement</span>
                                        </div>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <Lock className="w-3 h-3" />
                                    <span>Données privées & non conservées</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 animate-fade-in">
                                <div className="mb-8 relative inline-block">
                                    <div className="w-32 h-32 rounded-full bg-red-50 border-8 border-red-100 flex items-center justify-center mx-auto shadow-inner">
                                        <div className="text-center">
                                            <span className="block text-4xl font-extrabold text-red-600 tracking-tighter">{result.score}/100</span>
                                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Score ATS</span>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap border-2 border-white">
                                        RISQUE DE REJET
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Diagnostic : Critique</h3>
                                <p className="text-slate-600 text-sm mb-8 max-w-[300px] mx-auto leading-relaxed">
                                    Oups. Votre CV contient <strong className="text-red-600">{result.issues} erreurs fatales</strong> qui empêchent les robots de lire votre parcours. Vous êtes invisible.
                                </p>

                                <div className="space-y-3 bg-red-50 border border-red-100 rounded-xl p-5 mb-8 text-left shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1 bg-red-100 rounded-full">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                        </div>
                                        <div>
                                            <span className="block text-sm text-slate-900 font-semibold">Structure Illisible</span>
                                            <span className="text-xs text-slate-500">Les colonnes ou tableaux brisent la lecture.</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1 bg-red-100 rounded-full">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                        </div>
                                        <div>
                                            <span className="block text-sm text-slate-900 font-semibold">Mots-clés manquants</span>
                                            <span className="text-xs text-slate-500">Vocabulaire non aligné avec le marché.</span>
                                        </div>
                                    </div>
                                </div>

                                <SignUpButton mode="modal">
                                    <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-lg shadow-xl shadow-slate-900/20 animate-pulse transition-all hover:scale-[1.02] flex items-center justify-center gap-3">
                                        <span>Voir le rapport complet</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </SignUpButton>

                                <button
                                    onClick={() => { setResult(null); setText(''); }}
                                    className="mt-6 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                                >
                                    Refaire un test
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
