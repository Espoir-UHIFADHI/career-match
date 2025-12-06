import { useState } from "react";
import { FileText, User, Mail, Menu, X, Coins, Zap } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
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
        { id: 7, name: t('nav.pricing'), icon: Coins, activeSteps: [7] },
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
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
                            <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300 transform -rotate-12" />
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

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <LanguageSwitcher />
                        <SignedIn>

                            {/* Credits Display */}
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => useAppStore.getState().setStep(7)}
                            >
                                <Coins className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-bold text-slate-900">{credits}</span>
                            </div>
                        </SignedIn>

                        {/* Auth Button */}
                        <SignedOut>
                            <div className="flex items-center gap-4">
                                <SignInButton mode="modal">
                                    <button className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                                        {t('nav.signIn')}
                                    </button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30">
                                        {t('nav.signUp')}
                                    </button>
                                </SignUpButton>
                            </div>
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
                    </div>

                    {/* Mobile Actions */}
                    <div className="md:hidden flex items-center gap-2 mr-2">
                        <LanguageSwitcher />
                        <SignedIn>
                            <div
                                className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => useAppStore.getState().setStep(7)}
                            >
                                <Coins className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-bold text-slate-900">{credits}</span>
                            </div>
                        </SignedIn>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl animate-slide-down max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="p-4 space-y-2">
                            <SignedIn>
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
                            </SignedIn>

                            {/* Mobile Menu Items */}
                            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-4">
                                {/* Language and Credits moved to top bar for mobile */}
                                {/* Keep them here? No, requested "Navigation Bar" usually means top. 
                                    If user wants them in menu, they wouldn't say "Fais le sur mobile" after I put them in menu. 
                                    I will remove them from here to avoid clutter. 
                                */}

                                <div className="px-4 pb-4">
                                    <SignedOut>
                                        <div className="flex flex-col gap-3">
                                            <SignInButton mode="modal">
                                                <button className="w-full py-2.5 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                                                    {t('nav.signIn')}
                                                </button>
                                            </SignInButton>
                                            <SignUpButton mode="modal">
                                                <button className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                                                    {t('nav.signUp')}
                                                </button>
                                            </SignUpButton>
                                        </div>
                                    </SignedOut>
                                    <SignedIn>
                                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
                                            <UserButton afterSignOutUrl="/" />
                                            <span className="text-sm font-medium text-slate-700">Mon Profil</span>
                                        </div>
                                    </SignedIn>
                                </div>
                            </div>
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
                        <button onClick={() => useAppStore.getState().setStep(8)} className="hover:text-slate-900 transition-colors text-left">{t('nav.privacyPolicy')}</button>
                        <button onClick={() => useAppStore.getState().setStep(9)} className="hover:text-slate-900 transition-colors text-left">{t('nav.termsOfService')}</button>
                        <button onClick={() => useAppStore.getState().setStep(10)} className="hover:text-slate-900 transition-colors text-left">{t('nav.contact')}</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
