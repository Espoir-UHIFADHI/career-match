import React from "react";
import { Briefcase, FileText, User, Mail } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
    const { step } = useAppStore();

    const navItems = [
        { id: 1, name: "Upload CV", icon: FileText, activeSteps: [1, 2, 3, 4] },
        { id: 5, name: "Networking", icon: User, activeSteps: [5] },
        { id: 6, name: "Email Predictor", icon: Mail, activeSteps: [6] },
    ];

    return (
        <div className="min-h-screen font-sans text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            CV Match AI
                        </span>
                    </div>

                    {/* Step Indicator */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                        {navItems.map((item, i) => {
                            const isActive = item.activeSteps.includes(step);
                            return (
                                <React.Fragment key={item.id}>
                                    <button
                                        onClick={() => useAppStore.getState().setStep(item.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                                : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                                        {item.name}
                                    </button>
                                    {i < navItems.length - 1 && (
                                        <div className="h-4 w-px bg-slate-300 mx-1" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-8 mt-auto">
                <div className="container mx-auto px-4 text-center text-sm text-slate-600">
                    <p>© 2024 CV Match & Optimize AI. <span className="text-indigo-600">Client-Side Processing Only.</span></p>
                </div>
            </footer>
        </div>
    );
}
