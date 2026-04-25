import { useMemo, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useUserStore } from "../../store/useUserStore";
import { Search, Loader2, User, Linkedin, Copy, Check, Sparkles, Building2, AlertCircle, Construction, MapPin, Users, Download, BriefcaseBusiness } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { searchGoogleBatch } from "../../services/search/serper";
// import { findCompanyDomain, getEmailPattern, findEmail, cleanName, generateEmail } from "../../services/emailService";
import {
    generateNetworkingQueries,
    generateNetworkingSequence,
    type NetworkingPersonalization,
    type NetworkingQueriesResponse,
    type NetworkingSequenceResponse,
} from "../../services/ai/gemini";
import { NetworkingGuide } from "./NetworkingGuide";
import { Modal } from "../ui/Modal";
import { InsufficientCreditsModal } from "../modals/InsufficientCreditsModal";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useTranslation } from "../../hooks/useTranslation";
import { downloadAsExcel } from "../../utils/excelExport";
import type { JobAnalysis, ParsedCV } from "../../types";
import {
    listNetworkingContacts,
    listNetworkingMessageHistory,
    makeJobKey,
    markNetworkingMessageCopied,
    type NetworkingContactRecord,
    type NetworkingContactStatus,
    type NetworkingMessageHistoryRecord,
    upsertNetworkingContact,
    updateNetworkingContact,
    insertNetworkingMessageHistory,
} from "../../services/networking/crm";
import {
    dedupeAndRankNetworkingProfiles,
    getFirstContactSuggestions,
    type NetworkingQualityProfile,
    type NetworkingSearchStrategy,
} from "../../services/networking/quality";
import { buildLinkedInSearchQueries, hasExplicitForeignLocation } from "../../services/networking/searchQueries";

interface Contact extends Partial<NetworkingQualityProfile> {
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
    searchQuerySource?: string;
}


type SearchStrategy = NetworkingSearchStrategy;

const CONTACT_OBJECTIVES: Array<{
    id: SearchStrategy;
    label: string;
    helper: string;
    icon: typeof Users;
    activeClass: string;
    hoverClass: string;
}> = [
        {
            id: "all",
            label: "Tous",
            helper: "Tous les contacts pertinents",
            icon: Users,
            activeClass: "bg-slate-900 border-slate-900 text-white shadow-sm",
            hoverClass: "hover:border-slate-300 hover:text-slate-900",
        },
        {
            id: "recruiter",
            label: "Recruteurs",
            helper: "Profils RH et Talent Acquisition",
            icon: Users,
            activeClass: "bg-pink-50 border-pink-200 text-pink-700 shadow-sm",
            hoverClass: "hover:border-pink-200 hover:text-pink-600",
        },
        {
            id: "hiring_manager",
            label: "Managers",
            helper: "Responsables, leads et directeurs",
            icon: BriefcaseBusiness,
            activeClass: "bg-purple-50 border-purple-200 text-purple-700 shadow-sm",
            hoverClass: "hover:border-purple-200 hover:text-purple-600",
        },
        {
            id: "peer",
            label: "Employés",
            helper: "Profils opérationnels proches du rôle",
            icon: Construction,
            activeClass: "bg-blue-50 border-blue-200 text-blue-700 shadow-sm",
            hoverClass: "hover:border-blue-200 hover:text-blue-600",
        },
    ];

// Badge Helpers
const getBadgeForContact = (contact: Contact) => {
    if (contact.persona === "recruiter") return { label: 'Recruteur', color: 'bg-pink-100 text-pink-700 border-pink-200' };
    if (contact.persona === "decision_maker") return { label: 'Manager', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (contact.persona === "peer") return { label: 'Employé', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (contact.persona === "insider") return { label: 'Employé', color: 'bg-blue-100 text-blue-700 border-blue-200' };

    const t = contact.title.toLowerCase();
    if (t.includes('senior') || t.includes('principal') || t.includes('staff')) return { label: 'Senior', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return null;
};

const matchesDisplayFilter = (contact: Contact, strategy: SearchStrategy) => {
    if (strategy === "all") return true;
    if (strategy === "recruiter") return contact.persona === "recruiter";
    if (strategy === "hiring_manager") return contact.persona === "decision_maker";
    if (strategy === "peer") return contact.persona === "peer" || contact.persona === "insider";
    if (strategy === "insider") return contact.persona === "insider";
    return true;
};

const STATUS_LABELS: Record<NetworkingContactStatus, string> = {
    to_contact: "À contacter",
    contacted: "Contacté",
    followed_up: "Relancé",
    replied: "Répondu",
    not_relevant: "Non pertinent",
};

const STATUS_HELPERS: Record<NetworkingContactStatus, string> = {
    to_contact: "Premier message à envoyer.",
    contacted: "Message envoyé, en attente de réponse.",
    followed_up: "Relance déjà envoyée.",
    replied: "Réponse reçue, pense à noter la suite.",
    not_relevant: "À sortir de ta priorité.",
};

const QUICK_TAGS = ["RH", "Décideur", "Prioritaire", "Referral", "Alumni"];

const getScoreBadgeClass = (score = 0) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 65) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
};

const getSuggestionHelperText = (strategy: SearchStrategy) => {
    if (strategy === "all") return "Tous les profils pertinents, triés par priorité.";
    if (strategy === "recruiter") return "Profils RH et recrutement les plus pertinents.";
    if (strategy === "hiring_manager") return "Managers et responsables les plus pertinents.";
    return "Employés proches du rôle ou de l'équipe ciblée.";
};

const getObjectiveLabel = (strategy: SearchStrategy) =>
    CONTACT_OBJECTIVES.find((objective) => objective.id === strategy)?.label || "Filtre réseau";

const enrichContacts = (contacts: Contact[], role: string, strategy: SearchStrategy, company = "", location = ""): Contact[] =>
    dedupeAndRankNetworkingProfiles(contacts, { role, company, location, strategy }).map((contact) => ({
        ...contact,
        link: contact.canonicalLinkedInUrl || contact.link,
    }));

const getFutureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
};

const buildCandidateOneLiner = (cvData: ParsedCV | null, role: string) => {
    if (!cvData) return "";
    if (cvData.headline?.trim()) return cvData.headline.trim();
    const mainSkill = cvData.skills?.slice(0, 3).join(", ");
    const target = role ? ` pour des postes ${role}` : "";
    return mainSkill ? `Profil orienté ${mainSkill}${target}.` : cvData.summary || "";
};

const buildNetworkingJobContext = (jobData: JobAnalysis | null, company: string, role: string) => {
    if (jobData?.description) return jobData.description;
    return `${company || ""} ${role || ""}`.trim();
};

export function NetworkingSearch() {
    const { t, language } = useTranslation();
    const { networking, setNetworkingState, cvData, jobData } = useAppStore();
    const { fetchCredits, credits } = useUserStore();

    // Derived state from store
    const { company, role, location, results, hasSearched } = networking;

    // Local UI state
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [showDevModal, setShowDevModal] = useState(false);
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    // Advanced Search State
    const [activeStrategy, setActiveStrategy] = useState<SearchStrategy>('all');
    // const [personaQueries, setPersonaQueries] = useState<{ [key in SearchStrategy]?: string[] }>({}); // Removed in favor of structured data
    const [aiSearchData, setAiSearchData] = useState<NetworkingQueriesResponse | null>(null);

    // Ensure results is treated as typed array even if store has any[]
    const typedResults = (results || []) as Contact[];
    const allRankedResults = enrichContacts(typedResults, role, "all", company, location);
    const rankedResults = allRankedResults.filter((contact) => matchesDisplayFilter(contact, activeStrategy));
    const firstContactSuggestions = getFirstContactSuggestions(rankedResults as Array<Contact & NetworkingQualityProfile>, 3, activeStrategy);

    // Modal State
    const [showGuide, setShowGuide] = useState(false);
    const [showDraft, setShowDraft] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);

    // Message Generation State
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
    const [sequence, setSequence] = useState<NetworkingSequenceResponse | null>(null);
    const [crmContact, setCrmContact] = useState<NetworkingContactRecord | null>(null);
    const [history, setHistory] = useState<NetworkingMessageHistoryRecord[]>([]);
    const [savedContacts, setSavedContacts] = useState<NetworkingContactRecord[]>([]);
    const [showSavedContacts, setShowSavedContacts] = useState(false);
    const [isLoadingSavedContacts, setIsLoadingSavedContacts] = useState(false);
    const [activeDraftTab, setActiveDraftTab] = useState<"sequence" | "history">("sequence");
    const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
    const [sequenceCopySuccessId, setSequenceCopySuccessId] = useState<string | null>(null);
    const [isSavingCrm, setIsSavingCrm] = useState(false);
    const [crmSaveMessage, setCrmSaveMessage] = useState<string | null>(null);
    const savedContactStats = useMemo(() => {
        const dueFollowUps = savedContacts.filter((contact) => {
            if (!contact.next_follow_up) return false;
            return new Date(contact.next_follow_up).getTime() <= Date.now();
        }).length;

        return {
            total: savedContacts.length,
            dueFollowUps,
            replied: savedContacts.filter((contact) => contact.status === "replied").length,
        };
    }, [savedContacts]);

    // Mini-CRM fields (editable)
    const [status, setStatus] = useState<NetworkingContactStatus>("to_contact");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");
    const [nextFollowUp, setNextFollowUp] = useState<string>("");

    // Personalization fields (proof-based)
    const [whyContact, setWhyContact] = useState("");
    const [oneLineAboutMe, setOneLineAboutMe] = useState("");
    const [objective, setObjective] = useState("");
    const [tone, setTone] = useState<NetworkingPersonalization["tone"]>("warm");
    const [proofPoints, setProofPoints] = useState("");

    const handleSearch = async (isLoadMore = false, strategyOverride?: SearchStrategy) => {
        if (!company && !role && !location) return;

            const strategyToUse = strategyOverride || "all";

            if (strategyOverride) setActiveStrategy(strategyOverride);

        if (!isSignedIn || !user) {
            setError(t('networking.signInRequired') || "Veuillez vous connecter pour effectuer une recherche.");
            return;
        }

        // The server performs the authoritative debit; this local check is only UX.
        if (credits < 1) {
            setShowCreditModal(true);
            return;
        }

        setIsSearching(true);
        setError(null);

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

            // 2. Multi-query Google dorking.
            // One strict query misses too many profiles; we combine complementary searches,
            // then dedupe/rank by role, company, persona and snippet quality.
            const queries = buildLinkedInSearchQueries({
                company,
                role,
                location,
                strategy: strategyToUse,
                aiData: currentAiData,
            });

            console.log("🔎 Expanded Networking Queries:", queries);

            // 3. Execution
            const startOffset = isLoadMore ? Math.floor(typedResults.length / Math.max(1, queries.length)) : 0;
            const perQueryLimit = isLoadMore ? 6 : 10;

            const searchResults = await searchGoogleBatch(
                queries.map(({ query, label }) => ({
                    query,
                    label,
                    num: perQueryLimit,
                    start: startOffset,
                })),
                token || undefined,
                language
            );
            if (searchResults.length === 0) {
                throw new Error("Aucun résultat exploitable sur les requêtes réseau élargies.");
            }

            const newContacts: Contact[] = searchResults.map((r) => ({
                name: r.title.split('|')[0].split('-')[0].trim(),
                title: r.title,
                link: r.link,
                snippet: r.snippet,
                emailStatus: 'idle' as const,
                searchQuerySource: r.queryLabel,
            })).filter((contact) => !hasExplicitForeignLocation(contact, location));

            let addedCount = 0;

            if (isLoadMore) {
                const combined = [...typedResults, ...newContacts];
                const unique = enrichContacts(combined, role, strategyToUse, company, location);
                addedCount = unique.length - typedResults.length;
                setNetworkingState({ results: unique });
            } else {
                const unique = enrichContacts(newContacts, role, strategyToUse, company, location);
                addedCount = unique.length;
                setNetworkingState({ results: unique });
            }
            setNetworkingState({ hasSearched: true });

            if (addedCount > 0) await fetchCredits(user.id, token || undefined);

        } catch (error) {
            console.error("Search failed:", error);
            if (error instanceof Error && /insufficient credits/i.test(error.message)) {
                setShowCreditModal(true);
            } else {
                setError(t('networking.searchError') || "Une erreur s'est produite lors de la recherche.");
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleStrategyClick = (s: SearchStrategy) => {
        if (activeStrategy === s) return;
        setActiveStrategy(s);
    };

    // const handleGuessEmail = async (_contactIndex: number) => {
    //     setShowDevModal(true);
    // };

    const parseTags = (raw: string) =>
        raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 20);

    const addQuickTag = (tag: string) => {
        const current = parseTags(tagsText);
        if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
        setTagsText([...current, tag].join(", "));
    };

    const openCrmForContact = async (contact: Contact) => {
        setSelectedContact(contact);
        setShowDraft(true);
        setActiveDraftTab("sequence");
        setSequence(null);
        setHistory([]);
        setCrmContact(null);
        setCopySuccessId(null);

        // Defaults: smart prefill based on current search
        setWhyContact(whyContact || `Je m'intéresse à ${company || "votre entreprise"} et j'aimerais avoir votre perspective.`);
        setOneLineAboutMe(oneLineAboutMe || buildCandidateOneLiner(cvData, role));
        setObjective(objective || "Obtenir 10 minutes d'échange pour un retour / conseil.");

        const token = await getToken({ template: "supabase" });
        if (!token || !user) return;

        const jobKey = makeJobKey({ company, title: role });
        const saved = await upsertNetworkingContact({
            token,
            userId: user.id,
            linkedinUrl: contact.link,
            jobKey,
            fullName: contact.name,
            title: contact.title,
            company: company || "",
            snippet: contact.snippet,
        });
        setCrmContact(saved);
        setStatus(saved.status);
        setTagsText((saved.tags || []).join(", "));
        setNotes(saved.notes || "");
        setNextFollowUp(saved.next_follow_up || "");

        const h = await listNetworkingMessageHistory({ token, contactId: saved.id });
        setHistory(h);
    };

    const saveCrmEdits = async () => {
        const token = await getToken({ template: "supabase" });
        if (!token || !user || !selectedContact) return;

        setIsSavingCrm(true);
        setCrmSaveMessage(null);
        try {
            const patch = {
                status,
                tags: parseTags(tagsText),
                notes,
                next_follow_up: nextFollowUp || null,
            };

            const updated = crmContact
                ? await updateNetworkingContact({
                    token,
                    contactId: crmContact.id,
                    patch,
                })
                : await upsertNetworkingContact({
                    token,
                    userId: user.id,
                    linkedinUrl: selectedContact.link,
                    jobKey: makeJobKey({ company, title: role }),
                    fullName: selectedContact.name,
                    title: selectedContact.title,
                    company: company || "",
                    snippet: selectedContact.snippet,
                    status,
                    tags: parseTags(tagsText),
                    notes,
                    nextFollowUp: nextFollowUp || null,
                });

            setCrmContact(updated);
            setStatus(updated.status);
            setTagsText((updated.tags || []).join(", "));
            setNotes(updated.notes || "");
            setNextFollowUp(updated.next_follow_up || "");
            setSavedContacts((contacts) => {
                const withoutCurrent = contacts.filter((c) => c.id !== updated.id);
                return [updated, ...withoutCurrent];
            });
            setCrmSaveMessage("Sauvegardé");
            setTimeout(() => setCrmSaveMessage(null), 2000);
        } catch (e) {
            console.error("CRM save failed", e);
            const msg = e instanceof Error ? e.message : "Erreur de sauvegarde";
            setCrmSaveMessage(`Erreur: ${msg}`);
        } finally {
            setIsSavingCrm(false);
        }
    };

    const handleGenerateSequence = async () => {
        if (!selectedContact || !user) return;
        const token = await getToken({ template: "supabase" });
        if (!token) return;

        setIsGeneratingSequence(true);
        setSequence(null);
        try {
            // Ensure CRM saved
            const jobKey = makeJobKey({ company, title: role });
            const saved = crmContact
                ? await updateNetworkingContact({
                    token,
                    contactId: crmContact.id,
                    patch: {
                        status,
                        tags: parseTags(tagsText),
                        notes,
                        next_follow_up: nextFollowUp || null,
                    },
                })
                : await upsertNetworkingContact({
                    token,
                    userId: user.id,
                    linkedinUrl: selectedContact.link,
                    jobKey,
                    fullName: selectedContact.name,
                    title: selectedContact.title,
                    company: company || "",
                    snippet: selectedContact.snippet,
                });
            setCrmContact(saved);

            const personalization: NetworkingPersonalization = {
                whyContact: whyContact.trim(),
                oneLineAboutMe: oneLineAboutMe.trim(),
                objective: objective.trim(),
                tone,
                proofPoints: parseTags(proofPoints),
            };

            const seq = await generateNetworkingSequence({
                cvData,
                jobDescription: buildNetworkingJobContext(jobData, company, role),
                contactName: selectedContact.name,
                contactRole: selectedContact.title,
                contactCompany: company || "",
                personalization,
                token,
            });
            setSequence(seq);

            // Persist messages in history (so "copié le ..." is tracked)
            const inserts: NetworkingMessageHistoryRecord[] = [];
            for (const m of seq.linkedin || []) {
                inserts.push(
                    await insertNetworkingMessageHistory({
                        token,
                        userId: user.id,
                        contactId: saved.id,
                        channel: "linkedin",
                        step: m.step,
                        content: m.message,
                        meta: { label: m.label, personalization },
                    })
                );
            }
            for (const m of seq.email || []) {
                inserts.push(
                    await insertNetworkingMessageHistory({
                        token,
                        userId: user.id,
                        contactId: saved.id,
                        channel: "email",
                        step: m.step,
                        content: m.subject ? `Objet: ${m.subject}\n\n${m.message}` : m.message,
                        meta: { label: m.label, subject: m.subject || null, personalization },
                    })
                );
            }
            setHistory((prev) => [...inserts, ...prev]);
            setActiveDraftTab("sequence");
        } catch (e) {
            console.error(e);
            const anyErr = e as { message?: unknown; error?: unknown };
            const msg =
                e instanceof Error
                    ? e.message
                    : typeof e === "string"
                        ? e
                        : typeof anyErr.message === "string"
                            ? anyErr.message
                            : typeof anyErr.error === "string"
                                ? anyErr.error
                                : (() => {
                                    try {
                                        return JSON.stringify(anyErr);
                                    } catch {
                                        return "Erreur inconnue";
                                    }
                                })();
            alert(`${t("networking.genError") || "Erreur de génération."}\n\nDétail: ${msg}`);
        } finally {
            setIsGeneratingSequence(false);
        }
    };

    const copyHistoryMessage = async (msg: NetworkingMessageHistoryRecord) => {
        await navigator.clipboard.writeText(msg.content);
        setCopySuccessId(msg.id);
        setTimeout(() => setCopySuccessId(null), 1500);
        try {
            const token = await getToken({ template: "supabase" });
            if (!token) return;
            const updated = await markNetworkingMessageCopied({ token, messageId: msg.id });
            setHistory((h) => h.map((x) => (x.id === updated.id ? updated : x)));
        } catch (e) {
            console.warn("Failed to mark copied_at", e);
        }
    };

    const copySequenceMessage = async (args: {
        id: string;
        channel: "linkedin" | "email";
        step: number;
        content: string;
    }) => {
        const match = history.find(
            (h) => h.channel === args.channel && h.step === args.step && h.content.trim() === args.content.trim()
        );
        if (match) {
            await copyHistoryMessage(match);
        } else {
            await navigator.clipboard.writeText(args.content);
        }
        setSequenceCopySuccessId(args.id);
        setTimeout(() => setSequenceCopySuccessId(null), 1500);
    };

    const contactFromSavedRecord = (record: NetworkingContactRecord): Contact => ({
        name: record.full_name || "Contact sauvegardé",
        title: record.title || record.company || "Contact réseau",
        link: record.linkedin_url,
        snippet: record.snippet || record.notes || "",
        emailStatus: "idle",
    });

    const refreshSavedContacts = async () => {
        const token = await getToken({ template: "supabase" });
        if (!token) return;
        setIsLoadingSavedContacts(true);
        try {
            const contacts = await listNetworkingContacts({ token });
            setSavedContacts(contacts);
            setShowSavedContacts(true);
        } catch (e) {
            console.error("Failed to load saved networking contacts", e);
            setError("Impossible de charger vos contacts sauvegardés.");
        } finally {
            setIsLoadingSavedContacts(false);
        }
    };

    const openSavedContact = async (record: NetworkingContactRecord) => {
        await openCrmForContact(contactFromSavedRecord(record));
    };

    const handleDownloadExcel = () => {
        if (!rankedResults || rankedResults.length === 0) return;

        const dataToExport = rankedResults.map(contact => {
            // Smart Name Split (Basic heuristic: First word = First Name, Rest = Last Name)
            const nameParts = contact.name.trim().split(' ');
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(' ') || "";

            return {
                "Prénom": firstName,
                "Nom": lastName,
                "Titre (Job)": contact.title,
                "Entreprise Visée": company || "Non spécifié",
                "Filtre réseau": getObjectiveLabel(activeStrategy),
                "Score pertinence": contact.relevanceScore || "",
                "Priorité": contact.priorityLabel || "",
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
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Filtre :</span>
                                {CONTACT_OBJECTIVES.map((objective) => {
                                    const Icon = objective.icon;
                                    const isActive = activeStrategy === objective.id;
                                    return (
                                        <button
                                            key={objective.id}
                                            type="button"
                                            onClick={() => handleStrategyClick(objective.id)}
                                            title={objective.helper}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${isActive ? objective.activeClass : `bg-white border-slate-200 text-slate-600 ${objective.hoverClass}`}`}
                                        >
                                            <Icon className="w-3 h-3" /> {objective.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Saved Contacts - independent from current search */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900">Mes contacts suivis</h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Retrouve ici tous tes contacts sauvegardés, même si tu changes d’entreprise ou de recherche.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={showSavedContacts ? () => setShowSavedContacts(false) : refreshSavedContacts}
                                    isLoading={isLoadingSavedContacts}
                                    className="bg-white"
                                >
                                    {showSavedContacts ? "Masquer" : "Voir mes contacts"}
                                </Button>
                            </div>

                            {showSavedContacts && (
                                <div className="mt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                        <div className="bg-white border border-indigo-100 rounded-lg p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Contacts suivis</div>
                                            <div className="mt-1 text-xl font-bold text-slate-900">{savedContactStats.total}</div>
                                        </div>
                                        <div className="bg-white border border-amber-100 rounded-lg p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Relances dues</div>
                                            <div className="mt-1 text-xl font-bold text-amber-700">{savedContactStats.dueFollowUps}</div>
                                        </div>
                                        <div className="bg-white border border-emerald-100 rounded-lg p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Réponses</div>
                                            <div className="mt-1 text-xl font-bold text-emerald-700">{savedContactStats.replied}</div>
                                        </div>
                                    </div>
                                    {savedContacts.length === 0 ? (
                                        <div className="text-sm text-slate-500 bg-white border border-dashed border-indigo-100 rounded-lg p-4">
                                            Aucun contact sauvegardé pour le moment. Ouvre un profil, ajoute un statut ou une note, puis clique sur Enregistrer.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {savedContacts.map((contact) => (
                                                <button
                                                    key={contact.id}
                                                    type="button"
                                                    onClick={() => openSavedContact(contact)}
                                                    className="text-left p-4 bg-white border border-indigo-100 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-slate-900 truncate">
                                                                {contact.full_name || "Contact sauvegardé"}
                                                            </div>
                                                            <div className="text-xs text-slate-500 line-clamp-1 mt-1">
                                                                {contact.title || contact.company || "Contact réseau"}
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 flex-shrink-0">
                                                            {STATUS_LABELS[contact.status]}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {(contact.tags || []).slice(0, 4).map((tag) => (
                                                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {contact.next_follow_up ? (
                                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
                                                                Relance: {new Date(contact.next_follow_up).toLocaleDateString()}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Results List */}
                        <div className="space-y-4 pt-2">
                            {hasSearched && rankedResults.length === 0 && !isSearching ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">{t('networking.noResults')}</p>
                                    <p className="text-xs text-slate-400 mt-2">Essayez d'élargir la localisation ou de changer d'objectif réseau.</p>
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
                                    {firstContactSuggestions.length > 0 && (
                                        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">Qui contacter en premier</h3>
                                                    <p className="text-xs text-slate-500 mt-1">{getSuggestionHelperText(activeStrategy)}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {firstContactSuggestions.map((contact, suggestionIndex) => (
                                                    <button
                                                        key={contact.dedupeKey || contact.link || suggestionIndex}
                                                        type="button"
                                                        onClick={() => openCrmForContact(contact)}
                                                        className="text-left bg-white border border-indigo-100 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                                                            {suggestionIndex + 1}. {contact.priorityLabel || "Contact prioritaire"}
                                                        </div>
                                                        <div className="mt-1 font-semibold text-slate-900 truncate">{contact.name}</div>
                                                        <div className="mt-1 text-xs text-slate-500 line-clamp-2">{contact.title}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rankedResults.map((contact, idx) => {
                                            const badge = getBadgeForContact(contact);
                                            return (
                                                <div key={contact.dedupeKey || contact.link || idx} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full relative overflow-hidden">
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
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${getScoreBadgeClass(contact.relevanceScore)}`}>
                                                                        Score {contact.relevanceScore ?? 0}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">{contact.title}</p>
                                                                {/* Snippet validation / cleanup if needed */}
                                                                <p className="text-xs text-slate-400 line-clamp-1 mt-1">{contact.snippet.replace(/\s\.\.\./g, '')}</p>
                                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                                    {contact.priorityLabel ? (
                                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                                                                            {contact.priorityLabel}
                                                                        </span>
                                                                    ) : null}
                                                                    {(contact.scoreReasons || []).map((reason) => (
                                                                        <span key={reason} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                                                                            {reason}
                                                                        </span>
                                                                    ))}
                                                                </div>

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
                                                            onClick={() => openCrmForContact(contact)}
                                                        >
                                                            {t('networking.draftMessage') || "Générer séquence"}
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
                            {hasSearched && rankedResults.length > 0 && !isSearching && (
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
                title={selectedContact ? `Plan d’action réseau — ${selectedContact.name}` : (t('networking.draftTitle') || "Réseautage")}
                className="max-w-5xl"
            >
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    {selectedContact && (
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Contact sélectionné</div>
                                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900">{selectedContact.name}</span>
                                        <span className="text-xs bg-white border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                            {STATUS_LABELS[status]}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{selectedContact.title}</p>
                                    <a
                                        href={selectedContact.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                    >
                                        <Linkedin className="h-3.5 w-3.5" />
                                        Ouvrir le profil LinkedIn
                                    </a>
                                </div>
                                <div className="text-xs text-slate-500 md:text-right max-w-xs">
                                    Suis ton avancement ici, génère une séquence, puis retrouve tout dans l’historique.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Left: CRM */}
                        <div className="space-y-4 lg:col-span-1">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-semibold text-indigo-600">Étape 1</div>
                                            <h4 className="font-semibold text-slate-900">Suivre le contact</h4>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={saveCrmEdits} isLoading={isSavingCrm}>
                                            {crmSaveMessage === "Sauvegardé" ? "Sauvegardé" : "Enregistrer"}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">Mets à jour où tu en es et la prochaine action.</p>
                                </div>
                                {crmSaveMessage && (
                                    <div className={`text-xs rounded-md px-2 py-1 ${crmSaveMessage === "Sauvegardé"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                        : "bg-red-50 text-red-700 border border-red-100"
                                        }`}>
                                        {crmSaveMessage}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Statut</Label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as NetworkingContactStatus)}
                                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        <option value="to_contact">À contacter</option>
                                        <option value="contacted">Contacté</option>
                                        <option value="followed_up">Relancé</option>
                                        <option value="replied">Répondu</option>
                                        <option value="not_relevant">Non pertinent</option>
                                    </select>
                                    <p className="text-xs text-slate-500">{STATUS_HELPERS[status]}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <Input
                                        value={tagsText}
                                        onChange={(e) => setTagsText(e.target.value)}
                                        placeholder="ex: RH, prioritaire, referral"
                                        className="bg-white"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_TAGS.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => addQuickTag(tag)}
                                                className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-colors"
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Prochaine relance</Label>
                                    <Input
                                        type="date"
                                        value={nextFollowUp}
                                        onChange={(e) => setNextFollowUp(e.target.value)}
                                        className="bg-white"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        <button type="button" onClick={() => setNextFollowUp(getFutureDate(3))} className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                                            J+3
                                        </button>
                                        <button type="button" onClick={() => setNextFollowUp(getFutureDate(7))} className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                                            J+7
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="ex: a commenté tel post, profil intéressant pour…"
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: Sequence + History */}
                        <div className="space-y-4 lg:col-span-2">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <div className="text-xs font-semibold text-indigo-600">Étape 2</div>
                                        <h4 className="font-semibold text-slate-900">Personnaliser l’approche</h4>
                                        <p className="text-xs text-slate-500 mt-1">Plus tu ajoutes de contexte, plus les messages seront naturels.</p>
                                    </div>
                                    <Button
                                        onClick={handleGenerateSequence}
                                        disabled={isGeneratingSequence || !selectedContact}
                                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {isGeneratingSequence ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Générer mes 6 messages
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Pourquoi je contacte</Label>
                                        <Textarea value={whyContact} onChange={(e) => setWhyContact(e.target.value)} placeholder="ex: comprendre l’équipe, obtenir un retour, préparer une candidature..." className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>1 ligne sur moi</Label>
                                        <Textarea value={oneLineAboutMe} onChange={(e) => setOneLineAboutMe(e.target.value)} placeholder="ex: Je suis développeur React avec 3 ans d’expérience SaaS." className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Objectif</Label>
                                        <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="ex: Obtenir 10 minutes d’échange" className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ton</Label>
                                        <select
                                            value={tone}
                                            onChange={(e) => setTone(e.target.value as NetworkingPersonalization["tone"])}
                                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                        >
                                            <option value="direct">Direct</option>
                                            <option value="warm">Chaleureux</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Preuves (séparées par des virgules)</Label>
                                        <Input
                                            value={proofPoints}
                                            onChange={(e) => setProofPoints(e.target.value)}
                                            placeholder="ex: j'ai construit X, projet Y, métrique Z"
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Tabs
                                defaultValue="sequence"
                                value={activeDraftTab}
                                onValueChange={(v) => setActiveDraftTab(v as "sequence" | "history")}
                            >
                                <TabsList className="w-full justify-start">
                                    <TabsTrigger value="sequence">Étape 3 · Messages</TabsTrigger>
                                    <TabsTrigger value="history">Historique & copies</TabsTrigger>
                                </TabsList>

                                <TabsContent value="sequence" className="mt-4">
                                    {!sequence && !isGeneratingSequence ? (
                                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6">
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-sm">3</div>
                                                <div>
                                                    <h5 className="font-semibold text-slate-900">Prêt à générer ta séquence</h5>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        Clique sur <span className="font-semibold">“Générer mes 6 messages”</span> pour obtenir LinkedIn + Email, avec 2 relances prêtes à copier.
                                                    </p>
                                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                                                        <div className="bg-white border border-slate-200 rounded-lg p-2">1 approche</div>
                                                        <div className="bg-white border border-slate-200 rounded-lg p-2">2 relances</div>
                                                        <div className="bg-white border border-slate-200 rounded-lg p-2">Historique de copie</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {isGeneratingSequence ? (
                                        <div className="py-8 text-center text-slate-500">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                                            <p>{t('networking.writing') || "Rédaction en cours..."}</p>
                                        </div>
                                    ) : null}

                                    {sequence ? (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h5 className="font-semibold text-slate-900">LinkedIn</h5>
                                                <div className="space-y-3">
                                                    {sequence.linkedin.map((m) => (
                                                        <div key={`li-${m.step}`} className="p-4 bg-white border border-slate-200 rounded-xl">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="text-sm font-semibold text-slate-800">{m.label}</div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => copySequenceMessage({
                                                                        id: `linkedin-${m.step}`,
                                                                        channel: "linkedin",
                                                                        step: m.step,
                                                                        content: m.message,
                                                                    })}
                                                                    className="gap-2"
                                                                >
                                                                    {sequenceCopySuccessId === `linkedin-${m.step}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                                    {sequenceCopySuccessId === `linkedin-${m.step}` ? "Copié" : "Copier"}
                                                                </Button>
                                                            </div>
                                                            <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                                {m.message}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h5 className="font-semibold text-slate-900">Email</h5>
                                                <div className="space-y-3">
                                                    {sequence.email.map((m) => (
                                                        <div key={`em-${m.step}`} className="p-4 bg-white border border-slate-200 rounded-xl">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="text-sm font-semibold text-slate-800">{m.label}</div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={async () => {
                                                                        const text = m.subject ? `Objet: ${m.subject}\n\n${m.message}` : m.message;
                                                                        await copySequenceMessage({
                                                                            id: `email-${m.step}`,
                                                                            channel: "email",
                                                                            step: m.step,
                                                                            content: text,
                                                                        });
                                                                    }}
                                                                    className="gap-2"
                                                                >
                                                                    {sequenceCopySuccessId === `email-${m.step}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                                    {sequenceCopySuccessId === `email-${m.step}` ? "Copié" : "Copier"}
                                                                </Button>
                                                            </div>
                                                            {m.subject ? (
                                                                <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded p-2">
                                                                    Objet: {m.subject}
                                                                </div>
                                                            ) : null}
                                                            <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                                {m.message}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </TabsContent>

                                <TabsContent value="history" className="mt-4">
                                    {history.length === 0 ? (
                                        <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6">
                                            Aucun message généré pour ce contact pour l’instant.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {history.map((h) => (
                                                <div key={h.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-xs text-slate-500">
                                                                <span className="font-semibold uppercase">{h.channel}</span>
                                                                <span className="mx-2">•</span>
                                                                Step {h.step}
                                                                <span className="mx-2">•</span>
                                                                Généré le {new Date(h.created_at).toLocaleString()}
                                                                {h.copied_at ? (
                                                                    <>
                                                                        <span className="mx-2">•</span>
                                                                        Copié le {new Date(h.copied_at).toLocaleString()}
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyHistoryMessage(h)}
                                                            className="gap-2 flex-shrink-0"
                                                        >
                                                            {copySuccessId === h.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                            {copySuccessId === h.id ? "Copié" : "Copier"}
                                                        </Button>
                                                    </div>
                                                    <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                        {h.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
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