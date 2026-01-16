import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useUserStore } from "../../store/useUserStore";
import { Search, Loader2, User, Linkedin, Copy, Check, Sparkles, Building2, AlertCircle, Construction, MapPin, Users, Download, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { searchGoogle } from "../../services/search/serper";
// import { findCompanyDomain, getEmailPattern, findEmail, cleanName, generateEmail } from "../../services/emailService";
import { generateNetworkingQueries, generateNetworkingMessage, type NetworkingQueriesResponse } from "../../services/ai/gemini";
import { NetworkingGuide } from "./NetworkingGuide";
import { Modal } from "../ui/Modal";
import { InsufficientCreditsModal } from "../modals/InsufficientCreditsModal";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useTranslation } from "../../hooks/useTranslation";
import { downloadAsExcel } from "../../utils/excelExport";

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
    emailErrorType?: string;
}


// Persona / Strategy Types
// Persona / Strategy Types
type SearchStrategy = 'gatekeeper' | 'peer' | 'decision_maker';

// Badge Helpers
const getBadgeForTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('founder') || t.includes('ceo') || t.includes('cto') || t.includes('vp') || t.includes('directeur général') || t.includes('head') || t.includes('director') || t.includes('manager') || t.includes('lead')) return { label: 'Decision Maker', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (t.includes('senior') || t.includes('principal') || t.includes('staff')) return { label: 'Senior', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (t.includes('recruiter') || t.includes('talent') || t.includes('rh') || t.includes('hr')) return { label: 'Recrutement', color: 'bg-pink-100 text-pink-700 border-pink-200' };
    return null;
};

export function NetworkingSearch() {
    const { t, language } = useTranslation();
    const { networking, setNetworkingState } = useAppStore();
    const { useCredit, credits } = useUserStore();

    // Derived state from store
    const { company, role, location, results, hasSearched } = networking;

    // Local UI state
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [showDevModal, setShowDevModal] = useState(false);
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    // Advanced Search State
    const [activeStrategy, setActiveStrategy] = useState<SearchStrategy>('gatekeeper');
    const [hiringFilter, setHiringFilter] = useState(false);
    // const [personaQueries, setPersonaQueries] = useState<{ [key in SearchStrategy]?: string[] }>({}); // Removed in favor of structured data
    const [aiSearchData, setAiSearchData] = useState<NetworkingQueriesResponse | null>(null);
    const [dateFilter, setDateFilter] = useState(false);

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

    const handleSearch = async (isLoadMore = false, strategyOverride?: SearchStrategy, filtersOverride?: { hiring?: boolean, date?: boolean }) => {
        if (!company && !role && !location) return;

        const strategyToUse = strategyOverride || activeStrategy;
        const hiringToUse = filtersOverride?.hiring !== undefined ? filtersOverride.hiring : hiringFilter;
        const dateToUse = filtersOverride?.date !== undefined ? filtersOverride.date : dateFilter;

        if (strategyOverride) setActiveStrategy(strategyOverride);

        if (!isSignedIn || !user) {
            setError(t('networking.signInRequired') || "Veuillez vous connecter pour effectuer une recherche.");
            return;
        }

        // Check API key before attempting search
        setIsSearching(true);
        setError(null);

        // Check local credits BEFORE starting
        if (credits < 1 && user?.primaryEmailAddress?.emailAddress !== 'espoiradouwekonou20@gmail.com') {
            setShowCreditModal(true);
            return;
        }

        if (!isLoadMore) {
            setNetworkingState({ results: [] });
        }

        try {
            const token = await getToken({ template: 'supabase' });

            // 1. Generate Query Parts if needed (only on first search or if fresh search)
            let currentAiData = aiSearchData;

            if (!isLoadMore && !currentAiData) {
                try {
                    // Pass language to generate queries in the correct language
                    const response = await generateNetworkingQueries(company, role, location, token || undefined, language);

                    if (response && response.keywords) {
                        // New Backend Format
                        currentAiData = response;
                    } else {
                        // Old Backend Format (or error) -> Fallback to client-side heuristics
                        console.warn("Backend returned legacy format or invalid data. Using strict fallback.");
                        currentAiData = {
                            role_synonyms: [],
                            keywords: {
                                gatekeeper: '(intitle:RH OR intitle:Recruteur OR intitle:"Talent Acquisition" OR intitle:"Human Resources")',
                                peer: role ? `(intitle:"${role.trim()}")` : '',
                                decision_maker: '(intitle:Manager OR intitle:Head OR intitle:Director OR intitle:VP OR intitle:Chief OR intitle:CEO OR intitle:Founder)',
                                email_finder: '("email" OR "contact" OR "@")'
                            }
                        };
                    }
                    setAiSearchData(currentAiData);
                } catch (e) {
                    console.warn("Gemini query generation failed, using fallback", e);
                    // Fallback logic
                    currentAiData = {
                        role_synonyms: [],
                        keywords: {
                            gatekeeper: '(intitle:RH OR intitle:Recruteur OR intitle:"Talent Acquisition")',
                            peer: `(intitle:"${role}")`,
                            decision_maker: '(intitle:Manager OR intitle:Head OR intitle:Director)',
                            email_finder: '("email" OR "contact")'
                        }
                    };
                    setAiSearchData(currentAiData);
                }
            }

            // 2. Strict Query Construction
            const baseQuery = `site:linkedin.com/in/`;

            // Scope (Company "AND" Location) - STRICT
            const scopeParts = [];
            if (company) scopeParts.push(`"${company.trim()}"`);
            if (location) scopeParts.push(`"${location.trim()}"`);

            // Role (User Input "OR" Synonyms)
            let rolePart = "";
            if (role) {
                const synonyms = currentAiData?.role_synonyms || [];
                // Filter out synonyms that are identical to role to avoid dupes
                const uniqueSynonyms = synonyms.filter(s => s.toLowerCase() !== role.toLowerCase());
                const allRoles = [`"${role.trim()}"`, ...uniqueSynonyms.map(s => `"${s}"`)];
                rolePart = `(${allRoles.join(" OR ")})`;
            }

            // Strategy Keywords (Persona)
            const keywordPart = currentAiData?.keywords[strategyToUse] || "";

            // Hiring Filter
            const hiringPart = hiringToUse ? `(intitle:hiring OR "recrute" OR "#hiring")` : "";

            // Construct Final Query
            // We use exclusion operators to clean up results
            const cleanUp = `-intitle:jobs -intitle:offre -inurl:jobs`;

            const queryToUse = `${baseQuery} ${scopeParts.join(" ")} ${rolePart} ${keywordPart} ${hiringPart} ${cleanUp}`.trim();

            console.log("🔒 Strict Networking Search Query:", queryToUse);

            // 3. Execution
            const startOffset = isLoadMore ? typedResults.length : 0;

            // Pass dateFilter and language to serper
            const searchResults = await searchGoogle(queryToUse, 10, startOffset, token || undefined, dateToUse, language);

            const newContacts: Contact[] = searchResults.map(((r: any) => ({
                name: r.title.split('|')[0].split('-')[0].trim(),
                title: r.title,
                link: r.link,
                snippet: r.snippet,
                emailStatus: 'idle'
            })));

            let addedCount = 0;

            if (isLoadMore) {
                const combined = [...typedResults, ...newContacts];
                const unique = combined.filter((c, i, self) => self.findIndex(t => t.link === c.link) === i);
                addedCount = unique.length - typedResults.length;
                setNetworkingState({ results: unique });
            } else {
                addedCount = newContacts.length;
                setNetworkingState({ results: newContacts });
            }
            setNetworkingState({ hasSearched: true });

            // Deduct Credit passed checks
            if (addedCount > 0) {
                try {
                    const { success } = await useCredit(user.id, 1, token || undefined);
                    if (!success && credits < 1) setShowCreditModal(true); // Double check
                } catch (err) {
                    console.error("Credit deduction failed:", err);
                }
            }

        } catch (error) {
            console.error("Search failed:", error);
            setError(t('networking.searchError') || "Une erreur s'est produite lors de la recherche.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleStrategyClick = (s: SearchStrategy) => {
        if (activeStrategy === s) return;
        handleSearch(false, s);
    };

    const handleHiringToggle = () => {
        const newVal = !hiringFilter;
        setHiringFilter(newVal);
        handleSearch(false, undefined, { hiring: newVal });
    };

    const handleDateToggle = () => {
        const newVal = !dateFilter;
        setDateFilter(newVal);
        handleSearch(false, undefined, { date: newVal });
    };

    // const handleGuessEmail = async (_contactIndex: number) => {
    //     setShowDevModal(true);
    // };

    const handleGenerateMessage = async (contact: Contact) => {
        setSelectedContact(contact);
        setShowDraft(true);
        setIsGeneratingMessage(true);
        setGeneratedMessage("");

        try {
            const token = await getToken({ template: 'supabase' });
            const msg = await generateNetworkingMessage(null, company + " " + role, contact.title, company, "cold-outreach", token || undefined);
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

    const handleDownloadExcel = () => {
        if (!typedResults || typedResults.length === 0) return;

        const dataToExport = typedResults.map(contact => {
            // Smart Name Split (Basic heuristic: First word = First Name, Rest = Last Name)
            const nameParts = contact.name.trim().split(' ');
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(' ') || "";

            return {
                "Prénom": firstName,
                "Nom": lastName,
                "Titre (Job)": contact.title,
                "Entreprise Visée": company || "Non spécifié",
                "Stratégie": activeStrategy === 'gatekeeper' ? 'RH/Recruteur' : activeStrategy === 'peer' ? 'Pair' : 'Décideur',
                "Lien LinkedIn": contact.link,
                "Email": contact.email || "",
                "Statut Contact": "", // Empty for CRM use
                "Note": "",           // Empty for CRM use
            };
        });

        downloadAsExcel(dataToExport, `Networking_${company || 'Search'}_${new Date().toISOString().split('T')[0]}`);
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">{t('networking.locationLabel')}</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder={t('networking.locationPlaceholder')}
                                        value={location || ''}
                                        onChange={(e) => setNetworkingState({ location: e.target.value })}
                                        className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Bar: Search + Filters */}
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <Button
                                onClick={() => handleSearch(false)}
                                disabled={isSearching || (!company && !role && !location)}
                                className="w-full md:w-auto min-w-[150px] h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all"
                            >
                                {isSearching ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                                {isSearching ? t('networking.searching') : t('networking.searchBtn')}
                            </Button>

                            <div className="flex flex-wrap gap-2 items-center flex-1 justify-center md:justify-start pt-2 md:pt-0">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Cibler :</span>
                                <button
                                    onClick={() => handleStrategyClick('gatekeeper')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStrategy === 'gatekeeper' ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-pink-200 hover:text-pink-600'}`}
                                >
                                    <Users className="w-3 h-3" /> RH & Recruteurs
                                </button>
                                <button
                                    onClick={() => handleStrategyClick('peer')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStrategy === 'peer' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'}`}
                                >
                                    <Construction className="w-3 h-3" /> Pairs (Tech/Métier)
                                </button>
                                <button
                                    onClick={() => handleStrategyClick('decision_maker')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStrategy === 'decision_maker' ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200 hover:text-purple-600'}`}
                                >
                                    <Sparkles className="w-3 h-3" /> Décideurs & Direction
                                </button>

                                <div className="h-4 w-px bg-slate-200 mx-2 hidden md:block"></div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:block">Filtres :</span>

                                <button
                                    onClick={handleHiringToggle}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${hiringFilter ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-600'}`}
                                >
                                    <Megaphone className="w-3 h-3" /> {t('networking.hiringFilter')}
                                </button>

                                <button
                                    onClick={handleDateToggle}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${dateFilter ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                >
                                    {dateFilter ? <Check className="w-3 h-3" /> : null}
                                    {t('networking.dateFilter')}
                                </button>
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="space-y-4 pt-2">
                            {hasSearched && typedResults.length === 0 && !isSearching ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">{t('networking.noResults')}</p>
                                    <p className="text-xs text-slate-400 mt-2">Essayez d'élargir la localisation ou de changer de cible (RH, Pairs...).</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-end mb-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadExcel}
                                            className="flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            <Download className="h-4 w-4" />
                                            {t('networking.downloadList') || "Télécharger la liste"}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {typedResults.map((contact, idx) => {
                                            const badge = getBadgeForTitle(contact.title);
                                            return (
                                                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-3 items-start w-full">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0 border border-slate-200">
                                                                {contact.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{contact.name}</h4>
                                                                    {badge && (
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${badge.color}`}>
                                                                            {badge.label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">{contact.title}</p>
                                                                {/* Snippet validation / cleanup if needed */}
                                                                <p className="text-xs text-slate-400 line-clamp-1 mt-1">{contact.snippet.replace(/\s\.\.\./g, '')}</p>

                                                                <a href={contact.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-2 font-medium">
                                                                    <Linkedin className="h-3 w-3" /> {t('networking.viewProfile')}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
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
                                                            ) : contact.emailStatus === 'error' ? (
                                                                <div className="flex items-center gap-1 text-red-500 text-xs font-medium" title={t('networking.emailError')}>
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    <span>Error</span>
                                                                </div>
                                                            ) : (contact.emailStatus === 'success' && !contact.email) ? (
                                                                <div className="flex items-center gap-1 text-slate-400 text-xs italic">
                                                                    <Mail className="h-3 w-3 opacity-50" />
                                                                    <span>{t('networking.emailNotFound')}</span>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleGuessEmail(idx)}
                                                                    className="text-xs text-slate-500 h-7 px-2 hover:bg-slate-100"
                                                                >
                                                                    {t('networking.findEmail')}
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                                            onClick={() => handleGenerateMessage(contact)}
                                                        >
                                                            {t('networking.draftMessage')}
                                                        </Button>
                                                    </div> */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end items-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                                            onClick={() => handleGenerateMessage(contact)}
                                                        >
                                                            {t('networking.draftMessage')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                            {isSearching && (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            )}

                            {/* Load More Button */}
                            {hasSearched && typedResults.length > 0 && !isSearching && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSearch(true)}
                                        className="border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300"
                                    >
                                        {t('networking.loadMore')}
                                    </Button>
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

            {/* Development Modal */}
            {/* <Modal
                isOpen={showDevModal}
                onClose={() => setShowDevModal(false)}
                title=""
                className="max-w-md"
            >
                <div className="flex flex-col items-center text-center p-6 space-y-6">
                    <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
                        <Construction className="h-10 w-10 text-indigo-600" />
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-slate-900">{t('networking.comingSoon.title')}</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {t('networking.comingSoon.description')}
                            <br />
                            <span className="text-sm text-slate-400 mt-2 block">{t('networking.comingSoon.note')}</span>
                        </p>
                    </div>

                    <Button
                        onClick={() => setShowDevModal(false)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-11 rounded-lg shadow-sm transition-all hover:shadow-md"
                    >
                        {t('networking.comingSoon.button')}
                    </Button>
                </div>
            </Modal> */}
        </div>
    );
}

