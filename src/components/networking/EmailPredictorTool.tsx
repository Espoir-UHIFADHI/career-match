import { useState } from "react";
import { useUserStore } from "../../store/useUserStore";
import { Mail, Loader2, Building2, User, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { findCompanyDomain, getEmailPattern, generateEmail, formatEmailPattern, verifyEmail, type VerificationResponse } from "../../services/emailService";
import { AlertCircle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { SignInButton, useUser, useAuth } from "@clerk/clerk-react";

export function EmailPredictorTool() {
    const [company, setCompany] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ email?: string, domain: string, pattern: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const { useCredit, credits } = useUserStore();

    // Verification state
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
    const [verificationResult, setVerificationResult] = useState<VerificationResponse['data'] | null>(null);

    const handlePredict = async () => {
        if (!company) return;

        if (!isSignedIn || !user) {
            return;
        }

        let token: string | null = null;
        try {
            token = await getToken({ template: 'supabase' });
        } catch (error) {
            console.error("Error getting Supabase token:", error);
            if (error instanceof Error && error.message.includes("No JWT template exists")) {
                alert("Configuration Error: Missing 'supabase' JWT template in Clerk Dashboard. Please contact the administrator.");
                return;
            }
        }

        // Cost is 2 credits for email discovery
        const result = await useCredit(user.id, 2, token || undefined);

        if (!result.success) {
            if (result.error === 'insufficient_funds_local' || result.error === 'insufficient_funds_server') {
                alert(`Crédits épuisés (${credits}). Passez à la version Pro pour continuer.`);
            } else {
                console.error("Credit error:", result.error);
                alert(`Une erreur est survenue lors de la vérification des crédits (${result.error}). Veuillez réessayer.`);
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

                    {isSignedIn ? (
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
                    ) : (
                        <SignInButton mode="modal">
                            <Button
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg shadow-slate-900/25 transition-all duration-300 hover:scale-[1.01] text-lg"
                            >
                                <User className="mr-2 h-5 w-5" />
                                Se connecter pour utiliser l'outil
                            </Button>
                        </SignInButton>
                    )}
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
                                        We found a pattern <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-sm">{formatEmailPattern(result.pattern)}@{result.domain}</code>
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-xl font-mono text-slate-900 select-all">{result.email}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyToClipboard}
                                        className="hover:bg-white hover:shadow-sm"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                                    </Button>
                                </div>

                                <div className="flex justify-center">
                                    {verificationStatus === 'idle' && (
                                        <Button variant="outline" onClick={handleVerify} className="gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verify Email
                                        </Button>
                                    )}
                                    {verificationStatus === 'verifying' && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying...
                                        </div>
                                    )}
                                    {getVerificationBadge()}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Pattern Found</h3>
                                <p className="text-slate-600">
                                    The email pattern for <span className="font-medium text-indigo-700">{result.domain}</span> is:
                                </p>
                                <code className="block bg-slate-100 p-3 rounded-lg text-lg font-mono text-slate-900 border border-slate-200">
                                    {formatEmailPattern(result.pattern)}@{result.domain}
                                </code>
                                <p className="text-sm text-slate-500">
                                    Enter a first and last name to generate the exact email address.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center animate-fade-in border border-red-100 flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}
        </div>
    );
}
