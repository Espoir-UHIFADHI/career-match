import { useState } from "react";
import { Toaster, toast } from "sonner";
import { FileText, User, Mail, Menu, X, Coins } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { useNavigate, Link } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";

export function Layout({ children }: { children: React.ReactNode }) {
    const { step } = useAppStore();
    const { credits } = useUserStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t } = useTranslation();
    const { user } = useUser();
    const clerk = useClerk();
    const [isSignInLoading, setIsSignInLoading] = useState(false);
    const [isSignUpLoading, setIsSignUpLoading] = useState(false);
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const handleSignInClick = () => {
        setIsSignInLoading(true);
        setTimeout(() => setIsSignInLoading(false), 3000);
    };

    const handleSignUpClick = () => {
        setIsSignUpLoading(true);
        setTimeout(() => setIsSignUpLoading(false), 3000);
    };

    const handleProtectedNavigation = (stepId: number) => {
        if (!user) {
            clerk.openSignIn();
        } else {
            useAppStore.getState().setStep(stepId);
            navigate('/app');
        }
    };

    const navItems = [
        { id: 1, name: t('nav.uploadCV'), icon: FileText, activeSteps: [1, 2, 3, 4] },
        { id: 5, name: t('nav.networking'), icon: User, activeSteps: [5] },
        { id: 6, name: t('nav.emailPredictor'), icon: Mail, activeSteps: [6] },
        { id: 7, name: t('nav.pricing'), icon: Coins, activeSteps: [7] },
    ];

    const handleNavClick = (id: number) => {
        useAppStore.getState().setStep(id);
        navigate('/app');
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                            if (!user) {
                                useAppStore.getState().setStep(0);
                                navigate('/');
                            } else {
                                // Smart Resumption Logic
                                const { cvData, jobData, analysisResults } = useAppStore.getState();
                                if (analysisResults) {
                                    useAppStore.getState().setStep(3); // Analysis Dashboard
                                } else if (cvData && jobData) {
                                    useAppStore.getState().setStep(3); // Ready to analyze
                                } else if (cvData) {
                                    useAppStore.getState().setStep(2); // Job Input
                                } else {
                                    useAppStore.getState().setStep(1); // Upload
                                }
                                navigate('/app');
                            }
                        }}
                    >
                        <img src="/career-match.png" alt="Career Match" className="h-10 w-10 object-contain" />
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
                                        onClick={() => {
                                            useAppStore.getState().setStep(item.id);
                                            navigate('/app');
                                        }}
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

                        <LanguageSelector />

                        <SignedIn>

                            {/* Credits Display */}
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => {
                                    useAppStore.getState().setStep(7);
                                    navigate('/app');
                                }}
                            >
                                <Coins className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-bold text-slate-900">
                                    {user?.primaryEmailAddress?.emailAddress === 'espoiradouwekonou20@gmail.com' ? '∞' : credits}
                                </span>
                            </div>
                        </SignedIn>

                        {/* Auth Button */}
                        <SignedOut>
                            <div className="flex items-center gap-4">
                                <SignInButton mode="modal">
                                    <button
                                        onClick={handleSignInClick}
                                        disabled={isSignInLoading || isSignUpLoading}
                                        className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors disabled:opacity-50">
                                        {isSignInLoading ? t('common.loading') : t('nav.signIn')}
                                    </button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button
                                        onClick={handleSignUpClick}
                                        disabled={isSignInLoading || isSignUpLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSignUpLoading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
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

                        <SignedIn>
                            <div
                                className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => {
                                    useAppStore.getState().setStep(7);
                                    navigate('/app');
                                }}
                            >
                                <Coins className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-bold text-slate-900">
                                    {user?.primaryEmailAddress?.emailAddress === 'espoiradouwekonou20@gmail.com' ? '∞' : credits}
                                </span>
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
                            <div className="px-4 pb-2">
                                <LanguageSelector className="justify-center w-full" />
                            </div>

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
            <footer className="border-t border-slate-200 bg-white pt-16 pb-8 mt-auto">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Column 1: Brand & Mission */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <img src="/career-match.png" alt="Career Match" className="h-8 w-8 object-contain" />
                                <span className="text-xl font-bold tracking-tight text-slate-900">Career Match</span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                                {t('footer.mission')}
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                {/* LinkedIn */}
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer">
                                    <span className="sr-only">LinkedIn</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </a>
                                {/* Twitter */}
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                                </a>
                            </div>
                        </div>

                        {/* Column 2: Product */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-6">{t('footer.product')}</h3>
                            <ul className="space-y-4">
                                <li><Link to="/" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.features')}</Link></li>
                                <li><Link to="/pricing" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.pricing')}</Link></li>
                                <li>
                                    <button onClick={() => handleProtectedNavigation(5)} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">
                                        {t('nav.networking')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => handleProtectedNavigation(6)} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">
                                        {t('nav.emailPredictor')}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Company */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-6">{t('footer.company')}</h3>
                            <ul className="space-y-4">
                                <li><Link to="/about" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.about')}</Link></li>
                                <li><Link to="/blog" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.blog')}</Link></li>
                                <li><Link to="/contact" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.contact')}</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Legal */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-6">{t('footer.legal')}</h3>
                            <ul className="space-y-4">
                                <li><Link to="/privacy" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.privacy')}</Link></li>
                                <li><Link to="/terms" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.terms')}</Link></li>
                                <li><Link to="/privacy" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm">{t('footer.cookies')}</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-400 text-sm">
                            {t('footer.rights')}
                        </p>

                    </div>
                </div>
            </footer>

            {/* Admin Action for Resend Sync - Global */}
            {/* Admin Action for Resend Sync - Global */}
            <SignedIn>
                {user?.primaryEmailAddress?.emailAddress === 'espoiradouwekonou20@gmail.com' && (
                    <div className="fixed bottom-4 left-4 z-50">
                        <button
                            onClick={() => {
                                toast.promise(async () => {
                                    const token = await getToken({ template: 'supabase' });
                                    const { createClerkSupabaseClient } = await import('../services/supabase');
                                    const supabase = createClerkSupabaseClient(token || "");

                                    const { data, error } = await supabase.functions.invoke('sync-resend-contacts');

                                    if (error) throw new Error(error.message || "Erreur inconnue");
                                    if (data.errors?.length > 0) {
                                        console.error("Sync Errors:", data.errors);
                                        // We resolve but with a warning message in success, or throw? 
                                        // Let's throw if user wants to know it failed partially, or return data if partial success.
                                        // Let's treat partial success as success but mention errors in message.
                                    }
                                    return data;
                                }, {
                                    loading: 'Synchronisation Cloud en cours...',
                                    success: (data: any) => {
                                        const errCount = data.errors?.length || 0;
                                        if (errCount > 0) return `Terminé avec ${errCount} erreurs. Synced: ${data.synced}`;
                                        return `Succès ! ${data.synced} contacts mis à jour.`;
                                    },
                                    error: (err) => `Erreur : ${err.message}`
                                });
                            }}
                            className="bg-slate-900 text-white border border-slate-700 shadow-xl hover:bg-slate-800 text-xs px-3 py-2 rounded-md font-bold flex items-center gap-2 transition-all active:scale-95"
                        >
                            ⚡ Admin: Sync Resend
                        </button>
                    </div>
                )}
            </SignedIn>
            <Toaster richColors position="top-center" />
        </div>
    );
}
