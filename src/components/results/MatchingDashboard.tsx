import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Download, Eye } from "lucide-react";
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

    useEffect(() => {
        if (cvData && jobData && !isProcessing) {
            runAnalysis();
        }
    }, [language]);

    const runAnalysis = async () => {
        if (!cvData || !jobData) return;
        setIsProcessing(true);
        setError(null);
        try {
            const results = await matchAndOptimize(cvData, jobData, language);
            setAnalysisResults(results as MatchResult);
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
                <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-6" />
                <h2 className="text-2xl font-bold text-slate-900">Optimizing your profile...</h2>
                <p className="text-slate-600 mt-2">Comparing your skills with job requirements</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <Button onClick={runAnalysis}>Try Again</Button>
            </div>
        );
    }

    if (!analysisResults) return null;

    const { score, analysis, recommendations } = analysisResults;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <Card className="md:col-span-1 glass-panel bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-center text-slate-900">Match Score</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-2">
                        <div className="relative flex items-center justify-center h-32 w-32">
                            <svg className="h-full w-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={351.86}
                                    strokeDashoffset={351.86 - (351.86 * score) / 100}
                                    className="text-indigo-600 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <span className="absolute text-4xl font-bold text-slate-900">{score}%</span>
                        </div>
                        <p className="mt-4 text-center text-sm text-slate-600 font-medium">
                            {score >= 80 ? "Excellent Match!" : score >= 60 ? "Good Potential" : "Needs Improvement"}
                        </p>
                    </CardContent>
                </Card>

                {/* Key Insights */}
                <Card className="md:col-span-2 glass-panel bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h4 className="flex items-center gap-2 font-semibold text-emerald-600 mb-2">
                                    <CheckCircle className="h-4 w-4" /> Strengths
                                </h4>
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                    {analysis.strengths.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 font-semibold text-red-500 mb-2">
                                    <XCircle className="h-4 w-4" /> Missing Keywords
                                </h4>
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                    {analysis.missingKeywords.map((k, i) => (
                                        <li key={i}>{k}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-1">Culture Fit</h4>
                            <p className="text-sm text-slate-600">{analysis.cultureFit}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-900">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-700 text-sm">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <NetworkingSection />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 glass-panel bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-slate-900">CV Language:</span>
                    <div className="flex gap-2">
                        <Button
                            variant={language === "French" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setLanguage("French")}
                            className={language === "French" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "hover:bg-slate-100 text-slate-700 border-slate-300"}
                        >
                            Français
                        </Button>
                        <Button
                            variant={language === "English" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setLanguage("English")}
                            className={language === "English" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "hover:bg-slate-100 text-slate-700 border-slate-300"}
                        >
                            English
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Button variant="outline" onClick={runAnalysis} className="w-full sm:w-auto gap-2 hover:bg-slate-100 text-slate-700 border-slate-300">
                        <Loader2 className="h-4 w-4" />
                        Regenerate Analysis
                    </Button>
                    <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="w-full sm:w-auto gap-2 hover:bg-slate-100 text-slate-700 border-slate-300">
                        <Eye className="h-4 w-4" />
                        {showPreview ? "Hide Preview" : "Preview Optimized CV"}
                    </Button>
                    <Button size="lg" onClick={() => handlePrint()} className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                        <Download className="h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>

            {showPreview && (
                <Card className="mt-8 glass-panel bg-white border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                        <CardTitle className="text-slate-900">Optimized CV Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-slate-50 overflow-x-auto">
                        <div className="min-w-[800px] p-8">
                            <div className="shadow-lg bg-white">
                                <PrintableCV data={analysisResults.optimizedCV} language={language} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hidden Printable Component */}
            <div className="hidden">
                <PrintableCV ref={printRef} data={analysisResults.optimizedCV} language={language} />
            </div>
        </div>
    );
}
