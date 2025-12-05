import { SignInButton } from "@clerk/clerk-react";
import { Button } from "./ui/Button";
import { ArrowRight, FileText, Mail, Sparkles, Zap, Star, CheckCircle, Smartphone, Globe, Shield, User } from "lucide-react";

export function LandingPage() {

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
                            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/80 border border-indigo-100 shadow-sm backdrop-blur-md text-indigo-600 text-sm font-semibold animate-fade-in group hover:scale-105 transition-transform cursor-pointer">
                                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse relative">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
                                </span>
                                <span className="tracking-wide">Nouvelle version AI 2.0</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8 animate-slide-up">
                                Votre Carrière <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
                                    Mérite L'Excellence
                                </span>
                            </h1>

                            <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10 animate-slide-up animation-delay-200">
                                La première plateforme IA qui transforme votre CV anonyme en opportunité concrète. Optimisez, ciblez, et connectez-vous aux recruteurs en un clic.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up animation-delay-400">
                                <SignInButton mode="modal">
                                    <Button
                                        className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-indigo-500/20 rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm" />
                                        <span className="relative flex items-center">
                                            Commencer Gratuitement
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>
                                </SignInButton>
                                <Button
                                    variant="outline"
                                    className="h-14 px-8 text-lg bg-white/60 hover:bg-white border-slate-200 text-slate-700 rounded-2xl backdrop-blur-sm transition-all hover:shadow-lg hover:border-indigo-200"
                                >
                                    Voir la démo
                                </Button>
                            </div>

                            <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 animate-fade-in animation-delay-500">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-md relative">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col items-start bg-white/50 px-3 py-1 rounded-lg backdrop-blur-sm border border-slate-100">
                                    <div className="flex text-amber-400 mb-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                    </div>
                                    <span className="font-semibold text-slate-700 text-xs">4.9/5 par +1000 pros</span>
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
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" className="w-6 h-6" />
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
                        Ils ont rejoint les meilleures équipes
                    </p>
                    {/* Scrolling Marquee Container */}
                    <div className="relative w-full overflow-hidden mask-linear-fade">
                        {/* Inner Sliding Track */}
                        <div className="flex gap-16 animate-marquee items-center py-4">
                            {/* First set of logos */}
                            <div className="flex items-center gap-16 shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-8 md:h-10 w-auto object-contain mt-2" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" alt="Spotify" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="h-6 md:h-8 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" alt="Airbnb" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://static.cdnlogo.com/logos/c/68/capgemini-2017.svg" alt="Capgemini" className="h-6 md:h-8 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Sopra_Steria_logo.svg" alt="Sopra Steria" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/CIMPA_logo.svg" alt="CIMPA" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/%C3%89lectricit%C3%A9_de_France_logo.svg" alt="EDF" className="h-8 md:h-12 w-auto object-contain" />
                            </div>

                            {/* Duplicate set for seamless loop */}
                            <div className="flex items-center gap-16 shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100" aria-hidden="true">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-8 md:h-10 w-auto object-contain mt-2" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" alt="Spotify" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="h-6 md:h-8 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" alt="Airbnb" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://static.cdnlogo.com/logos/c/68/capgemini-2017.svg" alt="Capgemini" className="h-6 md:h-8 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Sopra_Steria_logo.svg" alt="Sopra Steria" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/CIMPA_logo.svg" alt="CIMPA" className="h-8 md:h-10 w-auto object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/%C3%89lectricit%C3%A9_de_France_logo.svg" alt="EDF" className="h-8 md:h-12 w-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features layout (Bento Grid) */}
            <section className="py-24 bg-white relative">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-50/50 rounded-full blur-[120px] pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                            Tout ce dont vous avez besoin.
                        </h2>
                        <p className="text-lg text-slate-600">
                            Une suite d'outils puissants pour maximiser vos chances de réussite.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {/* Feature 1 - Large */}
                        <div className="md:col-span-2 p-10 rounded-[2rem] bg-white border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-50/80 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-8 text-indigo-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">CV Optimizer Pro</h3>
                                <p className="text-slate-600 mb-8 text-lg max-w-md leading-relaxed">
                                    Notre IA analyse votre CV contre les descriptions de poste et le réécrit pour passer les filtres ATS.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm group-hover:border-indigo-200 transition-colors">
                                        Analyse ATS
                                    </span>
                                    <span className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm group-hover:border-indigo-200 transition-colors">
                                        Mots-clés Intelligents
                                    </span>
                                    <span className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm group-hover:border-indigo-200 transition-colors">
                                        Réécriture Auto
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Tall */}
                        <div className="md:row-span-2 p-10 rounded-[2rem] bg-slate-900 text-white hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 group overflow-hidden relative">
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center mb-8 text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Networking AI</h3>
                                <p className="text-slate-300 mb-8 leading-relaxed">
                                    Ne postulez plus dans le vide. Trouvez la bonne personne à contacter et laissez l'IA rédiger le message d'approche parfait.
                                </p>

                                <div className="mt-auto space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                                            <div className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Cible</div>
                                        </div>
                                        <div className="font-semibold text-lg">Recruteurs & Hiring Managers</div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <div className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Action</div>
                                        </div>
                                        <div className="font-semibold text-lg">Draft Message Personnalisé</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-10 rounded-[2rem] bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 group">
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Email Finder</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Algorithme de prédiction d'emails professionnels vérifié à 98% pour contacter directement les décideurs.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-10 rounded-[2rem] bg-gradient-to-br from-indigo-50/50 to-white border border-slate-200 hover:shadow-xl transition-all duration-300 group">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Rapidité Éclair</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Générez, optimisez et envoyez. Ce qui prenait des heures ne prend plus que quelques minutes.
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
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Comment ça marche ?</h2>
                        <p className="text-slate-500">3 étapes simples vers votre nouveau job</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {[
                            { step: "01", title: "Analysez", desc: "Uploadez votre CV et une offre d'emploi.", icon: FileText },
                            { step: "02", title: "Optimisez", desc: "Obtenez un CV sur-mesure et un score de match.", icon: Sparkles },
                            { step: "03", title: "Connectez", desc: "Identifiez et contactez les recruteurs clés.", icon: Mail }
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
