import { SignInButton } from "@clerk/clerk-react";
import { Button } from "./ui/Button";
import { ArrowRight, FileText, Mail, Sparkles, Zap, Star, StarHalf, CheckCircle, User } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export function LandingPage() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col bg-slate-50 overflow-x-hidden">
            {/* Premium Hero Section */}
            <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-visible">
                {/* Advanced Gradient Mesh Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
                    <div className="absolute bottom-[0%] right-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="container relative z-10 mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Left Column: Content */}
                        <div className="flex-1 text-center lg:text-left">


                            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8 animate-slide-up">
                                {t('hero.titleLine1')} <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
                                    {t('hero.titleLine2')}
                                </span>
                            </h1>

                            <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10 animate-slide-up animation-delay-200">
                                {t('hero.subtitle')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up animation-delay-400">
                                <SignInButton mode="modal">
                                    <Button
                                        className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-indigo-500/20 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm" />
                                        <span className="relative flex items-center">
                                            {t('hero.ctaStart')}
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>
                                </SignInButton>
                                <Button
                                    variant="outline"
                                    className="h-14 px-8 text-lg bg-white/60 hover:bg-white border-slate-200 text-slate-700 rounded-2xl backdrop-blur-sm transition-all hover:shadow-lg hover:border-indigo-200"
                                >
                                    {t('hero.ctaDemo')}
                                </Button>
                            </div>
                            <p className="mt-3 text-sm font-medium text-indigo-600 animate-fade-in animation-delay-500">
                                {t('hero.freeCreditsOffer')}
                            </p>

                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fade-in animation-delay-500">
                                <div className="flex -space-x-4">
                                    {[
                                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64",
                                        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64",
                                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64",
                                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64"
                                    ].map((src, i) => (
                                        <div key={i} className="h-12 w-12 rounded-full border-2 border-white ring-2 ring-indigo-50 shadow-md relative z-10 hover:scale-110 hover:z-20 transition-all duration-300">
                                            <img
                                                src={src}
                                                alt={`User ${i + 1}`}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-1 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-amber-400">
                                            {[1, 2, 3, 4].map(i => (
                                                <Star key={i} className="w-4 h-4 fill-current drop-shadow-sm" />
                                            ))}
                                            <StarHalf className="w-4 h-4 fill-current drop-shadow-sm" />
                                        </div>
                                        <span className="font-bold text-slate-800">4.6/5</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">
                                        par <span className="text-indigo-600 font-bold">+1000 pros</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: 3D Visual */}
                        <div className="flex-1 w-full max-w-[600px] perspective-1000 hidden lg:block animate-fade-in animation-delay-300">
                            <div className="relative w-full aspect-square animate-float transform-style-3d">
                                {/* Main Glass Card */}
                                <div className="absolute inset-x-4 inset-y-12 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-2xl shadow-indigo-500/10 flex flex-col overflow-hidden z-20">
                                    {/* App Header */}
                                    <div className="h-16 border-b border-white/20 flex items-center px-6 justify-between bg-white/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                                <User className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">Alex Martin</span>
                                                <span className="text-[10px] text-slate-500 font-medium">Free Plan</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="px-2 py-1 rounded-md bg-white/50 border border-white/60 text-[10px] font-semibold text-slate-600 shadow-sm">
                                                5 Crédits
                                            </div>
                                        </div>
                                    </div>

                                    {/* App Body */}
                                    <div className="p-6 flex flex-col gap-4">
                                        {/* Activity Card */}
                                        <div className="bg-white/60 rounded-xl p-4 border border-white/60 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800">Senior Product Designer</h4>
                                                    <p className="text-xs text-slate-500">Google • Paris, France</p>
                                                </div>
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" className="w-6 h-6" />
                                            </div>

                                            <div className="flex items-center gap-3 bg-white/50 rounded-lg p-2 border border-blue-100/50">
                                                <div className="relative w-10 h-10 flex items-center justify-center">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                        <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                        <path className="text-emerald-500 drop-shadow-md" strokeDasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                    </svg>
                                                    <span className="absolute text-[10px] font-bold text-emerald-600">92%</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-semibold text-slate-700">Excellent Match</div>
                                                    <div className="text-[10px] text-slate-500">Votre profil correspond aux attentes.</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Networking Suggestion */}
                                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg text-white relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />

                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold border border-white/20">
                                                    JD
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold">Jean Dupont</div>
                                                    <div className="text-[10px] text-slate-400">Head of Design @ Google</div>
                                                </div>
                                                <div className="ml-auto">
                                                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                                </div>
                                            </div>

                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full w-3/4 bg-indigo-500 rounded-full animate-pulse" />
                                            </div>
                                            <div className="flex justify-between mt-1.5">
                                                <span className="text-[9px] text-indigo-300 font-medium">Email Trouvé</span>
                                                <span className="text-[9px] text-slate-500">Confiance: High</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute -right-8 top-20 bg-white p-4 rounded-2xl shadow-xl shadow-purple-500/10 z-30 animate-bounce delay-700 duration-[3s]">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-medium">CV Score</div>
                                            <div className="text-lg font-bold text-slate-800">Excellent</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -left-8 bottom-32 bg-slate-900 p-4 rounded-2xl shadow-xl shadow-indigo-500/20 z-30 animate-bounce delay-100 duration-[4s]">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        <div>
                                            <div className="text-xs text-slate-400 font-medium">Offres Ciblées</div>
                                            <div className="text-lg font-bold text-white">+15 New</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-10 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-8">
                        {t('hero.joinedTeams')}
                    </p>
                    {/* Scrolling Marquee Container */}
                    <div className="relative w-full overflow-hidden mask-linear-fade">
                        {/* Inner Sliding Track */}
                        <div className="flex gap-16 animate-marquee items-center py-4">
                            {/* First set of logos */}
                            <div className="flex items-center gap-16 shrink-0 transition-all duration-300">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-8 md:h-10 w-auto object-contain mt-2" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" alt="Spotify" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="h-6 md:h-8 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" alt="Airbnb" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM" className="h-8 md:h-12 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png" alt="Salesforce" className="h-8 md:h-16 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/2560px-Oracle_logo.svg.png" alt="Oracle" className="h-6 md:h-8 w-auto object-contain" />
                            </div>

                            <div className="flex items-center gap-16 shrink-0 transition-all duration-300" aria-hidden="true">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-8 md:h-10 w-auto object-contain mt-2" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" alt="Spotify" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="h-6 md:h-8 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" alt="Airbnb" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://static.cdnlogo.com/logos/s/54/samsung.svg" alt="Samsung" className="h-8 md:h-12 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM" className="h-8 md:h-12 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png" alt="Salesforce" className="h-8 md:h-16 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/2560px-Oracle_logo.svg.png" alt="Oracle" className="h-6 md:h-8 w-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-white relative">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-50/50 rounded-full blur-[120px] pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                            {t('features.title')}
                        </h2>
                        <p className="text-lg text-slate-600">
                            {t('features.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {/* Feature 1 - Large */}
                        <div className="md:col-span-2 p-10 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl group-hover:bg-indigo-50 transition-colors" />
                            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10" />

                            <div className="relative z-20">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="hidden sm:flex px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-100 items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        {t('features.cvOptimizer.badge')}
                                    </div>
                                </div>

                                <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">{t('features.cvOptimizer.title')}</h3>
                                <p className="text-slate-600 mb-8 text-lg max-w-md leading-relaxed font-medium">
                                    {t('features.cvOptimizer.description')}
                                </p>
                                <div className="flex flex-wrap gap-2.5">
                                    {t('features.cvOptimizer.tags').map((tag: string, i: number) => (
                                        <span key={i} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm group-hover:border-indigo-200 group-hover:bg-white group-hover:text-indigo-600 transition-all duration-300 cursor-default">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Tall (Dark) */}
                        <div className="md:row-span-2 p-10 rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:shadow-indigo-900/20 transition-all duration-300 group overflow-hidden relative flex flex-col justify-between">
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-[80px] group-hover:opacity-60 transition-opacity" />
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90 z-10" />

                            <div className="relative z-20">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center mb-8 text-indigo-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300 shadow-inner">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">{t('features.networking.title')}</h3>
                                <p className="text-slate-300 mb-8 leading-relaxed font-medium opacity-90">
                                    {t('features.networking.description')}
                                </p>
                            </div>

                            <div className="relative z-20 space-y-4 mt-auto">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group/card">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/20">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                        </div>
                                        <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{t('features.networking.target')}</div>
                                    </div>
                                    <div className="font-semibold text-lg text-white group-hover/card:text-indigo-200 transition-colors">{t('features.networking.targetVal')}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group/card">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/20">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        </div>
                                        <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">{t('features.networking.action')}</div>
                                    </div>
                                    <div className="font-semibold text-lg text-white group-hover/card:text-emerald-200 transition-colors">{t('features.networking.actionVal')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-10 rounded-[2rem] bg-white border border-slate-100 hover:border-purple-200 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:scale-110" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <Mail className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">{t('features.emailFinder.title')}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    {t('features.emailFinder.description')}
                                </p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-10 rounded-[2rem] bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-indigo-50 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">{t('features.speed.title')}</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {t('features.speed.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white rounded-full opacity-50 blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('howItWorks.title')}</h2>
                        <p className="text-slate-500">{t('howItWorks.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {[
                            { step: "01", title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc'), icon: FileText },
                            { step: "02", title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc'), icon: Sparkles },
                            { step: "03", title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc'), icon: Mail }
                        ].map((item, idx) => (
                            <div key={idx} className="relative flex flex-col items-center text-center group">
                                <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-200 shadow-lg flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 group-hover:border-indigo-500 group-hover:shadow-indigo-500/20 transition-all duration-300 z-10 relative">
                                    <item.icon className="w-8 h-8" />
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-slate-50">
                                        {item.step}
                                    </div>
                                </div>
                                {idx !== 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-slate-200 to-transparent -z-0" />
                                )}
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

