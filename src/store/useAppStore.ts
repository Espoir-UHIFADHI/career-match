import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ParsedCV, type JobAnalysis, type MatchResult } from "../types";

export interface AppState {
    step: number;
    cvData: ParsedCV | null;
    jobData: JobAnalysis | null;
    analysisResults: MatchResult | null;
    language: "English" | "French";

    setStep: (step: number) => void;
    setCvData: (data: ParsedCV | null) => void;
    setJobData: (data: JobAnalysis) => void;
    setAnalysisResults: (results: MatchResult) => void;
    setLanguage: (lang: "English" | "French") => void;
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

            setStep: (step) => set({ step }),
            setCvData: (cvData) => set({ cvData }),
            setJobData: (jobData) => set({ jobData, analysisResults: null }),
            setAnalysisResults: (analysisResults) => set({ analysisResults }),
            setLanguage: (language) => set({ language }),
            reset: () => set({ step: 1, cvData: null, jobData: null, analysisResults: null, language: "French" }),
        }),
        {
            name: "career-match-storage",
            partialize: (state) => ({
                step: state.step,
                cvData: state.cvData,
                jobData: state.jobData,
                analysisResults: state.analysisResults,
                language: state.language
            }),
        }
    )
);
