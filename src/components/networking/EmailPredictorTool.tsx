import { useState } from "react";
import { useUserStore } from "../../store/useUserStore";
import { Mail, Loader2, Building2, User, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { findCompanyDomain, getEmailPattern, generateEmail, formatEmailPattern, verifyEmail, type VerificationResponse } from "../../services/emailService";
import { AlertCircle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import { AuthModal } from "../auth/AuthModal";

export function EmailPredictorTool() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [company, setCompany] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ email?: string, domain: string, pattern: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Verification state
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
    const [verificationResult, setVerificationResult] = useState<VerificationResponse['data'] | null>(null);

    const handlePredict = async () => {
        if (!company) return;

        // Check Credits
        const { useCredit, credits, session } = useUserStore.getState();
        // Cost is 2 credits for email discovery
        const success = await useCredit(2);

        if (!success) {
            if (!session) {
                setShowAuthModal(true);
            } else {
                alert(`Crédits épuisés (${credits}/5). Passez à la version Pro pour continuer.`);
            }
            return;
        }

        setStatus('loading');
        setError(null);
        setResult(null);
        setVerificationStatus('idle');
        setVerificationResult(null);

        try {
            // 1. Find domain
            const domain = await findCompanyDomain(company);
            if (!domain) throw new Error(`Impossible de trouver le domaine pour "${company}"`);

            // 2. Get pattern
            const pattern = await getEmailPattern(domain);
            if (!pattern) throw new Error(`Impossible de trouver un pattern email pour ${domain}`);

            // 3. Generate email if names provided
            let email: string | undefined;
            if (firstName && lastName) {
                const generated = generateEmail(firstName, lastName, pattern, domain);
                email = generated || undefined;
            }

            setResult({ email, domain, pattern });
            setStatus('success');
        } catch (err) {
            console.error("Prediction failed:", err);
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
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

    const getVerificationBadge = () => {
        if (!verificationResult) return null;

        const { status, score } = verificationResult;

        if (status === 'valid') {
            return (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Valid (Score: {score}%)
                </div>
            );
        } else if (status === 'invalid') {
            return (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                    <XCircle className="w-4 h-4" />
                    Invalid (Score: {score}%)
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium border border-amber-200">
                    <HelpCircle className="w-4 h-4" />
                    {status === 'accept_all' ? 'Accept All' : 'Risky'} (Score: {score}%)
                </div>
            );
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-6 animate-fade-in">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                    Email Predictor
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Find any professional email address in seconds using company name and full name.
                </p>
            </div>

            <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-600" />
                        Enter Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-slate-600">Company Name</Label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="e.g. Google"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="pl-10 glass-input bg-slate-50 border-slate-200 focus:bg-white h-11 transition-all duration-300"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600">First Name <span className="text-slate-400 text-xs">(Optional)</span></Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder="e.g. Jean"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="pl-10 glass-input bg-slate-50 border-slate-200 focus:bg-white h-11 transition-all duration-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Last Name <span className="text-slate-400 text-xs">(Optional)</span></Label>
                                <Input
                                    placeholder="e.g. Dupont"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="glass-input bg-slate-50 border-slate-200 focus:bg-white h-11 transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handlePredict}
                        disabled={status === 'loading' || !company}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.01] text-lg"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing Patterns...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-5 w-5" />
                                {firstName && lastName ? "Find Email" : "Find Format"}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results Section */}
            {status === 'success' && result && (
                <div className="animate-slide-up">
                    {result.email ? (
                        <Card className="glass-panel bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-md overflow-hidden">
                            <CardContent className="p-8 text-center space-y-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900">Email Found!</h3>
                                    <p className="text-slate-600">
                                        We found a pattern <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-sm">{result.pattern}</code> for <span className="font-medium text-indigo-700">{result.domain}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 text-lg font-mono text-slate-800 shadow-inner select-all">
                                        {result.email}
                                    </div>
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="outline"
                                        className={`h-14 w-14 rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all ${copied ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
                                    >
                                        {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                    </Button>
                                </div>

                                {/* Verification Section */}
                                <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100 w-full max-w-md mx-auto">
                                    {verificationStatus === 'idle' && (
                                        <Button
                                            onClick={handleVerify}
                                            variant="outline"
                                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        >
                                            Verify Email Existence
                                        </Button>
                                    )}

                                    {verificationStatus === 'verifying' && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying...
                                        </div>
                                    )}

                                    {verificationStatus === 'verified' && getVerificationBadge()}

                                    {verificationStatus === 'error' && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            Verification failed
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center shadow-sm">
                            <h3 className="font-bold text-xl text-blue-800 mb-2">Format d'email identifié</h3>
                            <div className="bg-white/60 inline-block px-4 py-2 rounded-lg border border-blue-100 mb-3">
                                <p className="text-lg font-mono text-slate-700">
                                    {formatEmailPattern(result.pattern)}@{result.domain}
                                </p>
                            </div>
                            <p className="text-sm text-blue-600">
                                Basé sur les données publiques de {company}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {status === 'error' && error && (
                <div className="animate-slide-up">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center text-red-800">
                        <p className="font-medium text-lg mb-2">❌ Prediction Failed</p>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            )}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
}
