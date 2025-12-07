import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useUserStore } from "../../store/useUserStore";
import { Search, Loader2, User, Linkedin, Mail, Copy, Check, Sparkles, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { searchGoogle } from "../../services/search/serper";
import { findCompanyDomain, getEmailPattern, findEmail, cleanName, generateEmail } from "../../services/emailService";
import { generateNetworkingQueries, generateNetworkingMessage } from "../../services/ai/gemini";
import { NetworkingGuide } from "./NetworkingGuide";
import { Modal } from "../ui/Modal";
import { InsufficientCreditsModal } from "../modals/InsufficientCreditsModal";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useTranslation } from "../../hooks/useTranslation";

interface Contact {
    name: string;
    title: string;
    link: string;
    snippet: string;
    email?: string;
    emailStatus?: 'idle' | 'loading' | 'success' | 'error';
    emailConfidence?: number;
    emailPattern?: string;
    domain?: string;
}

export function NetworkingSearch() {
    const { t } = useTranslation();
    const { networking, setNetworkingState } = useAppStore();
    const { useCredit } = useUserStore(); // hook usage

    // Derived state from store
    const { company, role, results, hasSearched } = networking;

    // Local UI state
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth(); // START-MODIFICATION: Move hook call here to fix scope
    // END-MODIFICATION

    // Ensure results is treated as typed array even if store has any[]
    const typedResults = (results || []) as Contact[];

    // Modal State
    const [showGuide, setShowGuide] = useState(false);
    const [showDraft, setShowDraft] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);

    // Message Generation State
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);



    const handleSearch = async (isLoadMore = false) => {
        if (!company && !role) return;

        if (!isSignedIn || !user) {
            setError(t('networking.signInRequired') || "Veuillez vous connecter pour effectuer une recherche.");
            return;
        }

        // Check API key before attempting search
        setIsSearching(true);
        setError(null);

        // Deduct Credit
        try {
            const token = await getToken({ template: 'supabase' });
            const { success, error: creditError } = await useCredit(user.id, 1, token || undefined);

            if (!success) {
                setIsSearching(false);
                if (creditError === 'insufficient_funds_local' || creditError === 'insufficient_funds_server') {
                    setShowCreditModal(true);
                } else {
                    setError(t('networking.creditError') || "Erreur lors de la déduction des crédits.");
                }
                return;
            }
        } catch (err) {
            console.error("Credit deduction failed:", err);
            setIsSearching(false);
            setError("Erreur système lors de la vérification des crédits.");
            return;
        }

        if (!isLoadMore) {
            setNetworkingState({ results: [] });
        }

        try {


            let queries = [`site:linkedin.com/in/ ${role} ${company}`];

            // Get token again if needed (or reuse if still valid)
            const token = await getToken({ template: 'supabase' });

            try {
                const response = await generateNetworkingQueries(company, role, "", token || undefined);
                if (response && response.queries && response.queries.length > 0) {
                    queries = response.queries;
                }
            } catch (e) {
                console.warn("Gemini query generation failed, using fallback", e);
            }

            // Use the first query
            const queryToUse = queries[0];
            const searchResults = await searchGoogle(queryToUse, 10, 0, token || undefined);

            // Transform results
            const newContacts: Contact[] = searchResults.map(((r: any) => ({
                name: r.title.split('|')[0].split('-')[0].trim(), // Simple heuristic
                title: r.title,
                link: r.link,
                snippet: r.snippet,
                emailStatus: 'idle'
            })));

            // Deduplicate
            if (isLoadMore) {
                const combined = [...typedResults, ...newContacts];
                const unique = combined.filter((c, i, self) => self.findIndex(t => t.link === c.link) === i);
                setNetworkingState({ results: unique });
            } else {
                setNetworkingState({ results: newContacts });
            }
            setNetworkingState({ hasSearched: true });

        } catch (error) {
            console.error("Search failed:", error);
            setError(t('networking.searchError') || "Une erreur s'est produite lors de la recherche.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleGuessEmail = async (contactIndex: number) => {
        const contact = typedResults[contactIndex];
        if (!contact || !company) return;

        if (!isSignedIn || !user) {
            alert(t('common.signInRequired') || "Veuillez vous connecter pour utiliser cette fonctionnalité.");
            return;
        }

        let token: string | null = null;
        // Deduct Credit
        try {
            token = await getToken({ template: 'supabase' });
            const { success, error: creditError } = await useCredit(user.id, 1, token || undefined);

            if (!success) {
                if (creditError === 'insufficient_funds_local' || creditError === 'insufficient_funds_server') {
                    setShowCreditModal(true);
                } else {
                    alert(t('networking.creditError') || "Erreur lors de la déduction des crédits.");
                }
                return;
            }
        } catch (err) {
            console.error("Credit deduction failed:", err);
            return;
        }

        const newResults = [...typedResults];
        newResults[contactIndex] = { ...contact, emailStatus: 'loading' };
        setNetworkingState({ results: newResults });

        try {
            const domain = await findCompanyDomain(company, token || undefined);
            if (!domain) throw new Error("Domaine introuvable");

            const pattern = await getEmailPattern(domain, token || undefined);

            const cleanedName = cleanName(contact.name);
            const nameParts = cleanedName.split(" ");
            const first = nameParts[0];
            const last = nameParts.slice(1).join(" ");

            let emailFound = undefined;
            let score = undefined;

            if (first && last) {
                // COST SAVING STRATEGY:
                // 1. Try to generate from pattern first (Free/Cheap)
                // 2. Fallback to API findEmail (Expensive)

                if (pattern) {
                    // Generate based on pattern - Save API credits
                    emailFound = generateEmail(first, last, pattern, domain);
                    // Mock a confidence score for pattern-based generation
                    if (emailFound) {
                        score = 80;
                        // console.log("Email generated from pattern, skipping Hunter findEmail API");
                    }
                }

                // Only if no pattern or generation failed, try the expensive API
                if (!emailFound) {
                    const result = await findEmail(first, last, domain, token || undefined);
                    if (result) {
                        emailFound = result.email;
                        score = result.score;
                    }
                }
            }

            const updatedResults = [...typedResults];
            updatedResults[contactIndex] = {
                ...contact,
                emailStatus: 'success',
                email: emailFound || undefined,
                emailConfidence: score,
                emailPattern: pattern || undefined,
                domain: domain
            };
            setNetworkingState({ results: updatedResults });

        } catch (error) {
            console.error(error);
            const updatedResults = [...typedResults];
            updatedResults[contactIndex] = { ...contact, emailStatus: 'error' };
            setNetworkingState({ results: updatedResults });
        }
    };

    const handleGenerateMessage = async (contact: Contact) => {
        setSelectedContact(contact);
        setShowDraft(true);
        setIsGeneratingMessage(true);
        setGeneratedMessage("");

        try {
            const msg = await generateNetworkingMessage(
                null,
                company + " " + role,
                contact.title,
                company,
                "cold-outreach"
            );
            setGeneratedMessage(msg);
        } catch (e) {
            setGeneratedMessage(t('networking.genError') || "Error generating message. Please try again.");
        } finally {
            setIsGeneratingMessage(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedMessage);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="w-full max-w-none mx-auto space-y-8 animate-fade-in p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900">{t('networking.title')}</h2>
                    <p className="text-slate-600 text-lg">{t('networking.subtitle')}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowGuide(true)}
                    className="flex items-center gap-2"
                >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t('networking.guideBtn')}
                </Button>
            </div>

            {/* Main Search Panel - Full Width */}
            <div className="w-full">
                <Card className="bg-white border-slate-200 shadow-sm h-full">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <Search className="w-5 h-5 text-indigo-600" />
                            {t('networking.searchCriteria')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">{t('networking.companyLabel')}</Label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder={t('networking.companyPlaceholder')}
                                        value={company}
                                        onChange={(e) => setNetworkingState({ company: e.target.value })}
                                        className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">{t('networking.roleLabel')}</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder={t('networking.rolePlaceholder')}
                                        value={role}
                                        onChange={(e) => setNetworkingState({ role: e.target.value })}
                                        className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleSearch(false)}
                            disabled={isSearching || (!company && !role)}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
                        >
                            {isSearching ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                            {isSearching ? t('networking.searching') : t('networking.searchBtn')}
                        </Button>

                        {/* Results List */}
                        <div className="space-y-4 pt-2">
                            {hasSearched && typedResults.length === 0 && !isSearching ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">{t('networking.noResults')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {typedResults.map((contact, idx) => (
                                        <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3 items-start">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                                                        {contact.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{contact.name}</h4>
                                                        <p className="text-sm text-slate-600 line-clamp-2">{contact.title}</p>
                                                        <a href={contact.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1">
                                                            <Linkedin className="h-3 w-3" /> {t('networking.viewProfile')}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                                <div className="text-sm">
                                                    {contact.email ? (
                                                        <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded text-emerald-700 border border-emerald-100">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="font-mono text-xs select-all">{contact.email}</span>
                                                        </div>
                                                    ) : contact.emailStatus === 'loading' ? (
                                                        <span className="flex items-center text-slate-400 text-xs">
                                                            <Loader2 className="h-3 w-3 animate-spin mr-1" /> {t('networking.findingEmail')}
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleGuessEmail(idx)}
                                                            className="text-xs text-slate-500 h-7"
                                                        >
                                                            {t('networking.findEmail')}
                                                        </Button>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs border-slate-200 hover:bg-slate-50"
                                                    onClick={() => handleGenerateMessage(contact)}
                                                >
                                                    {t('networking.draftMessage')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isSearching && hasSearched && (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Networking Guide Modal */}
            <Modal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title={t('networking.guideTitle')}
                className="max-w-4xl"
            >
                <NetworkingGuide />
            </Modal>

            {/* Draft Message Modal */}
            <Modal
                isOpen={showDraft}
                onClose={() => setShowDraft(false)}
                title={selectedContact ? `${t('networking.draftFor')} ${selectedContact.name}` : t('networking.draftTitle')}
                className="max-w-2xl"
            >
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {selectedContact && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800">
                            {t('networking.draftingFor')} <span className="font-bold">{selectedContact.name}</span>
                        </div>
                    )}

                    {isGeneratingMessage ? (
                        <div className="py-8 text-center text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                            <p>{t('networking.writing')}</p>
                        </div>
                    ) : generatedMessage ? (
                        <>
                            <div className="p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                                {generatedMessage}
                            </div>
                            <Button onClick={copyToClipboard} className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800">
                                {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copySuccess ? t('networking.copied') : t('networking.copyClipboard')}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowDraft(false)} className="w-full text-xs text-slate-400">
                                {t('networking.close')}
                            </Button>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            {selectedContact && (
                                <Button onClick={() => handleGenerateMessage(selectedContact)}>{t('networking.generateNow')}</Button>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <InsufficientCreditsModal
                isOpen={showCreditModal}
                onClose={() => setShowCreditModal(false)}
            />

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}
        </div>
    );
}
