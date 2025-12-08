import { useEffect, useState } from "react";
import { Users, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { searchLinkedIn, type SearchResult } from "../../services/search/serper";
import { useAppStore } from "../../store/useAppStore";

import { useAuth } from "@clerk/clerk-react";

export function NetworkingSection() {
    const { jobData } = useAppStore();
    const { getToken } = useAuth();
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
            const token = await getToken({ template: 'supabase' });
            // Search for people in the company with similar roles or hiring roles
            // We can search for "Recruiter" or the specific role
            const results = await searchLinkedIn(jobData.company, jobData.title, 10, 0, token || undefined);
            setProfiles(results.slice(0, 5));
        } catch (err) {
            console.error("Networking search failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (!jobData) return null;

    return (
        <Card className="mt-8 bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Networking Opportunities
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-6">
                    Connect with people at <strong>{jobData.company}</strong> to increase your chances.
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
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
                                className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group duration-300"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{profile.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{profile.snippet}</p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors mt-1" />
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm text-slate-500 italic">
                            No direct profiles found. Try searching LinkedIn manually for "{jobData.company} {jobData.title}".
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
