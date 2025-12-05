import { useState } from "react";
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
import { useUser } from "@clerk/clerk-react";

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
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Contact[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isSignedIn, user } = useUser();

    // Modal State
    const [showGuide, setShowGuide] = useState(false);
    const [showDraft, setShowDraft] = useState(false);

    // Message Generation State
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleSearch = async (isLoadMore = false) => {
        if (!company && !role) return;

        // Check API key before attempting search
        const apiKey = import.meta.env.VITE_SERPER_API_KEY;
        if (!apiKey) {
            setError("⚠️ Clé API Serper manquante. Veuillez ajouter VITE_SERPER_API_KEY dans votre fichier .env et redémarrer le serveur.");
            setHasSearched(true);
            setResults([]);
            return;
        }

        setIsSearching(true);
        setError(null);

        if (!isLoadMore) {
            setResults([]);
        }

        try {
            // Smart queries with Gemini
            let queries = [`site:linkedin.com/in/ ${role} ${company}`];
            try {
                const response = await generateNetworkingQueries(company, role);
                if (response && response.queries && response.queries.length > 0) {
                    queries = response.queries;
                }
            } catch (e) {
                console.warn("Gemini query generation failed, using fallback", e);
            }

            // Use the first query
            const queryToUse = queries[0];
            const searchResults = await searchGoogle(queryToUse);

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
                setResults(prev => {
                    const combined = [...prev, ...newContacts];
                    return combined.filter((c, i, self) => self.findIndex(t => t.link === c.link) === i);
                });
            } else {
                setResults(newContacts);
            }
            setHasSearched(true);

        } catch (error) {
            console.error("Search failed:", error);
            setError("Une erreur s'est produite lors de la recherche.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleGuessEmail = async (contactIndex: number) => {
        const contact = results[contactIndex];
        if (!contact || !company) return;

        if (!isSignedIn || !user) {
            alert("Veuillez vous connecter pour utiliser cette fonctionnalité.");
            return;
        }

        const newResults = [...results];
        newResults[contactIndex] = { ...contact, emailStatus: 'loading' };
        setResults(newResults);

        try {
            const domain = await findCompanyDomain(company);
            if (!domain) throw new Error("Domaine introuvable");

            const pattern = await getEmailPattern(domain);

            const cleanedName = cleanName(contact.name);
            const nameParts = cleanedName.split(" ");
            const first = nameParts[0];
            const last = nameParts.slice(1).join(" ");

            let emailFound = undefined;
            let score = undefined;

            if (first && last) {
                // Try to find exact email
                const result = await findEmail(first, last, domain);
                if (result) {
                    emailFound = result.email;
                    score = result.score;
                } else if (pattern) {
                    // Generate based on pattern
                    emailFound = generateEmail(first, last, pattern, domain);
                }
            }

            const updatedResults = [...results];
            updatedResults[contactIndex] = {
                ...contact,
                emailStatus: 'success',
                email: emailFound || undefined, // Ensure undefined if null
                emailConfidence: score,
                emailPattern: pattern || undefined,
                domain: domain
            };
            setResults(updatedResults);

        } catch (error) {
            console.error(error);
            const updatedResults = [...results];
            updatedResults[contactIndex] = { ...contact, emailStatus: 'error' };
            setResults(updatedResults);
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
            setGeneratedMessage("Error generating message. Please try again.");
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
                    <h2 className="text-3xl font-bold text-slate-900">Enterprise Networking</h2>
                    <p className="text-slate-600 text-lg">Find the right people and connect with confidence.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowGuide(true)}
                    className="flex items-center gap-2"
                >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Networking Guide
                </Button>
            </div>

            {/* Main Search Panel - Full Width */}
            <div className="w-full">
                <Card className="bg-white border-slate-200 shadow-sm h-full">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <Search className="w-5 h-5 text-indigo-600" />
                            Search Criteria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Target Company</Label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder="e.g. Netflix"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Target Role / Keyword</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder="e.g. Recruiter, Engineering Manager"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
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
                            {isSearching ? "Searching..." : "Find Key Contacts"}
                        </Button>

                        {/* Results List */}
                        <div className="space-y-4 pt-2">
                            {hasSearched && results.length === 0 && !isSearching ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">No results found. Try broader terms.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.map((contact, idx) => (
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
                                                            <Linkedin className="h-3 w-3" /> View Profile
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
                                                            <Loader2 className="h-3 w-3 animate-spin mr-1" /> Finding email...
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleGuessEmail(idx)}
                                                            className="text-xs text-slate-500 h-7"
                                                        >
                                                            Find Email
                                                        </Button>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs border-slate-200 hover:bg-slate-50"
                                                    onClick={() => handleGenerateMessage(contact)}
                                                >
                                                    Draft Message
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
                title="Networking Guide & Templates"
                className="max-w-4xl"
            >
                <NetworkingGuide />
            </Modal>

            {/* Draft Message Modal */}
            <Modal
                isOpen={showDraft}
                onClose={() => setShowDraft(false)}
                title={selectedContact ? `Draft Message for ${selectedContact.name}` : "Draft Message"}
                className="max-w-2xl"
            >
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {selectedContact && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800">
                            Drafting for: <span className="font-bold">{selectedContact.name}</span>
                        </div>
                    )}

                    {isGeneratingMessage ? (
                        <div className="py-8 text-center text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                            <p>Writing personalized message...</p>
                        </div>
                    ) : generatedMessage ? (
                        <>
                            <div className="p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                                {generatedMessage}
                            </div>
                            <Button onClick={copyToClipboard} className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800">
                                {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copySuccess ? "Copied!" : "Copy to Clipboard"}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowDraft(false)} className="w-full text-xs text-slate-400">
                                Close
                            </Button>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            {selectedContact && (
                                <Button onClick={() => handleGenerateMessage(selectedContact)}>Generate Now</Button>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}
        </div>
    );
}
