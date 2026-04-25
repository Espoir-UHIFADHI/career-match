import { useMemo, useState } from "react";
import { Users, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { searchLinkedIn, type SearchResult } from "../../services/search/serper";
import { useAppStore } from "../../store/useAppStore";
import { useTranslation } from "../../hooks/useTranslation";
import {
    dedupeAndRankNetworkingProfiles,
    getFirstContactSuggestions,
    type NetworkingQualityProfile,
} from "../../services/networking/quality";

import { useAuth } from "@clerk/clerk-react";
import { Button } from "../ui/Button";

type RankedSearchResult = SearchResult & NetworkingQualityProfile;

export function NetworkingSection() {
    const { jobData, networkingSectionCache, setNetworkingSectionCache } = useAppStore();
    const { getToken } = useAuth();
    const [profiles, setProfiles] = useState<RankedSearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const cacheKey = useMemo(() => {
        const company = (jobData?.company || "").trim();
        const title = (jobData?.title || "").trim();
        if (!company || !title) return null;
        return `${company}::${title}`;
    }, [jobData?.company, jobData?.title]);

    const cached = cacheKey ? networkingSectionCache[cacheKey] : null;
    const displayedProfiles = useMemo(() => {
        const source = profiles.length > 0 ? profiles : ((cached?.profiles || []) as SearchResult[]);
        return dedupeAndRankNetworkingProfiles(source, { role: jobData?.title }).slice(0, 5);
    }, [cached?.profiles, jobData?.title, profiles]);
    const firstContactSuggestions = getFirstContactSuggestions(displayedProfiles, 3);

    const findProfiles = async () => {
        if (!jobData) return;
        setLoading(true);
        try {
            const token = await getToken();
            // Search for people in the company with similar roles or hiring roles
            // We can search for "Recruiter" or the specific role
            const results = await searchLinkedIn(jobData.company, jobData.title, 10, 0, token || undefined);
            const top = dedupeAndRankNetworkingProfiles(results, { role: jobData.title }).slice(0, 5);
            setProfiles(top);
            if (cacheKey) {
                setNetworkingSectionCache(cacheKey, {
                    company: jobData.company,
                    title: jobData.title,
                    profiles: top,
                    cachedAt: Date.now(),
                });
            }
        } catch (err) {
            console.error("Networking search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const { t } = useTranslation();

    if (!jobData) return null;

    return (
        <Card className="mt-8 bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-indigo-600" />
                    {t('networking.opportunities')}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-6">
                    {t('networking.connectPrompt', { company: jobData.company })}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
                    <Button
                        onClick={findProfiles}
                        disabled={loading || !jobData?.company || !jobData?.title}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        Trouver des contacts dans l’entreprise
                    </Button>
                    {cached?.cachedAt ? (
                        <div className="text-xs text-slate-500">
                            Dernière recherche: {new Date(cached.cachedAt).toLocaleString()}
                        </div>
                    ) : null}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                ) : displayedProfiles.length > 0 ? (
                    <div className="space-y-4">
                        {firstContactSuggestions.length > 0 ? (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                                <div className="font-semibold text-slate-900">À contacter en premier</div>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {firstContactSuggestions.map((profile, index) => (
                                        <a
                                            key={profile.dedupeKey || profile.link || index}
                                            href={profile.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white border border-indigo-100 rounded-lg p-3 hover:border-indigo-300 transition-all"
                                        >
                                            <div className="text-[11px] font-semibold text-indigo-600 uppercase">{index + 1}. {profile.priorityLabel}</div>
                                            <div className="mt-1 text-xs text-slate-600 line-clamp-2">{profile.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {displayedProfiles.map((profile, i) => (
                                <a
                                    key={profile.dedupeKey || profile.link || i}
                                    href={profile.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group duration-300"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{profile.title}</h4>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider bg-white text-indigo-700 border-indigo-100 flex-shrink-0">
                                                {profile.relevanceScore}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{profile.snippet}</p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                                                {profile.priorityLabel}
                                            </span>
                                            {profile.scoreReasons.slice(0, 2).map((reason) => (
                                                <span key={reason} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors mt-1" />
                                </a>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm text-slate-500 italic">
                            {t('networking.noProfiles', { company: jobData.company, title: jobData.title })}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
