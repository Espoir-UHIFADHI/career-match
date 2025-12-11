import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import careersData from "../../data/seo-careers.json";
import { Button } from "../ui/Button";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export function CareerTemplate() {
    const { slug } = useParams<{ slug: string }>();
    const career = careersData.find((c) => c.slug === slug);
    const { t } = useTranslation();

    if (!career) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{career.metaTitle} | Career Match</title>
                <meta name="description" content={career.metaDescription} />
                <link rel="canonical" href={`https://career-match.com/career/${slug}`} />
            </Helmet>

            <div className="flex flex-col bg-slate-50 min-h-screen">
                {/* SEO Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
                    </div>

                    <div className="container relative z-10 mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>Guide Carrière 2025</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            {career.heroTitle} <span className="text-indigo-600">avec l'IA</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            {career.heroSubtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/app">
                                <Button className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 rounded-2xl w-full sm:w-auto">
                                    Analyser mon CV pour {career.title}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Content Section */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Compétences Clés pour {career.title}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {career.keywords.map((keyword, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-700">{keyword}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">Prêt à décrocher le job ?</h3>
                                <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                                    Ne laissez pas un CV mal optimisé vous fermer des portes. Notre IA analyse votre compatibilité avec le poste de {career.title} en 10 secondes.
                                </p>
                                <Link to="/app">
                                    <Button className="bg-white text-slate-900 hover:bg-indigo-50 border-none h-12 px-8">
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
