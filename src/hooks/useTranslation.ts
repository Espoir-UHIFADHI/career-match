import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';

// Helper to get nested properties
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
};

export function useTranslation() {
    const { language, setLanguage } = useLanguageStore();

    const t = (key: string) => {
        const translation = getNestedValue(translations[language], key);
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in language: ${language}`);
            return key;
        }
        return translation;
    };

    return { t, language, setLanguage };
}
