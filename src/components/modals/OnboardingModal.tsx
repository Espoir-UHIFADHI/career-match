import { useState } from "react";
import { Button } from "../ui/Button";
import { Briefcase, ChevronRight, X } from "lucide-react";

const ROLES = [
    "Développeur / Ingénieur",
    "Product Manager",
    "Data Analyst / Data Scientist",
    "Marketing / Communication",
    "Commercial / Business Dev",
    "Designer UX/UI",
    "Finance / Comptabilité",
    "RH / Recrutement",
    "Chef de Projet",
    "Consultant",
    "Autre",
];

const INDUSTRIES = [
    "Tech / Startups",
    "Finance / Banque",
    "Santé / Pharma",
    "Conseil",
    "E-commerce / Retail",
    "Industrie / Manufacturing",
    "Média / Créatif",
    "Public / Associatif",
    "Autre",
];

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: (role: string, industry: string) => void;
    onSkip: () => void;
}

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
    const [role, setRole] = useState("");
    const [industry, setIndustry] = useState("");
    const [customRole, setCustomRole] = useState("");
    const [step, setStep] = useState<1 | 2>(1);

    if (!isOpen) return null;

    const handleRoleNext = () => {
        if (!role) return;
        setStep(2);
    };

    const handleFinish = () => {
        const finalRole = role === "Autre" ? customRole.trim() || "Autre" : role;
        onComplete(finalRole, industry || "Non précisé");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-slide-up">
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {step === 1 ? "Quel poste visez-vous ?" : "Dans quel secteur ?"}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {step === 1 ? "Étape 1/2" : "Étape 2/2"} - Pour personnaliser vos analyses
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: step === 1 ? "50%" : "100%" }}
                    />
                </div>

                {step === 1 ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.filter(r => r !== "Autre").map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                                        role === r
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                            <button
                                onClick={() => setRole("Autre")}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                                    role === "Autre"
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                                }`}
                            >
                                Autre
                            </button>
                        </div>
                        {role === "Autre" && (
                            <input
                                autoFocus
                                type="text"
                                placeholder="Précisez votre poste visé"
                                value={customRole}
                                onChange={(e) => setCustomRole(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        )}
                        <Button
                            onClick={handleRoleNext}
                            disabled={!role || (role === "Autre" && !customRole.trim())}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl mt-2 flex items-center justify-center gap-2"
                        >
                            Continuer <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            {INDUSTRIES.map((ind) => (
                                <button
                                    key={ind}
                                    onClick={() => setIndustry(ind)}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                                        industry === ind
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                >
                                    {ind}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={handleFinish}
                            disabled={!industry}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl mt-2"
                        >
                            Commencer mon analyse →
                        </Button>
                        <button
                            onClick={() => onComplete(role, "Non précisé")}
                            className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors text-center py-1"
                        >
                            Passer cette étape
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
