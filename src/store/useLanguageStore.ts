import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'fr';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'fr', // Default to French as requested/implied context
            setLanguage: (language) => set({ language }),
        }),
        {
            name: 'language-storage',
        }
    )
);
