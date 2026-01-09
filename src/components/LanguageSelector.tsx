import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../lib/utils';

export function LanguageSelector({ className }: { className?: string }) {
    const { language, setLanguage } = useTranslation();

    return (
        <div className={cn("flex items-center gap-1 bg-slate-100 rounded-full p-1", className)}>
            <button
                onClick={() => setLanguage('fr')}
                className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    language === 'fr'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                )}
            >
                FR
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    language === 'en'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                )}
            >
                EN
            </button>
        </div>
    );
}
