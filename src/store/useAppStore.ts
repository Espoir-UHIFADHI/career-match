import { create } from "zustand";
import { type ParsedCV, type JobAnalysis, type MatchResult } from "../types";

export interface AppState {
    step: number;
    cvData: ParsedCV | null;
    jobData: JobAnalysis | null;
    analysisResults: MatchResult | null;

    setStep: (step: number) => void;
    setCvData: (data: ParsedCV | null) => void;
    setJobData: (data: JobAnalysis) => void;
    setAnalysisResults: (results: MatchResult) => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    step: 1,
    cvData: null,
    jobData: null,
    analysisResults: null,

    setStep: (step) => set({ step }),
    setCvData: (cvData) => set({ cvData }),
    setJobData: (jobData) => set({ jobData }),
    setAnalysisResults: (analysisResults) => set({ analysisResults }),
    reset: () => set({ step: 1, cvData: null, jobData: null, analysisResults: null }),
}));
