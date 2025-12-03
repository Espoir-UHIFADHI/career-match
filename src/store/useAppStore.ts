import { create } from "zustand";
import { type ParsedCV, type JobAnalysis, type MatchResult } from "../types";

export interface AppState {
    step: number;
    cvData: ParsedCV | null;
    jobData: JobAnalysis | null;
    analysisResults: MatchResult | null;
    language: "English" | "French";
    isAuthModalOpen: boolean;

    setStep: (step: number) => void;
    setCvData: (data: ParsedCV | null) => void;
    setJobData: (data: JobAnalysis) => void;
    setAnalysisResults: (results: MatchResult) => void;
    setLanguage: (lang: "English" | "French") => void;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    step: 1,
    cvData: null,
    jobData: null,
    analysisResults: null,
    language: "French",
    isAuthModalOpen: false,

    setStep: (step) => set({ step }),
    setCvData: (cvData) => set({ cvData }),
    setJobData: (jobData) => set({ jobData }),
    setAnalysisResults: (analysisResults) => set({ analysisResults }),
    setLanguage: (language) => set({ language }),
    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),
    reset: () => set({ step: 1, cvData: null, jobData: null, analysisResults: null, language: "French", isAuthModalOpen: false }),
}));
