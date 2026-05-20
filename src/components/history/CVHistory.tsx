import { useState, useMemo, useEffect, useCallback } from "react";
import { Download, Trash2, Briefcase, Calendar, TrendingUp, FileText, Clock, Eye, RotateCcw, Search, X, Loader2 } from "lucide-react";
// @ts-ignore — @react-pdf/renderer entry types
import { pdf } from "@react-pdf/renderer";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { useTranslation } from "../../hooks/useTranslation";
import { cvHistoryService } from "../../services/cvHistoryService";
import { CVDocument } from "../results/CVDocument";
import { PrintableCV } from "../results/PrintableCV";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { CVHistoryEntry } from "../../types";
import { cn } from "../../lib/utils";

// ── Score badge ────────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
        score >= 60 ? "bg-amber-100 text-amber-700 border-amber-200" :
                      "bg-red-100 text-red-700 border-red-200";
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border", color)}>
            <TrendingUp className="h-3 w-3" />
            {score}%
        </span>
    );
}

// ── Preview modal ──────────────────────────────────────────────────────────────
function PreviewModal({ entry, onClose }: { entry: CVHistoryEntry; onClose: () => void }) {
    return (
        <Modal
            isOpen
            onClose={onClose}
            title={`${entry.jobData.title} — ${entry.jobData.company}`}
            className="max-w-3xl"
        >
            <div className="overflow-auto max-h-[70vh] bg-slate-50 rounded-lg p-2">
                <div style={{ transform: "scale(0.75)", transformOrigin: "top center", width: "210mm" }}>
                    <PrintableCV data={entry.optimizedCV} language={entry.analysisLanguage} />
                </div>
            </div>
        </Modal>
    );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function HistoryCard({
    entry,
    onDownload,
    onDelete,
    onPreview,
    onResume,
    isDownloading,
}: {
    entry: CVHistoryEntry;
    onDownload: (e: CVHistoryEntry) => void;
    onDelete: (id: string) => void;
    onPreview: (e: CVHistoryEntry) => void;
    onResume: (e: CVHistoryEntry) => void;
    isDownloading: boolean;
}) {
    const { t } = useTranslation();
    const date = new Date(entry.createdAt);
    const locale = entry.analysisLanguage === "French" ? "fr-FR" : "en-US";
    const dateStr = date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate text-sm leading-tight">
                            {entry.jobData.title || t('history.unknownRole')}
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5 truncate">
                            {entry.jobData.company || t('history.unknownCompany')}
                        </p>
                        <span className="flex items-center gap-1 text-slate-400 text-xs mt-1.5">
                            <FileText className="h-3 w-3" />
                            {entry.cvData.contact.firstName} {entry.cvData.contact.lastName}
                        </span>
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <ScoreBadge score={entry.matchScore} />
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="h-3 w-3" />{dateStr}
                    </span>
                    <span className="text-slate-300 text-xs">{timeStr}</span>
                </div>
            </div>

            {entry.jobData.description && (
                <p className="mt-3 text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {entry.jobData.description.slice(0, 160)}…
                </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {entry.analysisLanguage === "French" ? "Analyse en français" : "Analysis in English"}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={t('history.delete')}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Button variant="secondary" size="sm" onClick={() => onPreview(entry)} className="gap-1.5 text-xs">
                        <Eye className="h-3.5 w-3.5" />{t('history.preview')}
                    </Button>
                    {entry.fullAnalysis && entry.fullJobData && (
                        <Button variant="outline" size="sm" onClick={() => onResume(entry)} className="gap-1.5 text-xs">
                            <RotateCcw className="h-3.5 w-3.5" />{t('history.resume')}
                        </Button>
                    )}
                    <Button size="sm" onClick={() => onDownload(entry)} isLoading={isDownloading} className="gap-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" />{t('history.redownload')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Score filter ───────────────────────────────────────────────────────────────
type ScoreFilter = "all" | "high" | "medium" | "low";

// ── Main component ─────────────────────────────────────────────────────────────
export function CVHistory() {
    const { cvHistoryCache, setCVHistoryCache, removeCVHistoryCacheEntry, restoreHistoryEntry } = useAppStore();
    const { user } = useUser();
    const { getToken } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [previewEntry, setPreviewEntry] = useState<CVHistoryEntry | null>(null);
    const [search, setSearch] = useState("");
    const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");

    // Load from Supabase on mount
    const loadHistory = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await getToken({ template: 'supabase' });
            const entries = await cvHistoryService.getAll(user.id, token || undefined);
            setCVHistoryCache(entries);
        } finally {
            setLoading(false);
        }
    }, [user, getToken, setCVHistoryCache]);

    useEffect(() => {
        // Only fetch if cache is empty (avoid re-fetching if already loaded this session)
        if (cvHistoryCache.length === 0) {
            loadHistory();
        }
    }, [loadHistory, cvHistoryCache.length]);

    const filtered = useMemo(() => {
        return cvHistoryCache.filter((e) => {
            const q = search.toLowerCase();
            const matchesSearch =
                !q ||
                e.jobData.title.toLowerCase().includes(q) ||
                e.jobData.company.toLowerCase().includes(q);
            const matchesScore =
                scoreFilter === "all" ? true :
                scoreFilter === "high" ? e.matchScore >= 80 :
                scoreFilter === "medium" ? e.matchScore >= 60 && e.matchScore < 80 :
                e.matchScore < 60;
            return matchesSearch && matchesScore;
        });
    }, [cvHistoryCache, search, scoreFilter]);

    const handleDownload = async (entry: CVHistoryEntry) => {
        setDownloadingId(entry.id);
        try {
            const blob = await pdf(
                <CVDocument data={entry.optimizedCV} language={entry.analysisLanguage} />
            ).toBlob();
            const filename = `CV_${entry.cvData.contact.firstName}_${entry.cvData.contact.lastName}_${entry.jobData.company || 'Career-Match'}.pdf`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("History PDF download error:", e);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleResume = (entry: CVHistoryEntry) => {
        restoreHistoryEntry(entry);
        navigate("/app");
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        removeCVHistoryCacheEntry(id);
        const token = await getToken({ template: 'supabase' });
        cvHistoryService.remove(user.id, id, token || undefined);
    };

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-500">{t('common.loading')}</p>
            </div>
        );
    }

    // ── Empty state ────────────────────────────────────────────────────────────
    if (cvHistoryCache.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('history.emptyTitle')}</h2>
                <p className="text-slate-500 text-sm max-w-sm leading-relaxed">{t('history.emptyDesc')}</p>
            </div>
        );
    }

    const scoreFilters: { value: ScoreFilter; label: string; color: string }[] = [
        { value: "all",    label: t('history.filterAll'),    color: "bg-slate-100 text-slate-600 hover:bg-slate-200" },
        { value: "high",   label: t('history.filterHigh'),   color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
        { value: "medium", label: t('history.filterMedium'), color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
        { value: "low",    label: t('history.filterLow'),    color: "bg-red-100 text-red-700 hover:bg-red-200" },
    ];

    return (
        <>
            <div className="w-full max-w-none px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">{t('history.title')}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {t('history.subtitle', { count: String(cvHistoryCache.length) })}
                    </p>
                </div>

                {/* Search + filters */}
                <div className="mb-5 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('history.searchPlaceholder')}
                            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {scoreFilters.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setScoreFilter(f.value)}
                                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all", f.color, scoreFilter === f.value && "ring-2 ring-offset-1 ring-indigo-400")}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {(search || scoreFilter !== "all") && (
                    <p className="text-xs text-slate-400 mb-3">
                        {filtered.length} {filtered.length === 1 ? t('history.resultSingular') : t('history.resultPlural')}
                    </p>
                )}

                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">{t('history.noResults')}</div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((entry) => (
                            <HistoryCard
                                key={entry.id}
                                entry={entry}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onPreview={setPreviewEntry}
                                onResume={handleResume}
                                isDownloading={downloadingId === entry.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {previewEntry && (
                <PreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
            )}
        </>
    );
}
