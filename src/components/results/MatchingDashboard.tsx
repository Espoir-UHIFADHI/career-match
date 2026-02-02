
import { useEffect, useState, useRef, useMemo } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Download, Eye, Sparkles, TrendingUp, Target, Globe, Share2, ArrowRight } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { matchAndOptimize } from "../../services/ai/gemini";
import { NetworkingSection } from "./NetworkingSection";
import { PrintableCV } from "./PrintableCV";
import { FeedbackWidget } from "./FeedbackWidget";
import type { MatchResult } from "../../types";

import { useTranslation } from "../../hooks/useTranslation";

import { useAuth, useUser } from "@clerk/clerk-react";

// @ts-ignore
import { pdf } from "@react-pdf/renderer";
import { CVDocument } from "./CVDocument";

export function MatchingDashboard() {
    const { t, language } = useTranslation();
    const { user } = useUser();
    const { getToken } = useAuth();
    const { cvData, jobData, analysisResults, setAnalysisResults } = useAppStore();
    const [cvLanguage] = useState<"French" | "English">("French");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUpdatingCV, setIsUpdatingCV] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // Multilingual Content Selection - MOVED UP TO FIX REACT ERROR #310
    const displayContent = useMemo(() => {
        if (!analysisResults) return null;
        const { analysis, recommendations } = analysisResults;
        const lang = language === 'fr' ? 'fr' : 'en';

        if (analysisResults.multilingual && analysisResults.multilingual[lang]) {
            return {
                analysis: {
                    ...analysis,
                    strengths: analysisResults.multilingual[lang].analysis.strengths,
                    cultureFit: analysisResults.multilingual[lang].analysis.cultureFit,
                },
                recommendations: analysisResults.multilingual[lang].recommendations
            };
        }
        return { analysis, recommendations };
    }, [analysisResults, language]);

    // Sharing Logic State
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);


    const handleShare = async () => {
        if (!analysisResults) return;
        if (shareUrl) {
            setIsShareModalOpen(true);
            return;
        }

        setIsSharing(true);
        try {
            const token = await getToken({ template: 'supabase' });
            const { createClerkSupabaseClient } = await import('../../services/supabase');
            const supabase = createClerkSupabaseClient(token || "");

            const { data, error } = await supabase.from('public_analyses').insert({
                content: analysisResults, // Store full result
                user_id: user?.id,
                career_slug: 'general' // Could be refined based on Job Title
            }).select().single();

            if (error) throw error;

            const url = `${window.location.origin}/share/${data.id}`;
            setShareUrl(url);
            setIsShareModalOpen(true);




        } catch (err: any) {
            console.error("Sharing failed:", err);
            // Display visible error to the user
            alert(`Erreur lors du partage : ${err.message || "Impossible de contacter la base de données."}\n\nL'administrateur doit exécuter la migration SQL "create_public_analyses".`);
        } finally {
            setIsSharing(false);
        }
    };



    // Mentor Invite Logic State
    const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
    const [mentorEmail, setMentorEmail] = useState("");
    const [mentorMessage, setMentorMessage] = useState("");
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);


    const handleInviteMentor = async () => {
        if (!mentorEmail) return;

        setIsSendingInvite(true);
        try {
            const token = await getToken({ template: 'supabase' });

            // 1. Ensure result is saved publicly first to get a link
            const { createClerkSupabaseClient } = await import('../../services/supabase');
            const supabase = createClerkSupabaseClient(token || "");

            let currentShareUrl = shareUrl;

            if (!currentShareUrl) {
                const { data, error } = await supabase.from('public_analyses').insert({
                    content: analysisResults,
                    user_id: user?.id,
                    career_slug: 'mentor-invite'
                }).select().single();

                if (error) throw error;
                currentShareUrl = `${window.location.origin}/share/${data.id}`;
                setShareUrl(currentShareUrl);
            }

            // 2. Send Email
            const { sendTransactionalEmail } = await import("../../services/emailService");
            const success = await sendTransactionalEmail(
                mentorEmail,
                'invite_mentor',
                {
                    menteeName: user?.firstName || "Un candidat",
                    jobTitle: jobData?.title || "Ce poste",
                    score: analysisResults?.score || 0,
                    link: `${currentShareUrl}?mode=cv`, // Force CV mode for mentor
                    message: mentorMessage
                },
                token || ""
            );

            if (success) {
                setInviteSuccess(true);
                setMentorEmail("");
                setMentorMessage("");
            } else {
                throw new Error("Erreur lors de l'envoi de l'email.");
            }

        } catch (err: any) {
            console.error("Invite failed:", err);
            alert(`Erreur : ${err.message}`);
        } finally {
            setIsSendingInvite(false);
        }
    };

    // ... existing imports ...

    const handleDownload = async () => {
        if (!analysisResults?.optimizedCV) return;

        try {
            const blob = await pdf(
                <CVDocument
                    data={analysisResults.optimizedCV}
                    language={cvLanguage}
                />
            ).toBlob();

            // Generate filename based on language
            const filename = `Optimized_CV_${cvLanguage}.pdf`;

            // Trigger download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("PDF Generation error:", e);
        }
    };

    const prevCvLanguageRef = useRef(cvLanguage);

    useEffect(() => {
        const hasLanguageChanged = prevCvLanguageRef.current !== cvLanguage;
        const hasResults = !!analysisResults;

        if (cvData && jobData && !isProcessing) {
            // Only run if we don't have results yet, OR if the language has changed
            if (!hasResults || hasLanguageChanged) {
                runAnalysis();
            }
        }
        prevCvLanguageRef.current = cvLanguage;
    }, [cvLanguage, cvData, jobData]);

    const runAnalysis = async () => {
        if (!cvData || !jobData) return;

        const isUpdate = !!analysisResults;
        if (isUpdate) {
            setIsUpdatingCV(true);
        } else {
            setIsProcessing(true);
        }

        setError(null);
        try {
            const token = await getToken({ template: 'supabase' });
            const results = await matchAndOptimize(cvData, jobData, cvLanguage, token || undefined);

            // If updating, preserve the original score and analysis to avoid flickering/confusion,
            // unless we want to allow them to change. The user asked for "only the CV refreshes".
            // However, matchAndOptimize generates everything together. 
            // If we replace everything, the score might change.
            // Let's replace everything for now but only show loader on CV.
            // OR: we could merge: { ...results, score: analysisResults?.score || results.score, analysis: analysisResults?.analysis || results.analysis } ??
            // But if the language changes, maybe the analysis text (strengths) should theoretically change language too?
            // The user said "page stays in original language".
            // Let's just update the results but keep the UI stable via isUpdatingCV.

            setAnalysisResults(results as MatchResult);
            setShowPreview(true);

            // Only send email on initial run, not on language switch updates
            if (!isUpdate && results && 'score' in results && user?.primaryEmailAddress?.emailAddress) {
                const { sendTransactionalEmail } = await import("../../services/emailService");

                await sendTransactionalEmail(
                    user.primaryEmailAddress.emailAddress,
                    'match_ready',
                    {
                        score: (results as any).score,
                        jobTitle: jobData.title || jobData.company || 'Job'
                    },
                    token || ""
                );
            }
        } catch (err) {
            console.error(err);
            setError("Failed to analyze match. Please try again.");
        } finally {
            setIsProcessing(false);
            setIsUpdatingCV(false);
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

    const { score } = analysisResults;
    const isLowMatch = score < 45 || !analysisResults.optimizedCV;

    if (!displayContent) return null;



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
                                    className={`transition - all duration - 1000 ease - out ${getScoreColor(score)} `}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text - 6xl font - bold tracking - tighter ${getScoreColor(score)} `}>{score}%</span>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <span className={`inline - flex items - center px - 4 py - 1.5 rounded - full text - sm font - semibold border ${score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                score >= 60 ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                    score >= 45 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                        "bg-red-50 text-red-700 border-red-100"
                                } `}>
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
                                        {displayContent.analysis.strengths.map((s, i) => (
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
                                        {displayContent.analysis.missingKeywords.map((k, i) => (
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
                                {displayContent.analysis.cultureFit}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-slate-900">{t('dashboard.recommendations')}</CardTitle>
                        </div>
                        <FeedbackWidget />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4">
                        {displayContent.recommendations.map((rec, i) => (
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


            {/* Referral Card - HIDDEN FOR NOW */}
            {/* <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl shadow-slate-200/50 mx-auto max-w-5xl mb-12 relative overflow-hidden group border border-slate-800 ring-1 ring-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-800/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-slate-800/70 transition-all duration-700 mixture-blend-overlay" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="text-center lg:text-left max-w-2xl">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center lg:justify-start gap-3">
                            <span className="p-2.5 bg-slate-800 rounded-xl backdrop-blur-sm shadow-inner text-yellow-300 border border-slate-700">
                                <Sparkles className="h-6 w-6" />
                            </span>
                            Gagnez des crédits gratuits
                        </h3>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            Invitez un ami sur Career Match. Dès qu'il s'inscrit, vous recevrez <strong className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-700">3 crédits offerts</strong> chacun.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full lg:w-auto min-w-[340px]">
                        <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl rounded-xl border border-slate-700 focus-within:border-slate-500 focus-within:bg-black/50 transition-all shadow-lg">
                             <div className="pl-3 text-slate-400">
                                <LinkIcon className="h-4 w-4" />
                             </div>
                             <input 
                                type="text" 
                                readOnly 
                                value={`https://careermatch.fr?ref=${user?.id}`}
                                className="bg-transparent border-none focus:ring-0 text-sm text-slate-200 w-full font-mono placeholder-slate-500 truncate"
                                onClick={(e) => e.currentTarget.select()}
                             />
                             <Button 
                                size="sm"
                                className="bg-white text-slate-900 hover:bg-slate-100 border-0 font-bold shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all min-w-[100px]"
                                onClick={(e) => {
                                    navigator.clipboard.writeText(`https://careermatch.fr?ref=${user?.id}`);
                                    const btn = e.currentTarget;
                                    const originalText = btn.innerHTML;
                                    btn.innerText = "Copié !";
                                    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                                }}
                             >
                                <Copy className="h-4 w-4 mr-2" />
                                Copier
                             </Button>
                        </div>
                        <p className="text-xs text-slate-400 text-center font-medium opacity-80">
                            Partagez ce lien sur LinkedIn ou WhatsApp
                        </p>
                    </div>
                </div>
            </div> */}

            {/* Action Bar */}
            <div className="sticky bottom-6 z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50">
                    {!isLowMatch && (
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <Globe className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">{t('dashboard.cvLanguage')}</span>
                            </div>
                            <div className="flex p-1 bg-slate-100 rounded-lg opacity-80 cursor-not-allowed" title="Autres langues bientôt disponibles">
                                <span className="px-4 py-1.5 rounded-md text-sm font-medium bg-white text-indigo-600 shadow-sm">
                                    Français
                                </span>
                                {/* English disabled for MVP */}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
                                    variant="outline"
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="w-full sm:w-auto gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                >
                                    {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                                    {shareUrl ? "Partager" : "Partager"}
                                </Button>

                                {/* <Button
                                    variant="outline"
                                    onClick={() => setIsMentorModalOpen(true)}
                                    className="w-full sm:w-auto gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                                >
                                    Inviter un Mentor
                                </Button> */}

                                <Button
                                    size="lg"
                                    onClick={handleDownload}
                                    className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 border-0"
                                >
                                    <Download className="h-4 w-4" />
                                    {t('dashboard.downloadPDF')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div >

            {/* Mentor Invite Modal */}
            {isMentorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        {/* Interactive Background Elements */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <div className={`p-3 rounded-2xl w-fit mb-4 ${inviteSuccess ? "bg-emerald-50" : "bg-indigo-50"}`}>
                                    {inviteSuccess ? (
                                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                                    ) : (
                                        <Sparkles className="h-6 w-6 text-indigo-600" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {inviteSuccess ? "Invitation envoyée !" : "Demander un avis d'expert"}
                                </h3>
                                <p className="text-slate-500 mt-1">
                                    {inviteSuccess
                                        ? "Votre mentor a bien reçu votre demande. Surveillez vos notifications !"
                                        : "Invitez un mentor à revoir votre CV optimisé."}
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsMentorModalOpen(false); setInviteSuccess(false); }}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        {inviteSuccess ? (
                            <div className="text-center py-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                                <div className="inline-block p-4 bg-emerald-100 rounded-full mb-6">
                                    <div className="bg-emerald-500 rounded-full p-2 animate-bounce">
                                        <CheckCircle className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                                    Nous préviendrons dès que votre mentor aura consulté votre CV.
                                </p>
                                <Button
                                    onClick={() => { setIsMentorModalOpen(false); setInviteSuccess(false); }}
                                    className="w-full py-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-semibold"
                                >
                                    Retour au tableau de bord
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        Email du Mentor <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="ex: mentor@entreprise.com"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                                        value={mentorEmail}
                                        onChange={(e) => setMentorEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Message personnel</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 h-32 resize-none transition-all bg-slate-50 hover:bg-white"
                                        placeholder="Salut, j'ai optimisé mon CV pour ce poste avec Career Match. Peux-tu me donner ton avis ?"
                                        value={mentorMessage}
                                        onChange={(e) => setMentorMessage(e.target.value)}
                                    />
                                </div>

                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl flex gap-3 border border-indigo-100/50">
                                    <div className="p-2 bg-white rounded-full shadow-sm h-fit shrink-0">
                                        <Globe className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <p className="text-xs leading-relaxed text-indigo-900/80">
                                        <span className="font-semibold block mb-0.5 text-indigo-900">Accès Sécurisé & Simplifié</span>
                                        Votre mentor recevra un lien unique pour consulter la version PDF de votre CV directement dans son navigateur, sans inscription requise.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsMentorModalOpen(false)}
                                        className="flex-1 py-6 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleInviteMentor}
                                        disabled={!mentorEmail || isSendingInvite}
                                        className="flex-1 py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all font-semibold"
                                    >
                                        {isSendingInvite ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            <>
                                                Envoyer l'invitation
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {
                showPreview && !isLowMatch && analysisResults.optimizedCV && (
                    <Card className="mt-8 bg-white border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 relative">
                        <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                {t('dashboard.optimizedPreview')}
                            </CardTitle>
                            <Button size="sm" variant="ghost" onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-slate-900">
                                {t('dashboard.closePreview')}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 bg-slate-100 overflow-x-auto relative min-h-[400px]">
                            {isUpdatingCV && (
                                <div className="absolute inset-0 z-50 bg-white backdrop-blur-sm flex flex-col items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                                    <p className="text-sm font-medium text-slate-600 animate-pulse">{t('dashboard.optimizing')}</p>
                                </div>
                            )}
                            <div className="min-w-[800px] p-8 flex justify-center">
                                <div className="shadow-2xl bg-white">
                                    {analysisResults?.optimizedCV && <PrintableCV data={analysisResults.optimizedCV} language={cvLanguage} />}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Hidden Printable Component */}
            {
                !isLowMatch && analysisResults.optimizedCV && (
                    <div className="hidden">
                        <PrintableCV ref={printRef} data={analysisResults.optimizedCV} language={cvLanguage} />
                    </div>
                )
            }

            {/* Share Modal */}
            {isShareModalOpen && shareUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        {/* Interactive Background Elements */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Partager l'analyse</h3>
                                <p className="text-slate-500 mt-1">Copiez le lien ci-dessous pour partager ce résultat.</p>
                            </div>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <Share2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="bg-transparent border-none text-slate-600 text-sm w-full focus:ring-0 p-0 font-medium"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                            </div>

                            <Button
                                onClick={(e) => {
                                    navigator.clipboard.writeText(shareUrl);
                                    const btn = e.currentTarget;
                                    const original = btn.innerText;
                                    btn.innerText = 'Copié !';
                                    setTimeout(() => { btn.innerText = original }, 2000);
                                }}
                                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-200"
                            >
                                Copier le lien
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
}
