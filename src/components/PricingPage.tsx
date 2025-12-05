import { Check, X, Zap, Coins, Rocket, Briefcase } from "lucide-react";
import { Button } from "./ui/Button";
import { useUserStore } from "../store/useUserStore";
import { cn } from "../lib/utils";
// import { useTranslation } from "../hooks/useTranslation";

export function PricingPage() {
    const { credits } = useUserStore();
    // const { t } = useTranslation();

    // Placeholder for Stripe checkout
    const handleCheckout = (priceId: string) => {
        console.log("Checkout initiated for:", priceId);
        // TODO: Implement Stripe Checkout
    };

    const plans = [
        {
            id: "free",
            name: "Découverte",
            price: "TwR 0", // Using TwR as symbol for "0€" but clearly stated as free
            credits: "7 Crédits",
            description: "Pour tester l'outil gratuitement.",
            features: [
                { name: "Analyse CV & Offre", included: true },
                { name: "Optimisation IA basique", included: true },
                { name: "Networking : Recherche limitée", included: true },
                { name: "Emails Hunter : Verrouillés", included: false },
            ],
            buttonText: "Plan Actuel",
            buttonVariant: "outline" as const,
            popular: false,
            disabled: true,
            icon: Coins
        },
        {
            id: "booster",
            name: "Pack Booster",
            price: "4.99 €",
            credits: "+20 Crédits",
            description: "Pour une candidature spécifique.",
            features: [
                { name: "Tout du gratuit", included: true },
                { name: "Déblocage des emails Hunter", included: true },
                { name: "4 emails inclus (via crédits)", included: true },
                { name: "Accès prioritaire", included: true },
            ],
            buttonText: "Acheter 20 Crédits",
            buttonVariant: "primary" as const,
            popular: true,
            disabled: false,
            icon: Zap
        },
        {
            id: "pro",
            name: "Career Coach",
            price: "19.99 €",
            credits: "+100 Crédits",
            description: "Pour une recherche intensive.",
            features: [
                { name: "Coût par action réduit (-50%)", included: true },
                { name: "Idéal pour 20+ recruteurs", included: true },
                { name: "Support Prioritaire", included: true },
                { name: "Accès à toutes les fonctions", included: true },
            ],
            buttonText: "Acheter 100 Crédits",
            buttonVariant: "secondary" as const,
            popular: false,
            disabled: false,
            icon: Rocket
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                    Investissez dans votre <span className="text-indigo-600">Avenir</span>
                </h1>
                <p className="text-lg text-slate-600">
                    Des crédits flexibles pour booster votre recherche d'emploi.
                    Payez uniquement ce que vous utilisez.
                </p>

                {/* Current Balance Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-medium text-sm mt-4">
                    <Briefcase className="w-4 h-4" />
                    <span>Votre solde actuel : {credits} Crédits</span>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl flex flex-col",
                            plan.popular
                                ? "border-indigo-600 shadow-lg scale-105 z-10"
                                : "border-slate-200 hover:-translate-y-1"
                        )}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                                    Recommandé
                                </span>
                            </div>
                        )}

                        <div className="mb-6 space-y-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                plan.popular ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                            )}>
                                <plan.icon className="w-6 h-6" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                                {plan.id !== "free" && <span className="text-slate-500 text-sm">/ unique</span>}
                            </div>

                            <div className="inline-block bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-md border border-emerald-100">
                                {plan.credits}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm">
                                    {feature.included ? (
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    ) : (
                                        <X className="w-5 h-5 text-slate-300 shrink-0" />
                                    )}
                                    <span className={cn(
                                        feature.included ? "text-slate-700" : "text-slate-400"
                                    )}>
                                        {feature.name}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            variant={plan.buttonVariant}
                            className={cn(
                                "w-full py-6 text-base font-semibold",
                                plan.popular ? "shadow-lg shadow-indigo-600/20" : ""
                            )}
                            onClick={() => handleCheckout(plan.id)}
                            disabled={plan.disabled}
                        >
                            {plan.buttonText}
                        </Button>
                    </div>
                ))}
            </div>

            {/* FAQ / Reassurance Section could go here */}
            <div className="mt-12 text-center text-sm text-slate-500">
                <p>Paiement sécurisé via Stripe. Facture disponible immédiatement.</p>
            </div>
        </div>
    );
}
