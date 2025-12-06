import { useTranslation } from "../../hooks/useTranslation";

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

export function PrivacyPolicy() {
    const { t } = useTranslation();
    const p = t('privacy') as any;

    if (!p || typeof p === 'string') return <div className="p-8">Loading privacy policy...</div>;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-slate-600">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-slate-900">{p.title}</h1>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">{p.lastUpdated}</p>
            </div>

            <div className="space-y-12 bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                {/* 1. Intro */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">1</span>
                        {p.intro.title && p.intro.title.replace(/^1\. /, '')}
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p className="whitespace-pre-line leading-relaxed text-lg">{renderText(p.intro.text)}</p>
                    </div>
                </section>

                {/* 2. Collection */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">2</span>
                        {p.collection.title && p.collection.title.replace(/^2\. /, '')}
                    </h2>
                    <p className="mb-6 text-lg">{p.collection.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{p.collection.direct.title}</h3>
                            <ul className="space-y-4">
                                {p.collection.direct.items.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                        <span className="leading-relaxed">{renderText(item)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{p.collection.auto.title}</h3>
                            <ul className="space-y-4">
                                {p.collection.auto.items.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                        <span className="leading-relaxed">{renderText(item)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 3. Usage */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">3</span>
                        {p.usage.title && p.usage.title.replace(/^3\. /, '')}
                    </h2>
                    <p className="mb-6 text-lg">{p.usage.intro}</p>
                    <ol className="grid gap-4">
                        {p.usage.items.map((item: string, i: number) => (
                            <li key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-white shadow-sm transition-colors">
                                <span className="font-bold text-indigo-200">0{i + 1}</span>
                                <div>{renderText(item)}</div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* 4. Sharing */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">4</span>
                        {p.sharing.title && p.sharing.title.replace(/^4\. /, '')}
                    </h2>
                    <p className="mb-6 text-lg bg-amber-50 text-amber-900 p-4 rounded-xl border border-amber-100 inline-block">
                        {renderText(p.sharing.intro)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {p.sharing.items.map((item: string, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-50 text-sm border border-slate-100">
                                {renderText(item)}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Security */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">5</span>
                        {p.security.title && p.security.title.replace(/^5\. /, '')}
                    </h2>
                    <p className="mb-6 text-lg">{p.security.intro}</p>
                    <div className="flex flex-wrap gap-4">
                        {p.security.items.map((item: string, i: number) => (
                            <div key={i} className="flex-1 min-w-[200px] p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-sm">
                                {renderText(item)}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 6. Rights */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm text-indigo-600">6</span>
                        {p.rights.title && p.rights.title.replace(/^6\. /, '')}
                    </h2>
                    <p className="mb-6 text-lg">{p.rights.intro}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {p.rights.items.map((item: string, i: number) => (
                            <li key={i} className="flex gap-3 items-center p-3">
                                <span className="w-2 h-2 rounded-full bg-slate-300" />
                                <span>{renderText(item)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="bg-slate-900 text-white p-6 rounded-2xl text-center shadow-lg shadow-slate-900/10">
                        <p className="text-lg">{renderText(p.rights.contact)}</p>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 7. Cookies */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900">{p.cookies.title && p.cookies.title.replace(/^7\. /, '')}</h2>
                        <p className="text-sm leading-relaxed">{p.cookies.text}</p>
                    </section>

                    {/* 8. Updates */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900">{p.updates.title && p.updates.title.replace(/^8\. /, '')}</h2>
                        <p className="text-sm leading-relaxed">{p.updates.text}</p>
                    </section>
                </div>

                {/* Footer DPO */}
                <div className="border-t border-slate-100 pt-12 mt-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{p.contactSection.title}</h3>
                    <p className="text-slate-600 mb-8 text-lg">{renderText(p.contactSection.dpo)}</p>
                    <p className="text-sm text-slate-400 italic font-serif">{p.contactSection.footer}</p>
                </div>
            </div>
        </div>
    );
}
