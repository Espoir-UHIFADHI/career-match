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

import { useTranslation } from "../../hooks/useTranslation";

export function MatchingDashboard() {
    const { t } = useTranslation();
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
            <div className="flex flex-col items-center justify-center py-24">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-white p-4 rounded-full shadow-sm border border-slate-100">
                        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('dashboard.optimizing')}</h2>
                <p className="text-slate-500 mt-2 font-medium">{t('dashboard.optimizingDesc')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-24">
                <div className="inline-flex items-center justify-center p-4 bg-red-50 rounded-full mb-6 border border-red-100">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{t('dashboard.analysisFailed')}</h2>
                <p className="text-slate-500 mb-6">{error || t('dashboard.analysisError')}</p>
                <Button onClick={runAnalysis} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">{t('dashboard.tryAgain')}</Button>
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
        if (s >= 45) return "text-amber-600";
        return "text-red-600";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-32">
            {isLowMatch && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg border border-red-100 shadow-sm">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-900">{t('dashboard.lowMatch')} ({score}%)</h3>
                            <p className="text-red-700 mt-1 leading-relaxed text-sm">
                                {t('dashboard.lowMatchDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Card */}
                <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-center text-slate-900 flex items-center justify-center gap-2">
                            <Target className="h-5 w-5 text-slate-400" />
                            {t('dashboard.matchScore')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
                        <div className="relative flex items-center justify-center h-48 w-48">
                            {/* Background Circle */}
                            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 192 192">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="80"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="80"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    strokeDasharray={502.65}
                                    strokeDashoffset={502.65 - (502.65 * score) / 100}
                                    className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-6xl font-bold tracking-tighter ${getScoreColor(score)}`}>{score}%</span>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                score >= 60 ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                    score >= 45 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                        "bg-red-50 text-red-700 border-red-100"
                                }`}>
                                {score >= 80 ? t('dashboard.excellentMatch') : score >= 60 ? t('dashboard.goodPotential') : score >= 45 ? t('dashboard.needsImprovement') : t('dashboard.criticalMatch')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Insights */}
                <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-slate-900">{t('dashboard.analysisResults')}</CardTitle>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            {isLowMatch
                                ? t('dashboard.keyFactors')
                                : t('dashboard.scoreBreakdown').replace('{score}', score.toString())}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Strengths */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm uppercase tracking-wide">
                                    <div className="p-1 bg-emerald-100 rounded-md">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    {t('dashboard.strengths')}
                                </h4>
                                <div className="bg-emerald-50/30 rounded-xl p-5 border border-emerald-100/50">
                                    <ul className="space-y-3">
                                        {analysis.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Missing Keywords */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm uppercase tracking-wide">
                                    <div className="p-1 bg-red-100 rounded-md">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                    {t('dashboard.missingKeywords')}
                                </h4>
                                <div className="bg-red-50/30 rounded-xl p-5 border border-red-100/50">
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missingKeywords.map((k, i) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-white text-red-700 border border-red-200 shadow-sm">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Culture Fit */}
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">
                                <Globe className="h-4 w-4 text-indigo-600" />
                                {t('dashboard.cultureFit')}
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-sm text-slate-600 leading-relaxed">
                                {analysis.cultureFit}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-slate-900">{t('dashboard.recommendations')}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="group flex gap-4 items-start p-5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors shadow-sm">
                                        <span className="text-slate-600 group-hover:text-indigo-600 font-bold text-sm">{i + 1}</span>
                                    </div>
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed pt-1.5">{rec}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <NetworkingSection />

            {/* Action Bar */}
            <div className="sticky bottom-6 z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50">
                    {!isLowMatch && (
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <Globe className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">{t('dashboard.cvLanguage')}</span>
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
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={runAnalysis}
                            className="w-full sm:w-auto gap-2 hover:bg-slate-50 text-slate-700 border-slate-200"
                        >
                            <Loader2 className="h-4 w-4" />
                            {t('dashboard.regenerate')}
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
                                    {showPreview ? t('dashboard.hidePreview') : t('dashboard.previewCV')}
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={() => handlePrint()}
                                    className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 border-0"
                                >
                                    <Download className="h-4 w-4" />
                                    {t('dashboard.downloadPDF')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showPreview && !isLowMatch && analysisResults.optimizedCV && (
                <Card className="mt-8 bg-white border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                    <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            {t('dashboard.optimizedPreview')}
                        </CardTitle>
                        <Button size="sm" variant="ghost" onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-slate-900">
                            {t('dashboard.closePreview')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 bg-slate-100 overflow-x-auto">
                        <div className="min-w-[800px] p-8 flex justify-center">
                            <div className="shadow-2xl bg-white">
                                {analysisResults?.optimizedCV && <PrintableCV data={analysisResults.optimizedCV} language={language} />}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hidden Printable Component */}
            {!isLowMatch && analysisResults.optimizedCV && (
                <div className="hidden">
                    <PrintableCV ref={printRef} data={analysisResults.optimizedCV} language={language} />
                </div>
            )}
        </div>
    );
}
