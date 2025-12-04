import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Download, Eye, Sparkles, TrendingUp, Target, Globe } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useAppStore } from "../../store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { matchAndOptimize } from "../../services/ai/gemini";
import { NetworkingSection } from "./NetworkingSection";
import { PrintableCV } from "./PrintableCV";
import type { MatchResult } from "../../types";

export function MatchingDashboard() {
    const { cvData, jobData, analysisResults, setAnalysisResults, language, setLanguage } = useAppStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Optimized_CV",
    });

    const prevLanguageRef = useRef(language);

    useEffect(() => {
        const hasLanguageChanged = prevLanguageRef.current !== language;
        const hasResults = !!analysisResults;

        if (cvData && jobData && !isProcessing) {
            // Only run if we don't have results yet, OR if the language has changed
            if (!hasResults || hasLanguageChanged) {
                runAnalysis();
            }
        }
        prevLanguageRef.current = language;
    }, [language, cvData, jobData]);

    const runAnalysis = async () => {
        if (!cvData || !jobData) return;
        setIsProcessing(true);
        setError(null);
        try {
            const results = await matchAndOptimize(cvData, jobData, language);
            setAnalysisResults(results as MatchResult);
            setShowPreview(true);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze match. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                    <Loader2 className="relative h-16 w-16 text-indigo-600 animate-spin mb-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Optimizing your profile...</h2>
                <p className="text-slate-600 mt-2 font-medium">Comparing your skills with job requirements</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center p-4 bg-red-50 rounded-full mb-6">
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <Button onClick={runAnalysis} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">Try Again</Button>
            </div>
        );
    }

    if (!analysisResults) return null;

    const { score, analysis, recommendations } = analysisResults;
    const isLowMatch = score < 45 || !analysisResults.optimizedCV;

    // Helper to determine score color
    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-emerald-600";
        if (s >= 60) return "text-indigo-600";
        if (s >= 45) return "text-amber-500";
        return "text-red-500";
    };

    const getScoreGradient = (s: number) => {
        if (s >= 80) return "from-emerald-500 to-teal-500";
        if (s >= 60) return "from-indigo-500 to-violet-500";
        if (s >= 45) return "from-amber-500 to-orange-500";
        return "from-red-500 to-pink-500";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {isLowMatch && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 p-6 rounded-xl shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-red-900">Low Match Score Detected ({score}%)</h3>
                            <p className="text-red-700 mt-1 leading-relaxed">
                                The match between your profile and this job description is too low to generate a valid optimized CV.
                                We do not generate fake information. Please review the missing keywords and recommendations below to improve your profile or apply to a more relevant position.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Card */}
                <Card className="lg:col-span-1 glass-panel bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getScoreGradient(score)}`} />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-center text-slate-900 flex items-center justify-center gap-2">
                            <Target className="h-5 w-5 text-slate-400" />
                            Match Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
                        <div className="relative flex items-center justify-center h-40 w-40">
                            {/* Background Circle */}
                            <svg className="h-full w-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="url(#score-gradient)"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    strokeDasharray={439.82}
                                    strokeDashoffset={439.82 - (439.82 * score) / 100}
                                    className="transition-all duration-1500 ease-out"
                                />
                                <defs>
                                    <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={score < 45 ? "#ef4444" : score < 60 ? "#f59e0b" : score < 80 ? "#6366f1" : "#10b981"} />
                                        <stop offset="100%" stopColor={score < 45 ? "#ec4899" : score < 60 ? "#f97316" : score < 80 ? "#8b5cf6" : "#14b8a6"} />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-5xl font-bold tracking-tighter ${getScoreColor(score)}`}>{score}%</span>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 ${getScoreColor(score)}`}>
                                {score >= 80 ? "Excellent Match" : score >= 60 ? "Good Potential" : score >= 45 ? "Needs Improvement" : "Critical Low Match"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Insights */}
                <Card className="lg:col-span-2 glass-panel bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/50">
                    <CardHeader className="border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            <CardTitle className="text-slate-900">Analysis Results</CardTitle>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            {isLowMatch
                                ? "Key factors affecting your match score."
                                : `Detailed breakdown of your ${score}% match score.`}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm uppercase tracking-wide">
                                    <div className="p-1 bg-emerald-100 rounded-md">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    Key Strengths
                                </h4>
                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Missing Keywords */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm uppercase tracking-wide">
                                    <div className="p-1 bg-red-100 rounded-md">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                    Missing Keywords
                                </h4>
                                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50">
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missingKeywords.map((k, i) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-red-700 border border-red-200 shadow-sm">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Culture Fit */}
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">
                                <Globe className="h-4 w-4 text-indigo-500" />
                                Culture Fit Assessment
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-600 leading-relaxed">
                                {analysis.cultureFit}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="glass-panel bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-slate-900">Strategic Recommendations</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="group flex gap-4 items-start p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                        <span className="text-amber-600 font-bold text-sm">{i + 1}</span>
                                    </div>
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed pt-1">{rec}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <NetworkingSection />

            {/* Action Bar */}
            <div className="sticky bottom-6 z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 glass-panel bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <Globe className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">CV Language</span>
                        </div>
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setLanguage("French")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${language === "French"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Français
                            </button>
                            <button
                                onClick={() => setLanguage("English")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${language === "English"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={runAnalysis}
                            className="w-full sm:w-auto gap-2 hover:bg-slate-50 text-slate-700 border-slate-200"
                        >
                            <Loader2 className="h-4 w-4" />
                            Regenerate
                        </Button>

                        {!isLowMatch && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`w-full sm:w-auto gap-2 border-slate-200 ${showPreview ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "hover:bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    <Eye className="h-4 w-4" />
                                    {showPreview ? "Hide Preview" : "Preview CV"}
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={() => handlePrint()}
                                    className="w-full sm:w-auto gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 border-0"
                                >
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {
                showPreview && !isLowMatch && analysisResults.optimizedCV && (
                    <Card className="mt-8 glass-panel bg-white border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-row items-center justify-between">
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                Optimized CV Preview
                            </CardTitle>
                            <Button size="sm" variant="ghost" onClick={() => setShowPreview(false)}>
                                Close Preview
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 bg-slate-100/50 overflow-x-auto">
                            <div className="min-w-[800px] p-8 flex justify-center">
                                <div className="shadow-2xl bg-white">
                                    <PrintableCV data={analysisResults.optimizedCV} language={language} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Hidden Printable Component */}
            {!isLowMatch && analysisResults.optimizedCV && (
                <div className="hidden">
                    <PrintableCV ref={printRef} data={analysisResults.optimizedCV} language={language} />
                </div>
            )}
        </div>
    );
}

