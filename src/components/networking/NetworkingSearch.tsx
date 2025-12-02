import { useState } from "react";
import { Search, Loader2, User, ExternalLink, MapPin, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { searchGoogle } from "../../services/search/serper";
import { findCompanyDomain, getEmailPattern, generateEmail } from "../../services/emailService";
import { Mail, Copy } from "lucide-react";

interface Contact {
    name: string;
    title: string;
    link: string;
    snippet: string;
    email?: string;
    emailStatus?: 'idle' | 'loading' | 'success' | 'error';
    emailConfidence?: number;
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
    const RESULTS_PER_PAGE = 10;

    const handleSearch = async (isLoadMore = false) => {
        if (!company && !role) return;

        setIsSearching(true);
        setError(null); // Reset error on new search
        if (!isLoadMore) {
            setResults([]);
            setPage(0);
            setHasSearched(true);
        }

        try {
            // Construct a targeted LinkedIn search query
            // site:linkedin.com/in/ Company Role Location
            // We remove quotes to allow for broader matching (fuzzy search)
            const parts = ["site:linkedin.com/in/"];

            if (company) {
                parts.push(company);
            }

            if (role) {
                // Replace " or " with " OR " for Google search operator
                const optimizedRole = role.replace(/\s+or\s+/gi, " OR ");
                parts.push(`(${optimizedRole})`);
            }

            if (location) {
                parts.push(location);
            }

            const query = parts.join(" ");
            console.log("Networking Query:", query); // Debug log

            const start = isLoadMore ? (page + 1) * RESULTS_PER_PAGE : 0;
            console.log("Searching with start:", start, "num:", RESULTS_PER_PAGE); // Debug log
            const searchResults = await searchGoogle(query, RESULTS_PER_PAGE, start);
            console.log("Search results count:", searchResults?.length || 0); // Debug log

            if (searchResults && searchResults.length > 0) {
                const contacts: Contact[] = searchResults.map(r => {
                    // Try to extract name and title from the search result title
                    // Format is often: "Name - Title - Company | LinkedIn"
                    const titleParts = r.title.split(" - ");
                    const name = titleParts[0] || "Unknown Name";
                    const jobTitle = titleParts[1] || "Unknown Title";

                    return {
                        name: name,
                        title: jobTitle,
                        link: r.link,
                        snippet: r.snippet
                    };
                });

                if (isLoadMore) {
                    setResults(prev => [...prev, ...contacts]);
                    setPage(prev => prev + 1);
                } else {
                    setResults(contacts);
                }
            } else {
                // No results found
                console.warn("No results returned from Serper API");
                if (!isLoadMore) {
                    setResults([]);
                }
            }
        } catch (error) {
            console.error("Networking search failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite lors de la recherche";
            setError(errorMessage);
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
        const newResults = [...results];
        newResults[contactIndex] = { ...contact, emailStatus: 'loading' };
        setResults(newResults);

        try {
            // 1. Find domain
            const domain = await findCompanyDomain(company);
            if (!domain) throw new Error("Domaine introuvable");

            // 2. Get pattern
            const pattern = await getEmailPattern(domain);
            if (!pattern) throw new Error("Pattern email introuvable");

            // 3. Generate email
            // Split name into first and last
            const nameParts = contact.name.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            const email = generateEmail(firstName, lastName, pattern, domain);

            // Update result
            newResults[contactIndex] = {
                ...contact,
                email: email,
                emailStatus: 'success'
            };
            setResults(newResults);

        } catch (error) {
            console.error("Email prediction failed:", error);
            newResults[contactIndex] = { ...contact, emailStatus: 'error' };
            setResults(newResults);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6 animate-fade-in">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                    Networking Assistant
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Find and connect with the right professionals to accelerate your career growth.
                </p>
            </div>

            <Card className="glass-panel bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-600" />
                        Search Criteria
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-slate-600">Target Company</Label>
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
                        <div className="space-y-2">
                            <Label className="text-slate-600">Target Role / Keyword</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="e.g. Recruiter or CTO"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="pl-10 glass-input bg-slate-50 border-slate-200 focus:bg-white h-11 transition-all duration-300"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Location (Optional)</Label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="e.g. Paris"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="pl-10 glass-input bg-slate-50 border-slate-200 focus:bg-white h-11 transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>

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
                </CardContent>
            </Card>

            {hasSearched && (
                <div className="space-y-6 animate-slide-up">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-slate-900">
                            Found {results.length} Potential Contacts
                        </h3>
                        <span className="text-sm text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                            Page {page + 1}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((contact, i) => (
                            <Card key={i} className="glass-panel bg-white border-slate-200 hover:border-indigo-300 shadow-sm group transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {contact.name}
                                                </h4>
                                                <p className="text-sm text-indigo-600 font-medium">
                                                    {contact.title}
                                                </p>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                {contact.snippet}
                                            </p>

                                            {/* Email Predictor Section */}
                                            <div className="mt-4">
                                                {!contact.email && contact.emailStatus !== 'loading' && contact.emailStatus !== 'error' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleGuessEmail(i)}
                                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-medium flex items-center gap-1.5"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        Deviner l'email pro
                                                    </Button>
                                                )}

                                                {contact.emailStatus === 'loading' && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Recherche du pattern...
                                                    </div>
                                                )}

                                                {contact.emailStatus === 'success' && contact.email && (
                                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100 w-fit">
                                                        <Mail className="w-4 h-4" />
                                                        <span className="font-medium text-sm">{contact.email}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(contact.email!)}
                                                            className="ml-2 p-1 hover:bg-green-100 rounded-md transition-colors"
                                                            title="Copier l'email"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {contact.emailStatus === 'error' && (
                                                    <div className="text-sm text-red-500 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        Impossible de deviner l'email
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={contact.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-300 shadow-sm bg-indigo-50"
                                        >
                                            <ExternalLink className="h-5 w-5" />
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {results.length === 0 && !isSearching && (
                            <div className="col-span-2 text-center py-12 glass-panel bg-slate-50 rounded-xl border-dashed border-slate-300">
                                <Search className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                                {error ? (
                                    <>
                                        <p className="text-lg text-red-600 font-semibold">❌ Erreur de Recherche</p>
                                        <p className="text-sm text-slate-600 mt-2">{error}</p>
                                        <p className="text-xs text-slate-500 mt-3">Vérifiez votre clé API Serper dans le fichier .env</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg text-slate-600">Aucun contact trouvé.</p>
                                        <p className="text-sm text-slate-500">Essayez d'ajuster vos critères de recherche.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {results.length > 0 && (
                        <div className="flex justify-center mt-8 pb-8">
                            <Button
                                variant="outline"
                                onClick={() => handleSearch(true)}
                                disabled={isSearching}
                                className="hover:bg-slate-100 text-slate-700 border-slate-300"
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
                </div>
            )}
        </div>
    );
}
