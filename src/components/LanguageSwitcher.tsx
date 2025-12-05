import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../lib/utils';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    return (
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
            <div className="flex items-center justify-center w-6 h-6 text-slate-400">
                <Globe className="h-4 w-4" />
            </div>
            <button
                onClick={() => setLanguage('fr')}
                className={cn(
                    "px-2 py-0.5 text-xs font-semibold rounded-full transition-all",
                    language === 'fr'
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                )}
            >
                FR
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={cn(
                    "px-2 py-0.5 text-xs font-semibold rounded-full transition-all",
                    language === 'en'
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                )}
            >
                EN
            </button>
        </div>
    );
}
