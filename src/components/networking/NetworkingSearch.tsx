import { useState } from "react";
import { useUserStore } from "../../store/useUserStore";
import { Search, Loader2, User, ExternalLink, MapPin, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { searchGoogle } from "../../services/search/serper";
import { findCompanyDomain, getEmailPattern, findEmail, cleanName, formatEmailPattern } from "../../services/emailService";
import { generateNetworkingQueries } from "../../services/ai/gemini";
import { Mail, Copy, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { NetworkingGuide } from "./NetworkingGuide";
import { SignInButton, useUser, useAuth } from "@clerk/clerk-react";

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
    const [location, setLocation] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Contact[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const RESULTS_PER_PAGE = 10;
    const { useCredit, credits } = useUserStore();

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

        const result = await useCredit(user.id, 1, token || undefined, user.primaryEmailAddress?.emailAddress);

        if (!result.success) {
            if (result.error === 'insufficient_funds_local' || result.error === 'insufficient_funds_server') {
                alert(`Crédits épuisés (${credits}). Passez à la version Pro pour continuer.`);
            } else {
                console.error("Credit error:", result.error);
                alert(`Une erreur est survenue lors de la vérification des crédits (${result.error}). Veuillez réessayer.`);
            }
            return;
        }

        setIsSearching(true);
        setError(null); // Reset error on new search
        if (!isLoadMore) {
            setResults([]);
            setPage(0);
            setHasSearched(true);
        }

        try {
            let queries: string[] = [];

            // 1. Generate Smart Queries using Gemini
            if (!isLoadMore) {
                try {
                    console.log("🧠 Generating smart queries with Gemini...");
                    const smartSearch = await generateNetworkingQueries(company, role, location);
                    queries = smartSearch.queries;
                    console.log("✅ Smart Queries Generated:", queries);
                } catch (e) {
                    console.error("❌ Smart search generation failed, falling back to basic search", e);
                    // Fallback to basic query construction
                    const parts = ["site:linkedin.com/in/"];
                    if (company) parts.push(`"${company}"`);
                    if (role) parts.push(`(${role.replace(/\s+or\s+/gi, " OR ")})`);
                    if (location) parts.push(location);
                    queries = [parts.join(" ")];
                    console.log("🔄 Fallback Query:", queries);
                }
            } else {
                // For load more, we might need to store the queries in state to paginate through them
                // For simplicity in this iteration, we'll just re-generate or use a basic query
                const parts = ["site:linkedin.com/in/"];
                if (company) parts.push(`"${company}"`);
                if (role) parts.push(`(${role.replace(/\s+or\s+/gi, " OR ")})`);
                if (location) parts.push(location);
                queries = [parts.join(" ")];
            }

            // 2. Execute searches (parallel or sequential)
            // We'll take the first query for now, or combine results from multiple
            // To avoid burning too many API credits, let's start with the first 2 queries if available
            const queriesToRun = queries.slice(0, 2);
            let allContacts: Contact[] = [];

            console.log(`🔍 Executing ${queriesToRun.length} search queries...`);

            for (const query of queriesToRun) {
                const start = isLoadMore ? (page + 1) * RESULTS_PER_PAGE : 0;
                console.log(`📡 Searching: "${query}" (start: ${start}, num: ${RESULTS_PER_PAGE})`);

                const searchResults = await searchGoogle(query, RESULTS_PER_PAGE, start);
                console.log(`📊 Results received: ${searchResults.length} contacts`);

                if (searchResults && searchResults.length > 0) {
                    const contacts = searchResults.map(r => {
                        const titleParts = r.title.split(" - ");
                        const name = cleanName(titleParts[0] || "Unknown Name");
                        const jobTitle = titleParts[1] || "Unknown Title";
                        return {
                            name: name,
                            title: jobTitle,
                            link: r.link,
                            snippet: r.snippet
                        };
                    });
                    allContacts = [...allContacts, ...contacts];
                }
            }

            // 3. Deduplicate
            const uniqueContacts = allContacts.filter((contact, index, self) =>
                index === self.findIndex((t) => t.link === contact.link)
            );

            // Filter against existing results
            const newUniqueContacts = uniqueContacts.filter(contact =>
                !results.some(existing => existing.link === contact.link)
            );

            console.log(`✅ Final results: ${newUniqueContacts.length} unique contacts`);

            if (isLoadMore) {
                setResults(prev => [...prev, ...newUniqueContacts]);
                setPage(prev => prev + 1);
            } else {
                setResults(newUniqueContacts);
            }

            // If no results found, set a helpful message
            if (newUniqueContacts.length === 0 && !isLoadMore) {
                setError("Aucun résultat trouvé. Essayez d'élargir vos critères de recherche ou vérifiez l'orthographe du nom de l'entreprise.");
            }

        } catch (error) {
            console.error("❌ Networking search failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite lors de la recherche";
            setError(`Erreur de recherche: ${errorMessage}`);
            if (!isLoadMore) {
                setResults([]);
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleGuessEmail = async (contactIndex: number) => {
        const contact = results[contactIndex];
        if (!contact || !company) return;

        // Update status to loading
        setResults(prev => {
            const newResults = [...prev];
            newResults[contactIndex] = { ...newResults[contactIndex], emailStatus: 'loading' };
            return newResults;
        });

        try {
            // 1. Find domain
            const domain = await findCompanyDomain(company);
            if (!domain) throw new Error("Domaine introuvable");

            // 3. Find Email using Hunter.io (Priority)
            // Split name into first and last
            const nameParts = contact.name.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            let email: string | undefined;
            let confidence: number | undefined;
            let emailPattern: string | undefined;

            // Try to find verified email first
            const finderResult = await findEmail(firstName, lastName, domain);

            if (finderResult) {
                email = finderResult.email;
                confidence = finderResult.score;
            } else {
                // Fallback: Get pattern but do NOT generate email
                const pattern = await getEmailPattern(domain);
                if (pattern) {
                    emailPattern = pattern;
                }
            }

            if (!email && !emailPattern) {
                throw new Error("Impossible de trouver l'email ou le pattern");
            }

            // Update result
            console.log(`Setting result for contact ${contactIndex}: email=${email}, pattern=${emailPattern}`);
            setResults(prev => {
                const newResults = [...prev];
                newResults[contactIndex] = {
                    ...newResults[contactIndex],
                    email: email,
                    emailPattern: emailPattern,
                    domain: domain,
                    emailStatus: 'success',
                    emailConfidence: confidence
                };
                return newResults;
            });

        } catch (error) {
            console.error("Email prediction failed:", error);
            setResults(prev => {
                const newResults = [...prev];
                newResults[contactIndex] = { ...newResults[contactIndex], emailStatus: 'error' };
                return newResults;
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6 animate-fade-in">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                    Networking Assistant
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Trouvez les bonnes personnes et utilisez les bonnes approches pour booster votre carrière.
                </p>
            </div>

            <Tabs defaultValue="search" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="search">Recherche</TabsTrigger>
                        <TabsTrigger value="guide">Stratégies & Modèles</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="search" className="space-y-8">
                    <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-600">
                                <Search className="h-5 w-5" />
                                Search Criteria
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="company">Target Company</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="company"
                                            placeholder="e.g. Google, McKinsey"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Target Role / Keyword</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="role"
                                            placeholder="e.g. Recruiter or CTO"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location (Optional)</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="location"
                                            placeholder="e.g. Paris"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                                {isSignedIn ? (
                                    <Button
                                        onClick={() => handleSearch(false)}
                                        disabled={isSearching || (!company && !role)}
                                        className="w-full md:w-auto md:min-w-[200px] h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        {isSearching && !hasSearched ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Searching LinkedIn...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="mr-2 h-4 w-4" />
                                                Find Contacts
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <SignInButton mode="modal">
                                        <Button
                                            className="w-full md:w-auto md:min-w-[200px] h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg shadow-slate-900/25 transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            Se connecter pour chercher
                                        </Button>
                                    </SignInButton>
                                )}
                                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                                    <Sparkles className="h-3 w-3" />
                                    Powered by AI Smart Search
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center animate-fade-in border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {results.map((contact, index) => (
                            <Card key={index} className="overflow-hidden border-slate-200 hover:border-indigo-200 transition-colors duration-300 group">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {contact.name}
                                                    </h3>
                                                    <p className="text-indigo-600 font-medium">{contact.title}</p>
                                                </div>
                                                <a
                                                    href={contact.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg"
                                                >
                                                    <ExternalLink className="h-5 w-5" />
                                                </a>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                {contact.snippet}
                                            </p>

                                            {/* Email Prediction Section */}
                                            <div className="pt-4 flex items-center gap-3">
                                                {contact.email ? (
                                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-100">
                                                        <Mail className="h-4 w-4" />
                                                        {contact.email}
                                                        {contact.emailConfidence !== undefined && (
                                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${contact.emailConfidence > 80 ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                                                                {contact.emailConfidence}%
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => copyToClipboard(contact.email!)}
                                                            className="ml-2 p-1 hover:bg-green-100 rounded-md transition-colors"
                                                            title="Copy email"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ) : contact.emailPattern ? (
                                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
                                                        <Sparkles className="h-4 w-4" />
                                                        <span>Pattern: {formatEmailPattern(contact.emailPattern)}@{contact.domain}</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleGuessEmail(index)}
                                                        disabled={contact.emailStatus === 'loading'}
                                                        className="text-xs h-8"
                                                    >
                                                        {contact.emailStatus === 'loading' ? (
                                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                        ) : (
                                                            <Mail className="h-3 w-3 mr-1" />
                                                        )}
                                                        Find Email
                                                    </Button>
                                                )}
                                                {contact.emailStatus === 'error' && (
                                                    <span className="text-xs text-red-500">Not found</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {results.length > 0 && (
                        <div className="flex justify-center pt-8">
                            <Button
                                variant="outline"
                                onClick={() => handleSearch(true)}
                                disabled={isSearching}
                                className="min-w-[200px]"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading more...
                                    </>
                                ) : (
                                    "Load More Results"
                                )}
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="guide">
                    <NetworkingGuide />
                </TabsContent>
            </Tabs>
        </div>
    );
}
