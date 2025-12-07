import { useState } from "react";
import { Search, FileText, Loader2, AlertCircle, Building2, Briefcase, Globe, ArrowRight, Link as LinkIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useUserStore } from "../../store/useUserStore";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { searchGoogle } from "../../services/search/serper";
import { generateJSON } from "../../services/ai/gemini";
import type { JobAnalysis } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { InsufficientCreditsModal } from "../modals/InsufficientCreditsModal";

export function JobInput() {
    const { t } = useTranslation();
    const { setJobData, setStep } = useAppStore();
    const [mode, setMode] = useState<"url" | "text">("url");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<(JobAnalysis & { url?: string }) | null>(null);
    const [showCreditModal, setShowCreditModal] = useState(false);

    const { user, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const { useCredit } = useUserStore();

    const analyzeJob = async () => {
        const contentToAnalyze = mode === "url" ? url : description;
        if (!contentToAnalyze.trim()) return;

        if (!isSignedIn || !user) {
            alert("Veuillez vous connecter pour analyser un job.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        // Deduct Credit
        let token: string | null = null;
        try {
            token = await getToken({ template: 'supabase' });
        } catch (error) {
            console.error("Error getting Supabase token:", error);
        }

        const result = await useCredit(user.id, 1, token || undefined, user.primaryEmailAddress?.emailAddress);

        if (!result.success) {
            setIsProcessing(false);
            if (result.error === 'insufficient_funds_local' || result.error === 'insufficient_funds_server') {
                setShowCreditModal(true);
            } else {
                setError(`Erreur lors de l'utilisation des crédits: ${result.error}`);
            }
            return;
        }

        try {
            let jobText = contentToAnalyze;

            if (mode === "url") {
                // 1. Try to fetch content via Jina AI Reader
                let jinaContent = "";
                try {
                    const jinaResponse = await fetch(`https://r.jina.ai/${url}`);
                    if (jinaResponse.ok) {
                        jinaContent = await jinaResponse.text();
                    }
                } catch (e) {
                    console.warn("Jina fetch failed:", e);
                }

                // 2. Also search via Serper for metadata/snippets
                let serperContent = "";
                try {
                    const results = await searchGoogle(url);
                    if (results && results.length > 0) {
                        serperContent = results.slice(0, 5).map(r =>
                            `Source: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`
                        ).join("\n\n");
                    }
                } catch (e) {
                    console.warn("Serper search failed:", e);
                }

                if (!jinaContent && !serperContent) {
                    console.warn("No info found for this URL");
                }

                jobText = `Target URL: ${url}\n\nFull Page Content (via Jina):\n${jinaContent}\n\nSearch Results (via Serper):\n${serperContent}`;
            }

            const prompt = `
        Analyze the following job posting and extract the key requirements.
        
        Job Content:
        ${jobText}
        
        Return a JSON object matching this schema:
        {
          "title": "Job Title",
          "company": "Company Name",
          "description": "Brief summary of the role and key responsibilities (max 3-4 sentences)",
          "requirements": {
            "hardSkills": ["skill1", "skill2"],
            "softSkills": ["skill1", "skill2"],
            "culture": ["value1", "value2"],
            "experienceLevel": "Junior/Mid/Senior"
          }
        }
      `;

            const analysis = await generateJSON(prompt, token || undefined);
            console.log("Job Analysis Result:", analysis);
            setPreviewData({ ...analysis, url: mode === "url" ? url : undefined });
        } catch (err) {
            console.error(err);
            setError("Failed to analyze job. Please try again or paste text manually.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProceed = () => {
        if (previewData) {
            // Ensure we only pass the properties expected by JobAnalysis
            const { url: _url, ...jobData } = previewData;
            setJobData(jobData);
            setStep(3);
        }
    };

    if (previewData) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('jobInput.summaryTitle')}</h2>
                    <p className="text-slate-500">
                        {t('jobInput.summarySubtitle')}
                    </p>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg text-slate-900">
                            <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            {previewData.title || "Untitled Job"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            <span className="font-semibold text-slate-900">{previewData.company || t('jobInput.unknownCompany')}</span>
                        </div>

                        {previewData.url && (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Globe className="h-4 w-4" />
                                <span className="underline decoration-slate-300 underline-offset-4">{t('jobInput.source')}: {new URL(previewData.url).hostname}</span>
                            </div>
                        )}

                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">{t('cvReview.description')}</h4>
                            <p className="text-slate-700 leading-relaxed text-sm">
                                {previewData.description || "No description available."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">{t('jobInput.hardSkills')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(previewData.requirements?.hardSkills || []).map((skill, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white text-slate-700 text-xs font-medium rounded-md border border-slate-200 shadow-sm">
                                            {skill}
                                        </span>
                                    ))}
                                    {(!previewData.requirements?.hardSkills || previewData.requirements.hardSkills.length === 0) && (
                                        <span className="text-sm text-slate-400 italic">{t('jobInput.noneDetected')}</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">{t('jobInput.softSkills')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(previewData.requirements?.softSkills || []).map((skill, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white text-slate-700 text-xs font-medium rounded-md border border-slate-200 shadow-sm">
                                            {skill}
                                        </span>
                                    ))}
                                    {(!previewData.requirements?.softSkills || previewData.requirements.softSkills.length === 0) && (
                                        <span className="text-sm text-slate-400 italic">{t('jobInput.noneDetected')}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setPreviewData(null)}
                                className="flex-1"
                            >
                                {t('jobInput.backToEdit')}
                            </Button>
                            <Button
                                onClick={handleProceed}
                                className="flex-1"
                            >
                                {t('jobInput.analyzeMatch')} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center mb-10 space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('jobInput.title')}</h2>
                <p className="text-slate-500 text-lg">
                    {t('jobInput.subtitle')}
                </p>
            </div>

            <Card className="overflow-hidden bg-white shadow-sm border-slate-200">
                <CardContent className="p-0">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setMode("url")}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200 ${mode === "url"
                                ? "text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <LinkIcon className="h-4 w-4" />
                            {t('jobInput.tabUrl')}
                        </button>
                        <button
                            onClick={() => setMode("text")}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200 ${mode === "text"
                                ? "text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            {t('jobInput.tabText')}
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {mode === "url" ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder={t('jobInput.placeholderUrl')}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Search className="h-3 w-3" />
                                    {t('jobInput.poweredBy')}
                                </p>
                            </div>
                        ) : (
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('jobInput.placeholderText')}
                                rows={10}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none shadow-sm text-sm leading-relaxed"
                            />
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-3 text-sm">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={analyzeJob}
                            disabled={isProcessing || (mode === "url" ? !url : !description)}
                            className="w-full h-11 text-base shadow-lg shadow-indigo-500/20"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('jobInput.analyzing')}
                                </>
                            ) : (
                                t('jobInput.analyze')
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>


            <InsufficientCreditsModal
                isOpen={showCreditModal}
                onClose={() => setShowCreditModal(false)}
            />
        </div >
    );
}
