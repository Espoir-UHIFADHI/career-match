import React, { useState } from "react";
import { Briefcase, FileText, User, Mail, Menu, X, Coins } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { cn } from "../lib/utils";


export function Layout({ children }: { children: React.ReactNode }) {
    const { step } = useAppStore();
    const { credits } = useUserStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 1, name: "Upload CV", icon: FileText, activeSteps: [1, 2, 3, 4] },
        { id: 5, name: "Networking", icon: User, activeSteps: [5] },
        { id: 6, name: "Email Predictor", icon: Mail, activeSteps: [6] },
    ];

    const handleNavClick = (id: number) => {
        useAppStore.getState().setStep(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen font-sans text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:inline-block">
                            CV Match AI
                        </span>
                    </div>



                    {/* Desktop Navigation */}
                    <SignedIn>
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
                    </SignedIn>

                    <div className="flex items-center gap-4 ml-4">
                        {/* Credits Display */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-sm font-medium">
                            <Coins className="h-4 w-4" />
                            <span>{credits} Crédits</span>
                        </div>

                        {/* Auth Button */}
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                                    Connexion
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-lg animate-slide-down">
                        <div className="p-4 space-y-2">
                            {navItems.map((item) => {
                                const isActive = item.activeSteps.includes(step);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                                : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            isActive ? "bg-indigo-100" : "bg-slate-100"
                                        )}>
                                            <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-500")} />
                                        </div>
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
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
