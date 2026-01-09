
import { useTranslation } from "../../hooks/useTranslation";
import { Shield, TrendingUp, Unlock, Users, Sparkles, Target, Upload, Cpu, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../ui/Button";

export function About() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isSignedIn } = useUser();

    return (
        <div className="flex flex-col bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Premium Hero Section */}
            <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                </div>

                <div className="container relative z-10 mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 shadow-sm">
                        <Sparkles className="w-4 h-4 fill-indigo-200" />
                        <span>Technologie Propriétaire</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                        {t('about.hero.title')}
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                        {t('about.hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 border-y border-slate-200/60 bg-white/50 backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 mb-1">75%</div>
                            <div className="text-sm text-slate-500 font-medium">{t('about.stats.rejected')}</div>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border-t md:border-t-0 md:border-l border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 mb-1">3x</div>
                            <div className="text-sm text-slate-500 font-medium">{t('about.stats.interview')}</div>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border-t md:border-t-0 md:border-l border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                                <Target className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 mb-1">90%</div>
                            <div className="text-sm text-slate-500 font-medium">{t('about.stats.time')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission / Story */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">{t('about.story.title')}</h2>
                            <p className="text-slate-600 text-lg leading-relaxed mb-6 font-light">
                                {t('about.story.p1')}
                            </p>
                            <p className="text-slate-600 text-lg leading-relaxed font-light">
                                {t('about.story.p2')}
                            </p>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl rotate-3 opacity-10 group-hover:rotate-6 transition-transform duration-500" />
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2940"
                                alt="Team Working"
                                className="relative rounded-3xl shadow-2xl border border-white/20 transform group-hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works (NEW SECTION) */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            {t('about.howItWorks.title')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="relative p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="absolute -top-6 left-8 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">1</div>
                            <div className="mt-6 mb-4">
                                <Upload className="w-10 h-10 text-indigo-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('about.howItWorks.step1Title')}</h3>
                            <p className="text-slate-600 leading-relaxed font-light">{t('about.howItWorks.step1Desc')}</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="absolute -top-6 left-8 w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/30">2</div>
                            <div className="mt-6 mb-4">
                                <Cpu className="w-10 h-10 text-purple-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('about.howItWorks.step2Title')}</h3>
                            <p className="text-slate-600 leading-relaxed font-light">{t('about.howItWorks.step2Desc')}</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="absolute -top-6 left-8 w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/30">3</div>
                            <div className="mt-6 mb-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('about.howItWorks.step3Title')}</h3>
                            <p className="text-slate-600 leading-relaxed font-light">{t('about.howItWorks.step3Desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section className="py-24 bg-[#0B0F19] text-white relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

                <div className="container relative z-10 mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight bg-gradient-to-r from-[#8A2BE2] to-[#00FFFF] bg-clip-text text-transparent">
                                {t('about.tech.title')}
                            </h2>
                            <p className="text-slate-200 text-lg md:text-xl mb-8 leading-relaxed font-light">
                                {t('about.tech.subtitle')}
                            </p>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                <p className="text-slate-200 leading-relaxed">
                                    {t('about.tech.p1')}
                                </p>
                            </div>
                        </div>

                        <div className="lg:w-1/2 grid grid-cols-1 gap-6">
                            {/* Card 1 - Parsing */}
                            <div className="group bg-white/5 border border-slate-700 p-8 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                                    <div className="relative flex items-center justify-center w-3 h-3">
                                        <div className="absolute w-full h-full bg-indigo-500 rounded-full animate-pulse opacity-50" />
                                        <div className="relative w-2 h-2 rounded-full bg-indigo-500" />
                                    </div>
                                    {t('about.tech.cards.parsing.title')}
                                </h3>
                                <p className="text-slate-200 leading-relaxed font-light text-sm">{t('about.tech.cards.parsing.desc')}</p>
                            </div>

                            {/* Card 2 - Semantic */}
                            <div className="group bg-white/5 border border-slate-700 p-8 rounded-2xl hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                                    <div className="relative flex items-center justify-center w-3 h-3">
                                        <div className="absolute w-full h-full bg-purple-500 rounded-full animate-pulse opacity-50" />
                                        <div className="relative w-2 h-2 rounded-full bg-purple-500" />
                                    </div>
                                    {t('about.tech.cards.keywords.title')}
                                </h3>
                                <p className="text-slate-200 leading-relaxed font-light text-sm">{t('about.tech.cards.keywords.desc')}</p>
                            </div>

                            {/* Card 3 - Formatting */}
                            <div className="group bg-white/5 border border-slate-700 p-8 rounded-2xl hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                                    <div className="relative flex items-center justify-center w-3 h-3">
                                        <div className="absolute w-full h-full bg-emerald-500 rounded-full animate-pulse opacity-50" />
                                        <div className="relative w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                    {t('about.tech.cards.formatting.title')}
                                </h3>
                                <p className="text-slate-200 leading-relaxed font-light text-sm">{t('about.tech.cards.formatting.desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof (NEW SECTION) */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">{t('about.socialProof.title')}</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos, using text for now or generic SVGs */}
                        <div className="text-xl font-bold text-slate-400">Google</div>
                        <div className="text-xl font-bold text-slate-400">Amazon</div>
                        <div className="text-xl font-bold text-slate-400">Microsoft</div>
                        <div className="text-xl font-bold text-slate-400">Salesforce</div>
                        <div className="text-xl font-bold text-slate-400">Tesla</div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            {t('about.values.title')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Value 1 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/20">
                                <Unlock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('about.values.transparency')}</h3>
                            <p className="text-slate-600 leading-relaxed">{t('about.values.transparencyDesc')}</p>
                        </div>
                        {/* Value 2 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/20">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('about.values.privacy')}</h3>
                            <p className="text-slate-600 leading-relaxed">{t('about.values.privacyDesc')}</p>
                        </div>
                        {/* Value 3 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mb-6 transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('about.values.empowerment')}</h3>
                            <p className="text-slate-600 leading-relaxed">{t('about.values.empowermentDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Overlay Section */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">{t('about.faq.title')}</h2>
                    <div className="space-y-4">
                        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-default">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">Q</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{t('about.faq.q1')}</h3>
                                    <p className="text-slate-600 leading-relaxed">{t('about.faq.a1')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-default">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">Q</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{t('about.faq.q2')}</h3>
                                    <p className="text-slate-600 leading-relaxed">{t('about.faq.a2')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-slate-900 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/40 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
                </div>

                <div className="container relative z-10 mx-auto px-6 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                            {t('about.cta.title')}
                        </h2>
                        <p className="text-lg text-slate-300 mb-12 leading-relaxed">
                            {t('about.cta.subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={() => {
                                    if (isSignedIn) {
                                        useAppStore.getState().setStep(1);
                                        navigate('/app');
                                    } else {
                                        navigate('/app');
                                    }
                                }}
                                className="h-16 px-10 text-xl bg-white text-slate-900 hover:bg-slate-50 border-none shadow-2xl shadow-white/10 rounded-full w-full sm:w-auto transition-transform hover:scale-105"
                            >
                                {t('about.cta.button')}
                            </Button>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span>{t('about.cta.guarantee')}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
