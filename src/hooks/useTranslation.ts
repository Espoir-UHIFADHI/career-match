import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';

// Helper to get nested properties
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
};

export function useTranslation() {
    const { language, setLanguage } = useLanguageStore();

    const t = (key: string, params?: Record<string, string | number>) => {
        let translation = getNestedValue(translations[language], key);
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in language: ${language}`);
            return key;
        }

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                translation = translation.replace(`{${key}}`, String(value));
            });
        }
        return translation;
    };

    return { t, language, setLanguage };
}
