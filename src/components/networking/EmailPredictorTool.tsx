import { useState } from "react";
import { useUserStore } from "../../store/useUserStore";
import { useAppStore } from "../../store/useAppStore";
import { Mail, Loader2, Building2, User, Copy, Check, Search, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
    findCompanyDomain,
    getEmailPattern,
    generateEmail,
    formatEmailPattern,
    findEmail,
} from "../../services/emailService";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import { InsufficientCreditsModal } from "../modals/InsufficientCreditsModal";
import { useTranslation } from "../../hooks/useTranslation";

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
export function EmailPredictorTool() {
    const { t } = useTranslation();
    const { emailPredictor, setEmailPredictorState } = useAppStore();
    const { company, firstName, lastName, result } = emailPredictor;

    const [status, setStatus]           = useState<SearchStatus>(result ? 'success' : 'idle');
    const [errorMsg, setErrorMsg]       = useState<string | null>(null);
    const [copied, setCopied]           = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [fromCache, setFromCache]     = useState(false);

    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const { fetchCredits, credits } = useUserStore();

    const canSearch = !!company.trim() && !!firstName.trim() && !!lastName.trim();

    const copyToClipboard = () => {
        if (result?.email) {
            navigator.clipboard.writeText(result.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ── Recherche principale ──────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!canSearch || !isSignedIn) return;
        if (credits < 1) { setShowCreditModal(true); return; }

        setStatus('loading');
        setErrorMsg(null);
        setFromCache(false);

        try {
            const token = await getToken({ template: 'supabase' });
            const { getCachedEmail } = await import("../../services/emailService");

            // ── Étape 1 : Résolution silencieuse du domaine (tentative) ───────
            // L'utilisateur entre uniquement le nom — on tente de résoudre en arrière-plan
            const domain = await findCompanyDomain(company.trim(), token || undefined);

            // ── Étape 2 : Cache found_emails (0 crédit) ───────────────────────
            if (domain) {
                const cached = await getCachedEmail(firstName.trim(), lastName.trim(), domain, token || undefined);
                if (cached?.email) {
                    setEmailPredictorState({
                        result: { email: cached.email, domain, pattern: '', score: cached.score, source: 'cache' }
                    });
                    setFromCache(true);
                    setStatus('success');
                    return;
                }

                // ── Étape 3 : Cache domain_patterns → email généré (0 crédit Hunter) ──
                const pattern = await getEmailPattern(domain, token || undefined);
                if (pattern) {
                    const generatedEmail = generateEmail(firstName.trim(), lastName.trim(), pattern, domain);
                    if (generatedEmail) {
                        setEmailPredictorState({
                            result: { email: generatedEmail, domain, pattern, score: undefined, source: 'pattern' }
                        });
                        setFromCache(true);
                        setStatus('success');
                        if (user?.id) await fetchCredits(user.id, token || undefined);
                        return;
                    }
                }
            }

            // ── Étape 4 : Hunter email-finder (1 crédit) ─────────────────────
            // Si domaine résolu → on l'envoie. Sinon on envoie le nom de l'entreprise
            // Hunter gère lui-même la résolution dans ce cas.
            const emailData = await findEmail(
                firstName.trim(),
                lastName.trim(),
                domain || '',
                token || undefined,
                domain ? undefined : company.trim()
            );
            if (user?.id) await fetchCredits(user.id, token || undefined);

            if (emailData?.email) {
                setEmailPredictorState({
                    result: {
                        email: emailData.email,
                        domain: emailData.domain || domain || company.trim(),
                        pattern: '',
                        score: emailData.score,
                        source: 'finder'
                    }
                });
                setStatus('success');
                return;
            }

            // ── Étape 5 : Aucun résultat ──────────────────────────────────────
            setErrorMsg(`Aucun email trouvé pour ${firstName.trim()} ${lastName.trim()} chez ${company.trim()}. Vérifiez l'orthographe du nom et de l'entreprise.`);
            setStatus('error');

        } catch (err: any) {
            if (/insufficient credits/i.test(err.message)) {
                setShowCreditModal(true);
                setStatus('idle');
            } else {
                setErrorMsg(err.message || "Une erreur est survenue. Réessayez.");
                setStatus('error');
            }
        }
    };


    return (
        <div className="w-full max-w-none mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">{t('emailPredictor.title')}</h2>
                <p className="text-slate-600 text-lg">{t('emailPredictor.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* ── Panneau de recherche ── */}
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
                                            disabled={status === 'loading'}
                                            onKeyDown={(e) => e.key === 'Enter' && canSearch && handleSearch()}
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
                                                disabled={status === 'loading'}
                                                onKeyDown={(e) => e.key === 'Enter' && canSearch && handleSearch()}
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
                                            disabled={status === 'loading'}
                                            onKeyDown={(e) => e.key === 'Enter' && canSearch && handleSearch()}
                                        />
                                    </div>
                                </div>
                            </div>

                            {isSignedIn ? (
                                <Button
                                    onClick={handleSearch}
                                    disabled={!canSearch || status === 'loading'}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-base disabled:opacity-50"
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Recherche en cours...</>
                                    ) : (
                                        <><Search className="mr-2 h-5 w-5" /> {t('emailPredictor.findEmail')}</>
                                    )}
                                </Button>
                            ) : (
                                <SignInButton mode="modal">
                                    <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all text-base">
                                        <User className="mr-2 h-5 w-5" />
                                        {t('emailPredictor.signIn')}
                                    </Button>
                                </SignInButton>
                            )}

                            {/* Info crédit */}
                            {isSignedIn && (
                                <p className="text-xs text-slate-400 text-center">
                                    1 crédit par recherche • Résultats mis en cache partagé
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Panneau résultats ── */}
                <div className="md:col-span-2 space-y-6">
                    {status === 'success' && result ? (
                        <Card className="bg-white border-slate-200 shadow-sm h-full animate-slide-up">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg text-slate-900 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Check className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        {t('emailPredictor.result')}
                                    </div>
                                    {fromCache && (
                                        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 flex items-center gap-1">
                                            <Database className="w-3 h-3" /> Cache
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 flex flex-col items-center space-y-5">
                                {result.email ? (
                                    <>
                                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                            <Mail className="w-8 h-8 text-indigo-600" />
                                        </div>

                                        <div className="w-full text-center space-y-2">
                                            <p className="text-sm font-medium text-slate-500">
                                                {result.source === 'finder' || result.source === 'cache'
                                                    ? "Email trouvé via Hunter.io"
                                                    : "Email généré depuis le pattern"}
                                            </p>
                                            <div className="flex items-center justify-center gap-2">
                                                <code className="text-base font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 break-all">
                                                    {result.email}
                                                </code>
                                                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-9 w-9 p-0 shrink-0">
                                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                                                </Button>
                                            </div>
                                            {result.score !== undefined && (
                                                <p className="text-xs text-slate-400">Confiance Hunter : {result.score}%</p>
                                            )}
                                        </div>

                                        {/* Badge selon la source */}
                                        {(result.source === 'finder' || result.source === 'cache') && (
                                            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Email vérifié par Career Match
                                            </div>
                                        )}
                                        {result.source === 'pattern' && (
                                            <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-200">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Format vérifié par Career Match
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Pattern trouvé mais pas d'email direct */
                                    <div className="w-full space-y-4 text-center">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs text-slate-500 mb-2">Format email détecté</p>
                                            <code className="text-slate-900 font-mono font-bold text-base">
                                                {formatEmailPattern(result.pattern)}@{result.domain}
                                            </code>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Hunter n'a pas trouvé l'email exact. Vous pouvez essayer avec ce format.
                                        </p>
                                    </div>
                                )}

                                {/* Bouton nouvelle recherche */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setStatus('idle'); setEmailPredictorState({ result: null }); }}
                                    className="text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    Nouvelle recherche
                                </Button>
                            </CardContent>
                        </Card>
                    ) : status === 'error' ? (
                        <Card className="bg-red-50/50 border-red-200 shadow-sm h-full animate-slide-up">
                            <CardContent className="pt-8 flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-sm text-red-700 font-medium px-4">{errorMsg}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStatus('idle')}
                                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                                >
                                    Réessayer
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        /* État initial — exemple */
                        <Card className="bg-slate-50/50 border-slate-200 shadow-sm h-full">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg text-slate-900 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Search className="w-5 h-5 text-slate-500" />
                                        </div>
                                        {t('emailPredictor.noPrediction')}
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider">Exemple</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 flex flex-col items-center space-y-5">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                    <Mail className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-sm font-medium text-slate-500">Email Vérifié</p>
                                    <code className="text-base font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                                        jean.dupont@google.com
                                    </code>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Valid (Score: 100%)
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <InsufficientCreditsModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
        </div>
    );
}
