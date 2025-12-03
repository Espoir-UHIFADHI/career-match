import { useState } from "react";
import { Search, FileText, Loader2, AlertCircle, Building2, Briefcase, Globe, ArrowRight, Link as LinkIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { searchGoogle } from "../../services/search/serper";
import { generateJSON } from "../../services/ai/gemini";
import type { JobAnalysis } from "../../types";

export function JobInput() {
    const { setJobData, setStep } = useAppStore();
    const [mode, setMode] = useState<"url" | "text">("url");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<(JobAnalysis & { url?: string }) | null>(null);

    const analyzeJob = async () => {
        const contentToAnalyze = mode === "url" ? url : description;
        if (!contentToAnalyze.trim()) return;

        setIsProcessing(true);
        setError(null);

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

            const analysis = await generateJSON(prompt);
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
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900">Job Summary</h2>
                    <p className="text-slate-600 text-lg">
                        Please review the extracted job details.
                    </p>
                </div>

                <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Briefcase className="h-6 w-6 text-indigo-600" />
                            </div>
                            {previewData.title || "Untitled Job"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            <span className="font-medium text-lg">{previewData.company || "Unknown Company"}</span>
                        </div>

                        {previewData.url && (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Globe className="h-4 w-4" />
                                <span>Source: {new URL(previewData.url).hostname}</span>
                            </div>
                        )}

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Description</h4>
                            <p className="text-slate-600 leading-relaxed">
                                {previewData.description || "No description available."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Hard Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(previewData.requirements?.hardSkills || []).map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200">
                                            {skill}
                                        </span>
                                    ))}
                                    {(!previewData.requirements?.hardSkills || previewData.requirements.hardSkills.length === 0) && (
                                        <span className="text-sm text-slate-500 italic">None detected</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-emerald-700 mb-3 uppercase tracking-wider">Soft Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(previewData.requirements?.softSkills || []).map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
                                            {skill}
                                        </span>
                                    ))}
                                    {(!previewData.requirements?.softSkills || previewData.requirements.softSkills.length === 0) && (
                                        <span className="text-sm text-slate-500 italic">None detected</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setPreviewData(null)}
                                className="flex-1 hover:bg-slate-100 text-slate-700 border-slate-300 h-12"
                            >
                                Back to Edit
                            </Button>
                            <Button
                                onClick={handleProceed}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
                            >
                                Analyze Compatibility <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center mb-10 space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">Target Job</h2>
                <p className="text-slate-600 text-lg">
                    Paste the job description or URL to match against.
                </p>
            </div>

            <Card className="glass-panel bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex gap-6 border-b border-slate-200">
                        <button
                            onClick={() => setMode("url")}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 ${mode === "url"
                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Job URL
                        </button>
                        <button
                            onClick={() => setMode("text")}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 ${mode === "text"
                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Job Description
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {mode === "url" ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://linkedin.com/jobs/..."
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Search className="h-3 w-3" />
                                    We'll use Google Search to find details about this link.
                                </p>
                            </div>
                        ) : (
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Paste the full job description here..."
                                rows={12}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                            />
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-slide-up">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={analyzeJob}
                            disabled={isProcessing || (mode === "url" ? !url : !description)}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing Job...
                                </>
                            ) : (
                                "Analyze Job"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
