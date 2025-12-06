import { Check, X, Zap, Coins, Rocket, Briefcase, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";
import { useUserStore } from "../store/useUserStore";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";

export function PricingPage() {
    const { credits } = useUserStore();
    const { t } = useTranslation();
    const { user } = useUser();
    const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

    const handleCheckout = (productSlug: string) => {
        if (!user) {
            alert("Veuillez vous connecter pour acheter des crédits.");
            return;
        }

        setLoadingProduct(productSlug);

        // Gumroad URL construction with custom tracking parameters
        // These are critical for the webhook to credit the correct user
        const baseUrl = `https://careermatch.gumroad.com/l/${productSlug}`;
        const params = new URLSearchParams({
            custom_user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || ''
        });

        const gumroadUrl = `${baseUrl}?${params.toString()}`;

        window.open(gumroadUrl, '_blank');

        // Simple timeout to reset loading state as we open in new tab
        setTimeout(() => setLoadingProduct(null), 2000);
    };

    const plans = [
        {
            id: "free",
            name: t('pricingPage.plans.free.name'),
            price: "TwR 0",
            credits: "7 Crédits",
            description: t('pricingPage.plans.free.description'),
            features: [
                { name: t('pricingPage.plans.free.features.feat1'), included: true },
                { name: t('pricingPage.plans.free.features.feat2'), included: true },
                { name: t('pricingPage.plans.free.features.feat3'), included: true },
                { name: t('pricingPage.plans.free.features.feat4'), included: false },
            ],
            buttonText: t('pricingPage.plans.free.button'),
            buttonVariant: "outline" as const,
            popular: false,
            disabled: true,
            icon: Coins,
            slug: ""
        },
        {
            id: "booster",
            name: t('pricingPage.plans.booster.name'),
            price: "6.99 €",
            credits: "+20 Crédits",
            description: t('pricingPage.plans.booster.description'),
            features: [
                { name: t('pricingPage.plans.booster.features.feat1'), included: true },
                { name: t('pricingPage.plans.booster.features.feat2'), included: true },
                { name: t('pricingPage.plans.booster.features.feat3'), included: true },
                { name: t('pricingPage.plans.booster.features.feat4'), included: true },
            ],
            buttonText: t('pricingPage.plans.booster.button'),
            buttonVariant: "primary" as const,
            popular: true,
            disabled: false,
            icon: Zap,
            slug: "pack-booster"
        },
        {
            id: "pro",
            name: t('pricingPage.plans.pro.name'),
            price: "29.99 €",
            credits: "+100 Crédits",
            description: t('pricingPage.plans.pro.description'),
            features: [
                { name: t('pricingPage.plans.pro.features.feat1'), included: true },
                { name: t('pricingPage.plans.pro.features.feat2'), included: true },
                { name: t('pricingPage.plans.pro.features.feat3'), included: true },
                { name: t('pricingPage.plans.pro.features.feat4'), included: true },
            ],
            buttonText: t('pricingPage.plans.pro.button'),
            buttonVariant: "secondary" as const,
            popular: false,
            disabled: false,
            icon: Rocket,
            slug: "career-coach"
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                    {t('pricingPage.title')}
                </h1>
                <p className="text-lg text-slate-600">
                    {t('pricingPage.subtitle')}
                </p>

                {/* Current Balance Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-medium text-sm mt-4">
                    <Briefcase className="w-4 h-4" />
                    <span>{t('pricingPage.currentBalance').replace('{amount}', credits.toString())}</span>
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
                                    {t('pricingPage.recommended')}
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
                                {plan.id !== "free" && <span className="text-slate-500 text-sm">{t('pricingPage.unique')}</span>}
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
                            onClick={() => plan.slug && handleCheckout(plan.slug)}
                            disabled={plan.disabled || (!!plan.slug && loadingProduct === plan.slug)}
                        >
                            {plan.slug && loadingProduct === plan.slug ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                plan.buttonText
                            )}
                        </Button>
                    </div>
                ))}
            </div>

            {/* FAQ / Reassurance Section could go here */}
            <div className="mt-12 text-center text-sm text-slate-500">
                <p>{t('pricingPage.securePayment')}</p>
            </div>
        </div>
    );
}
