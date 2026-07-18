import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ParsedCV, type JobAnalysis, type MatchResult, type CVHistoryEntry } from "../types";
import type { SearchResult } from "../services/search/serper";
import type { NetworkingQualityProfile } from "../services/networking/quality";
import { normalizeMatchResult, normalizeParsedCV } from "../utils/normalizeCV";

interface EmailPredictorState {
    company: string;
    firstName: string;
    lastName: string;
    result: { email?: string, domain: string, pattern: string, score?: number, source: 'finder' | 'pattern' | 'cache' } | null;
}

interface NetworkingState {
    company: string;
    role: string;
    location: string;
    results: Array<SearchResult & Partial<NetworkingQualityProfile>>;
    hasSearched: boolean;
}

interface NetworkingSectionCacheEntry {
    company: string;
    title: string;
    profiles: Array<SearchResult & Partial<NetworkingQualityProfile>>;
    cachedAt: number;
}

export interface AppState {
    step: number;
    cvData: ParsedCV | null;
    jobData: JobAnalysis | null;
    analysisResults: MatchResult | null;
    language: "English" | "French";
    userId: string | null;

    emailPredictor: EmailPredictorState;
    networking: NetworkingState;
    networkingSectionCache: Record<string, NetworkingSectionCacheEntry>;

    // In-memory session cache only - NOT persisted to localStorage
    cvHistoryCache: CVHistoryEntry[];

    setStep: (step: number) => void;
    setCvData: (data: ParsedCV | null) => void;
    setJobData: (data: JobAnalysis) => void;
    setAnalysisResults: (results: MatchResult) => void;
    setLanguage: (lang: "English" | "French") => void;
    setUserId: (id: string | null) => void;

    setEmailPredictorState: (state: Partial<EmailPredictorState>) => void;
    setNetworkingState: (state: Partial<NetworkingState>) => void;
    setNetworkingSectionCache: (key: string, entry: NetworkingSectionCacheEntry) => void;

    // History session cache setters (Supabase is the source of truth)
    setCVHistoryCache: (entries: CVHistoryEntry[]) => void;
    prependCVHistoryCache: (entry: CVHistoryEntry) => void;
    removeCVHistoryCacheEntry: (id: string) => void;

    restoreHistoryEntry: (entry: CVHistoryEntry) => void;

    reset: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            step: 1,
            cvData: null,
            jobData: null,
            analysisResults: null,
            language: "French",
            userId: null,

            emailPredictor: {
                company: "",
                firstName: "",
                lastName: "",
                result: null
            },
            networking: {
                company: "",
                role: "",
                location: "",
                results: [],
                hasSearched: false
            },
            networkingSectionCache: {},
            cvHistoryCache: [],

            setStep: (step) => set({ step }),
            setCvData: (cvData) => set({ cvData: normalizeParsedCV(cvData) }),
            setJobData: (jobData) => set({ jobData, analysisResults: null }),
            setAnalysisResults: (analysisResults) => set({ analysisResults: normalizeMatchResult(analysisResults) }),
            setLanguage: (language) => set({ language }),
            setUserId: (userId) => set({ userId }),

            setEmailPredictorState: (newState) => set((state) => ({
                emailPredictor: { ...state.emailPredictor, ...newState }
            })),
            setNetworkingState: (newState) => set((state) => ({
                networking: { ...state.networking, ...newState }
            })),
            setNetworkingSectionCache: (key, entry) => set((state) => ({
                networkingSectionCache: { ...state.networkingSectionCache, [key]: entry }
            })),

            setCVHistoryCache: (entries) => set({ cvHistoryCache: entries }),
            prependCVHistoryCache: (entry) => set((state) => {
                // Remove existing entry for same job+company+cv owner before prepending
                const deduped = state.cvHistoryCache.filter(
                    (e) => !(
                        e.jobData.title === entry.jobData.title &&
                        e.jobData.company === entry.jobData.company &&
                        e.cvData.contact.firstName === entry.cvData.contact.firstName &&
                        e.cvData.contact.lastName === entry.cvData.contact.lastName
                    )
                );
                return { cvHistoryCache: [entry, ...deduped].slice(0, 10) };
            }),
            removeCVHistoryCacheEntry: (id) => set((state) => ({
                cvHistoryCache: state.cvHistoryCache.filter((e) => e.id !== id)
            })),

            restoreHistoryEntry: (entry) => set({
                cvData: normalizeParsedCV(entry.cvData),
                jobData: entry.fullJobData,
                analysisResults: normalizeMatchResult(entry.fullAnalysis),
                step: 4,
            }),

            reset: () => set({
                step: 1,
                cvData: null,
                jobData: null,
                analysisResults: null,
                language: "French",
                userId: null,
                emailPredictor: { company: "", firstName: "", lastName: "", result: null },
                networking: { company: "", role: "", location: "", results: [], hasSearched: false },
                networkingSectionCache: {},
                cvHistoryCache: [],
            }),
        }),
        {
            name: "career-match-storage",
            partialize: (state) => ({
                step: state.step,
                cvData: state.cvData,
                jobData: state.jobData,
                analysisResults: state.analysisResults,
                language: state.language,
                userId: state.userId,
                emailPredictor: state.emailPredictor,
                networking: state.networking,
                networkingSectionCache: state.networkingSectionCache,
                // cvHistoryCache intentionally excluded - Supabase is the source of truth
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<AppState> & {
                    cvHistory?: unknown;
                    cvHistoryByUser?: unknown;
                } | undefined;
                // Drop any legacy history keys from old localStorage
                const { cvHistory: _a, cvHistoryByUser: _b, ...safe } = persisted ?? {};
                return {
                    ...currentState,
                    ...safe,
                    cvData: normalizeParsedCV(safe?.cvData),
                    analysisResults: normalizeMatchResult(safe?.analysisResults),
                    cvHistoryCache: [],
                };
            },
        }
    )
);
