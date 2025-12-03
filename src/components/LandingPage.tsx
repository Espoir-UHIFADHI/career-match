
import { useAppStore } from "../store/useAppStore";
import { Button } from "./ui/Button";
import { ArrowRight, FileText, Users, Mail, Sparkles, CheckCircle2 } from "lucide-react";

export function LandingPage() {
    const { openAuthModal } = useAppStore();

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-indigo-50/50">
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-sm mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>Nouvelle IA Générative 2.0</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                        Décrochez votre Job de Rêve avec <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">l'Intelligence Artificielle</span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Optimisez votre CV pour les ATS, trouvez les bons contacts et obtenez leurs emails professionnels en quelques secondes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            onClick={openAuthModal}
                            className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 rounded-full transition-all hover:scale-105"
                        >
                            Commencer Gratuitement
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <p className="text-sm text-slate-500 mt-4 sm:mt-0 sm:ml-4">
                            5 crédits offerts à l'inscription
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Optimisation CV</h3>
                            <p className="text-slate-600 mb-4">
                                Passez le screening des ATS et des recruteurs exigeants (Big Four, MBB) grâce à une réécriture intelligente.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Analyse de compatibilité
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Bullet points "Action-Résultat"
                                </li>
                            </ul>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Networking Assistant</h3>
                            <p className="text-slate-600 mb-4">
                                Identifiez les décideurs clés et obtenez des stratégies d'approche personnalisées pour briser la glace.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Recherche ciblée LinkedIn
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Templates de messages
                                </li>
                            </ul>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Mail className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Email Finder</h3>
                            <p className="text-slate-600 mb-4">
                                Trouvez l'email professionnel de n'importe qui en quelques secondes à partir du nom et de l'entreprise.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Algorithme de prédiction
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Vérification de validité
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
