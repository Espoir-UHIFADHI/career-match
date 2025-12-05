import { useState } from "react";
import { Briefcase, FileText, User, Mail, Menu, X, Coins } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { cn } from "../lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "../hooks/useTranslation";

export function Layout({ children }: { children: React.ReactNode }) {
    const { step } = useAppStore();
    const { credits } = useUserStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t } = useTranslation();

    const navItems = [
        { id: 1, name: t('nav.uploadCV'), icon: FileText, activeSteps: [1, 2, 3, 4] },
        { id: 5, name: t('nav.networking'), icon: User, activeSteps: [5] },
        { id: 6, name: t('nav.emailPredictor'), icon: Mail, activeSteps: [6] },
    ];

    const handleNavClick = (id: number) => {
        useAppStore.getState().setStep(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900 bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => useAppStore.getState().setStep(0)}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:inline-block">
                            Career Match
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <SignedIn>
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => {
                                const isActive = item.activeSteps.includes(step);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => useAppStore.getState().setStep(item.id)}
                                        className={cn(
                                            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-indigo-600",
                                            isActive ? "text-indigo-600" : "text-slate-600"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </SignedIn>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />

                        {/* Credits Display */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                            <Coins className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold text-slate-700">{credits}</span>
                        </div>

                        {/* Auth Button */}
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                                    {t('nav.signIn')}
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "h-9 w-9 border border-slate-200"
                                    }
                                }}
                            />
                        </SignedIn>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl animate-slide-down">
                        <div className="p-4 space-y-2">
                            {navItems.map((item) => {
                                const isActive = item.activeSteps.includes(step);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-none mx-auto p-6 md:p-10 relative z-10">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-8 mt-auto">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <p>{t('nav.rights')}</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-900 transition-colors">{t('nav.privacyPolicy')}</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">{t('nav.termsOfService')}</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">{t('nav.contact')}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
