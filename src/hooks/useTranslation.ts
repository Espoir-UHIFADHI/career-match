import { useAppStore } from '../store/useAppStore';
import { translations } from '../i18n/translations';

// Helper to get nested properties
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
};

export function useTranslation() {
    // Usage of useAppStore instead of independent useLanguageStore
    const { language: appLanguage, setLanguage: setAppLanguage } = useAppStore();

    // Mapping between "English"/"French" and "en"/"fr"
    const languageCode = appLanguage === "English" ? "en" : "fr";

    const setLanguage = (lang: "en" | "fr") => {
        const fullLang = lang === "en" ? "English" : "French";
        setAppLanguage(fullLang);
    };

    const t = (key: string, params?: Record<string, string | number>) => {
        let translation = getNestedValue(translations[languageCode], key);
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in language: ${languageCode}`);
            return key;
        }

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                translation = translation.replace(`{${key}}`, String(value));
            });
        }
        return translation;
    };

    return { t, language: languageCode, setLanguage };
}

