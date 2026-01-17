import { ClerkProvider } from '@clerk/clerk-react';
import { useAppStore } from '../store/useAppStore';
import { enUS, frFR } from '@clerk/localizations';

// Import your publishable key
let PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Sanitize the key: remove quotes if the user accidentally included them in Vercel env vars
if (PUBLISHABLE_KEY) {
    PUBLISHABLE_KEY = PUBLISHABLE_KEY.trim().replace(/^"|"$/g, '');
}

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}

// Validation check associated to console for easier debugging in production
if (!PUBLISHABLE_KEY.startsWith("pk_")) {
    console.error("Config Error: Clerk Publishable Key does not start with 'pk_'. Check your .env or Vercel Environment Variables.");
} else {
    console.log("Clerk Key loaded successfully (" + PUBLISHABLE_KEY.substring(0, 8) + "...)");
}

const frLocalization = {
    ...frFR,
    formFieldLabel__optional: '',
    formFieldLabel__username: "Nom d'utilisateur (lettres, chiffres, - ou _)",
};

export function Providers({ children }: { children: React.ReactNode }) {
    const { language } = useAppStore();

    // Default to enUS if language is 'English' or anything else
    // Use custom frLocalization only for 'French'
    const localization = language === 'French' ? frLocalization : enUS;

    return (
        <ClerkProvider localization={localization} publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            {children}
        </ClerkProvider>
    );
}
