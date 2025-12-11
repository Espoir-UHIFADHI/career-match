
import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import careersData from "../../data/seo-careers.json";
import { Button } from "../ui/Button";
import { ArrowRight, CheckCircle, Sparkles, TrendingUp, Users, Target } from "lucide-react";

export function CareerTemplate() {
    const { slug } = useParams<{ slug: string }>();
    const career = careersData.find((c) => c.slug === slug);

    if (!career) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{career.metaTitle} | Career Match</title>
                <meta name="description" content={career.metaDescription} />
                <link rel="canonical" href={`https://careermatch.fr/career/${slug}`} />
            </Helmet>

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
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 shadow-sm animate-fade-in-up">
                            <Sparkles className="w-4 h-4 fill-indigo-200" />
                            <span>Guide Carrière 2025 & Analyse IA</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.1] animate-fade-in-up animation-delay-100">
                            {career.heroTitle} <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                avec Career Match
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
                            {career.heroSubtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
                            <Link to="/app">
                                <Button className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 rounded-full w-full sm:w-auto transition-all hover:scale-105 group">
                                    Analyser mon CV pour ce poste
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <p className="text-sm text-slate-400 mt-4 sm:mt-0 font-medium">
                                7 crédits offerts à l'inscription
                            </p>
                        </div>
                    </div>
                </section>

                {/* Statistics / Market Trends (Simulated) */}
                <section className="py-12 border-y border-slate-200/60 bg-white/50 backdrop-blur-sm">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center text-center p-6">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mb-1">+15%</div>
                                <div className="text-sm text-slate-500 font-medium">Croissance du marché</div>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border-t md:border-t-0 md:border-l border-slate-100">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mb-1">Haute</div>
                                <div className="text-sm text-slate-500 font-medium">Demande Recruteurs</div>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border-t md:border-t-0 md:border-l border-slate-100">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mb-1">Top 10</div>
                                <div className="text-sm text-slate-500 font-medium">Métiers recherchés</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Skills Section */}
                <section className="py-24 bg-white relative">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                Compétences Clés pour <span className="text-indigo-600">{career.title}</span>
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Voici les mots-clés que les ATS et les recruteurs recherchent en priorité. Votre CV les contient-il ?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {career.keywords.map((keyword, i) => (
                                <div
                                    key={i}
                                    className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-start gap-4 cursor-default"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-700 transition-colors">{keyword}</h3>
                                        <p className="text-xs text-slate-500 font-medium">Indispensable</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900 z-0">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/40 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
                    </div>

                    <div className="container relative z-10 mx-auto px-6 text-center">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                                Votre carrière de {career.title} commence ici
                            </h2>
                            <p className="text-lg text-slate-300 mb-12 leading-relaxed">
                                Ne laissez pas un CV mal optimisé vous fermer des portes. Notre IA analyse votre compatibilité avec le poste de {career.title} en 10 secondes et vous dit exactement quoi corriger.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/app">
                                    <Button className="h-16 px-10 text-xl bg-white text-slate-900 hover:bg-slate-50 border-none shadow-2xl shadow-white/10 rounded-full w-full sm:w-auto transition-transform hover:scale-105">
                                        Commencer l'analyse gratuite
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
