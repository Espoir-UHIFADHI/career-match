import { useEffect, useState } from "react";
import { Users, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { searchLinkedIn, type SearchResult } from "../../services/search/serper";
import { useAppStore } from "../../store/useAppStore";

export function NetworkingSection() {
    const { jobData } = useAppStore();
    const [profiles, setProfiles] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (jobData?.company && jobData?.title) {
            findProfiles();
        }
    }, [jobData]);

    const findProfiles = async () => {
        if (!jobData) return;
        setLoading(true);
        try {
            // Search for people in the company with similar roles or hiring roles
            // We can search for "Recruiter" or the specific role
            const results = await searchLinkedIn(jobData.company, jobData.title);
            setProfiles(results.slice(0, 5));
        } catch (err) {
            console.error("Networking search failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (!jobData) return null;

    return (
        <Card className="mt-8 glass-panel bg-white border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Networking Opportunities
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                    Connect with people at <strong>{jobData.company}</strong> to increase your chances.
                </p>

                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                ) : profiles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profiles.map((profile, i) => (
                            <a
                                key={i}
                                href={profile.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{profile.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2">{profile.snippet}</p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">
                        No direct profiles found. Try searching LinkedIn manually for "{jobData.company} {jobData.title}".
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
