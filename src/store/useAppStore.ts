import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ParsedCV, type JobAnalysis, type MatchResult } from "../types";

interface EmailPredictorState {
    company: string;
    firstName: string;
    lastName: string;
    result: { email?: string, domain: string, pattern: string, score?: number, source: 'finder' | 'pattern' | 'cache' } | null;
}

interface NetworkingState {
    company: string;
    role: string;
    results: any[]; // Using any[] for now to avoid circular dependency or duplication, can be refined
    hasSearched: boolean;
}

export interface AppState {
    step: number;
    cvData: ParsedCV | null;
    jobData: JobAnalysis | null;
    analysisResults: MatchResult | null;
    language: "English" | "French";
    userId: string | null;

    // New Slices
    emailPredictor: EmailPredictorState;
    networking: NetworkingState;

    setStep: (step: number) => void;
    setCvData: (data: ParsedCV | null) => void;
    setJobData: (data: JobAnalysis) => void;
    setAnalysisResults: (results: MatchResult) => void;
    setLanguage: (lang: "English" | "French") => void;
    setUserId: (id: string | null) => void;

    // New Setters
    setEmailPredictorState: (state: Partial<EmailPredictorState>) => void;
    setNetworkingState: (state: Partial<NetworkingState>) => void;

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
                results: [],
                hasSearched: false
            },

            setStep: (step) => set({ step }),
            setCvData: (cvData) => set({ cvData }),
            setJobData: (jobData) => set({ jobData, analysisResults: null }),
            setAnalysisResults: (analysisResults) => set({ analysisResults }),
            setLanguage: (language) => set({ language }),
            setUserId: (userId) => set({ userId }),

            setEmailPredictorState: (newState) => set((state) => ({
                emailPredictor: { ...state.emailPredictor, ...newState }
            })),
            setNetworkingState: (newState) => set((state) => ({
                networking: { ...state.networking, ...newState }
            })),

            reset: () => set({
                step: 1,
                cvData: null,
                jobData: null,
                analysisResults: null,
                language: "French",
                userId: null,
                emailPredictor: { company: "", firstName: "", lastName: "", result: null },
                networking: { company: "", role: "", results: [], hasSearched: false }
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
                networking: state.networking
            }),
        }
    )
);
