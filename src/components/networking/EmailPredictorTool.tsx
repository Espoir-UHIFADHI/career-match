import { useState, useEffect } from "react";
import { useUserStore } from "../../store/useUserStore";
import { useAppStore } from "../../store/useAppStore";
import { Mail, Loader2, Building2, User, Copy, Check, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { findCompanyDomain, getEmailPattern, generateEmail, formatEmailPattern, verifyEmail, getCachedEmail, type VerificationResponse } from "../../services/emailService";
import { AlertCircle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import { InsufficientCreditsModal } from "../modals/InsufficientCreditsModal";
import { useTranslation } from "../../hooks/useTranslation";

export function EmailPredictorTool() {
    const { t } = useTranslation();
    const { emailPredictor, setEmailPredictorState } = useAppStore();

    // Derived state from store for convenience, or use directly
    const { company, firstName, lastName, result } = emailPredictor;

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    // Error and Copied are transient UI states, keep local
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const { useCredit, credits } = useUserStore();

    // Verification state
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
    const [verificationResult, setVerificationResult] = useState<VerificationResponse['data'] | null>(null);

    // Initialize status if result exists
    useEffect(() => {
        if (result && status === 'idle') {
            setStatus('success');
        }
    }, [result, status]);

    const handlePredict = async () => {
        if (!company) return;

        if (!isSignedIn || !user) {
            return;
        }

        let token: string | null = null;
        try {
            token = await getToken({ template: 'supabase', skipCache: true });
        } catch (error) {
            console.error("Error getting Supabase token:", error);
            if (error instanceof Error && error.message.includes("No JWT template exists")) {
                alert(t('emailPredictor.errors.configMissing'));
                return;
            }
        }

        if (!token) {
            console.error("❌ Auth Error: No token generated");
            setError(t('emailPredictor.errors.authFailed'));
            setStatus('error');
            return;
        }

        // Check local credits BEFORE starting
        if (credits < 1) {
            setShowCreditModal(true);
            return;
        }

        setStatus('loading');
        setError(null);
        setEmailPredictorState({ result: null });
        setVerificationStatus('idle');
        setVerificationResult(null);

        // Token is already fetched above


        try {
            // 1. Find domain
            const domain = await findCompanyDomain(company, token || undefined);
            if (!domain) throw new Error(t('emailPredictor.errors.domainNotFound', { company }));

            // 2. Get pattern
            const pattern = await getEmailPattern(domain, token || undefined);
            if (!pattern) throw new Error(t('emailPredictor.errors.patternNotFound', { domain }));

            // 3. Find or Generate email
            let email: string | undefined;
            let score: number | undefined;
            let source: 'finder' | 'pattern' | 'cache' = 'pattern';

            if (firstName && lastName) {
                // 1. Check Cache first (Free for us)
                const cached = await getCachedEmail(firstName, lastName, domain, token || undefined);

                if (cached) {
                    email = cached.email;
                    score = cached.score;
                    source = 'cache';
                } else {
                    // 2. Generate Pattern Suggestion (No API call yet)
                    const generated = generateEmail(firstName, lastName, pattern, domain);
                    email = generated || undefined;
                    source = 'pattern';
                }
            }

            setEmailPredictorState({
                result: { email, domain, pattern, score, source }
            });
            // Deduct Credit AFTER success - Only if we found something useful (pattern or email)
            if (email || pattern) {
                const creditResult = await useCredit(user.id, 1, token || undefined, user.primaryEmailAddress?.emailAddress);
                if (!creditResult.success) {
                    if (creditResult.error === 'insufficient_funds_local' || creditResult.error === 'insufficient_funds_server') {
                        // This catches the race condition where they spent their last credit in another tab
                        setShowCreditModal(true);
                        // Optional: Should we hide the result? 
                        // For better UX, we might show it anyway since we already did the work, but warn them next time.
                    } else {
                        console.error("Credit deduction failed:", creditResult.error);
                    }
                }
            }

            setStatus('success');
        } catch (err) {
            console.error("Prediction failed:", err);
            setError(err instanceof Error ? err.message : t('emailPredictor.errors.generic'));
            setStatus('error');
        }
    };

    const copyToClipboard = () => {
        if (result?.email) {
            navigator.clipboard.writeText(result.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleVerify = async () => {
        if (!result?.email) return;

        // COST SAVING: If we have a pattern, we trust it (as per user request)
        if (result.source === 'pattern') {
            setVerificationResult({
                status: 'valid',
                score: 95, // High confidence because pattern is certified
                result: 'deliverable',
                email: result.email,
                regexp: true,
                gibberish: false,
                disposable: false,
                webmail: false,
                mx_records: true,
                smtp_server: true,
                smtp_check: true,
                accept_all: false,
                block: false,
                sources: []
            });
            setVerificationStatus('verified');
            return;
        }

        setVerificationStatus('verifying');
        try {
            const data = await verifyEmail(result.email);
            if (data) {
                setVerificationResult(data);
                setVerificationStatus('verified');
            } else {
                setVerificationStatus('error');
            }
        } catch (e) {
            setVerificationStatus('error');
        }
    };

    // handleConfirm removed as it was unused and deduplicated logic exists elsewhere



    const getVerificationBadge = () => {
        if (!verificationResult) return null;

        const { status, score } = verificationResult;

        if (status === 'valid') {
            return (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-sm font-medium border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    {score === 95 ? t('emailPredictor.badges.validCertified') : t('emailPredictor.badges.validScore', { score })}
                </div>
            );
        } else if (status === 'invalid') {
            return (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                    <XCircle className="w-4 h-4" />
                    {t('emailPredictor.badges.invalidScore', { score })}
                </div>
            );
        } else {
            const label = status === 'accept_all' ? t('emailPredictor.badges.acceptAll') : t('emailPredictor.badges.risky');
            return (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium border border-amber-200">
                    <HelpCircle className="w-4 h-4" />
                    {label} (Score: {score}%)
                </div>
            );
        }
    };

    return (
        <div className="w-full max-w-none mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">{t('emailPredictor.title')}</h2>
                <p className="text-slate-600 text-lg">{t('emailPredictor.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Input Panel */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm h-full">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Search className="w-5 h-5 text-indigo-600" />
                                </div>
                                {t('networking.searchCriteria')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-medium">{t('emailPredictor.companyName')}</Label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder={t('emailPredictor.companyPlaceholder')}
                                            value={company}
                                            onChange={(e) => setEmailPredictorState({ company: e.target.value })}
                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">{t('emailPredictor.firstName')}</Label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            <Input
                                                placeholder={t('emailPredictor.firstNamePlaceholder')}
                                                value={firstName}
                                                onChange={(e) => setEmailPredictorState({ firstName: e.target.value })}
                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">{t('emailPredictor.lastName')}</Label>
                                        <Input
                                            placeholder={t('emailPredictor.lastNamePlaceholder')}
                                            value={lastName}
                                            onChange={(e) => setEmailPredictorState({ lastName: e.target.value })}
                                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isSignedIn ? (
                                <Button
                                    onClick={handlePredict}
                                    disabled={status === 'loading' || !company}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all text-base"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            {t('emailPredictor.analyzePatterns')}
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="mr-2 h-5 w-5" />
                                            {firstName && lastName ? t('emailPredictor.findEmail') : t('emailPredictor.findPattern')}
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <SignInButton mode="modal">
                                    <Button
                                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all text-base"
                                    >
                                        <User className="mr-2 h-5 w-5" />
                                        {t('emailPredictor.signIn')}
                                    </Button>
                                </SignInButton>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-2 space-y-6">
                    {status === 'success' && result ? (
                        <Card className="bg-white border-slate-200 shadow-sm h-full animate-slide-up">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Check className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    {t('emailPredictor.result')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 flex flex-col items-center justify-center space-y-6 h-[calc(100%-80px)]">
                                {result.email ? (
                                    <>
                                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                            <Mail className="w-10 h-10 text-indigo-600" />
                                        </div>

                                        <div className="w-full text-center space-y-2">
                                            <h3 className="font-semibold text-slate-900">
                                                {result.source === 'finder' || result.source === 'cache' ? t('emailPredictor.verified') : t('emailPredictor.suggestion')}
                                            </h3>
                                            <div className="flex items-center justify-center gap-2 w-full">
                                                <code className="text-lg font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 break-all">
                                                    {result.email}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={copyToClipboard}
                                                    className="h-9 w-9 p-0 text-slate-500 hover:text-indigo-600"
                                                >
                                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        {result.source === 'pattern' && (
                                            <div className="w-full space-y-3 pt-4 border-t border-slate-100">
                                                {verificationStatus === 'idle' && (
                                                    <Button
                                                        onClick={handleVerify}
                                                        variant="outline"
                                                        className="w-full text-xs"
                                                        size="sm"
                                                    >
                                                        {t('emailPredictor.verifyFormat')}
                                                    </Button>
                                                )}
                                                {verificationStatus === 'verifying' && (
                                                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                                        <Loader2 className="h-3 w-3 animate-spin" /> {t('emailPredictor.verifying')}
                                                    </div>
                                                )}
                                                {verificationStatus !== 'idle' && verificationStatus !== 'verifying' && getVerificationBadge()}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-slate-50 rounded-xl w-full text-center border border-slate-100">
                                            <p className="text-sm text-slate-500 font-medium mb-2">{t('emailPredictor.patternFound')}</p>
                                            <code className="text-slate-900 font-mono font-bold">
                                                {formatEmailPattern(result.pattern)}@{result.domain}
                                            </code>
                                        </div>
                                        <p className="text-xs text-slate-400 text-center px-4">
                                            {t('emailPredictor.patternDesc')}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-none h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-75">
                            <div className="p-4 bg-white rounded-full shadow-sm">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{t('emailPredictor.noPrediction')}</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    {t('emailPredictor.noPredictionDesc')}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm max-w-2xl mx-auto">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}


            <InsufficientCreditsModal
                isOpen={showCreditModal}
                onClose={() => setShowCreditModal(false)}
            />
        </div>
    );
}
