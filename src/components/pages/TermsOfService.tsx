import { useTranslation } from "../../hooks/useTranslation";
import { Helmet } from "react-helmet-async";
import { AlertCircle } from "lucide-react";

// Helper for simple markdown parsing (bold and italic)
const renderText = (text: string) => {
    if (!text) return null;

    // Split by bold (**...**) and italic (*...*)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic text-slate-600">{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

export function TermsOfService() {
    const { t } = useTranslation();
    const terms = t('terms') as any;

    if (!terms || typeof terms === 'string') return <div className="p-8">Loading terms...</div>;
    const s = terms.sections;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-slate-600">
            <Helmet>
                <title>C.G.U. - Career Match</title>
                <meta name="description" content="Conditions Générales d'Utilisation de Career Match. Tout ce que vous devez savoir sur l'utilisation de nos services." />
                <link rel="canonical" href="https://careermatch.fr/terms" />
            </Helmet>
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-slate-900">{terms.title}</h1>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">{terms.lastUpdated}</p>
            </div>

            <div className="space-y-12 bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">

                {/* 1. Acceptance */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">1</span>
                        {s.acceptance.title && s.acceptance.title.replace(/^1\. /, '')}
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p className="whitespace-pre-line leading-relaxed text-lg">{renderText(s.acceptance.text)}</p>
                    </div>
                </section>

                {/* 2. Description */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">2</span>
                        {s.description.title && s.description.title.replace(/^2\. /, '')}
                    </h2>
                    <p className="mb-4 text-lg">{s.description.text}</p>
                    <ul className="space-y-2 mb-6 ml-4">
                        {s.description.items.map((item: string, i: number) => (
                            <li key={i} className="flex gap-2 items-center text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                {renderText(item)}
                            </li>
                        ))}
                    </ul>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-900">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm">{renderText(s.description.warning)}</p>
                    </div>
                </section>

                {/* 3. Usage */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">3</span>
                        {s.usage.title && s.usage.title.replace(/^3\. /, '')}
                    </h2>
                    <p className="mb-4 whitespace-pre-line text-lg">{renderText(s.usage.text)}</p>
                    <ul className="space-y-3 bg-red-50 p-6 rounded-2xl border border-red-100">
                        {s.usage.items.map((item: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-red-900">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                <span>{renderText(item)}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 4. Credits */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">4</span>
                        {s.credits.title && s.credits.title.replace(/^4\. /, '')}
                    </h2>
                    <div className="grid gap-4">
                        {s.credits.items.map((item: string, i: number) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm leading-relaxed">{renderText(item)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. IP */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">5</span>
                        {s.ip.title && s.ip.title.replace(/^5\. /, '')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {s.ip.items.map((item: string, i: number) => (
                            <div key={i} className="p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-sm leading-relaxed">{renderText(item)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 6. Liability */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">6</span>
                        {s.liability.title && s.liability.title.replace(/^6\. /, '')}
                    </h2>
                    <p className="text-lg leading-relaxed">{renderText(s.liability.text)}</p>
                </section>

                {/* 7 & 8 */}
                <div className="grid md:grid-cols-2 gap-8">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900">{s.modification.title && s.modification.title.replace(/^7\. /, '')}</h2>
                        <p className="text-sm text-slate-600">{s.modification.text}</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900">{s.law.title && s.law.title.replace(/^8\. /, '')}</h2>
                        <p className="text-sm text-slate-600">{s.law.text}</p>
                    </section>
                </div>

                {/* Footer Support */}
                <div className="border-t border-slate-100 pt-12 mt-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{terms.contactSection.title}</h3>
                    <p className="text-slate-600 text-lg">{renderText(terms.contactSection.text)}</p>
                </div>

            </div>
        </div>
    );
}
